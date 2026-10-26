"""Landshop isolated import processing.
Only private bucket objects are processed; results go to a separate private bucket.
No direct writes to properties or approval statuses.
"""
import io
import json
import os
import re
from celery_app import celery_app
from document_ingestion import parse_document

PATH_PATTERN=re.compile(r'^[0-9a-f-]{36}/[a-zA-Z0-9_.-]{1,160}\.(csv|xlsx|xml|pdf|docx|zip)$',re.I)

def storage_client():
    from supabase import create_client
    url=os.environ['SUPABASE_URL']
    key=os.environ['SUPABASE_SERVICE_ROLE_KEY']
    return create_client(url,key)

@celery_app.task(bind=True,name='landshop.import.extract',max_retries=2,default_retry_delay=30)
def extract_import(self,object_path: str):
    if not isinstance(object_path,str) or not PATH_PATTERN.fullmatch(object_path):
        raise ValueError('Invalid private import reference')
    db=storage_client()
    try:
        content=db.storage.from_('landshop-import-uploads').download(object_path)
        if not isinstance(content,bytes): content=bytes(content)
        results=parse_document(object_path.rsplit('/',1)[-1],content)
        payload={
            'format_version':1,
            'source_object':object_path,
            'review_required':True,
            'documents':[{'filename':x.filename,'rows':x.rows,
                 'text_for_review':x.review_text,'warnings':x.warnings} for x in results]
        }
        encoded=json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode('utf-8')
        if len(encoded)>20*1024*1024:raise ValueError('Extracted result exceeds review limit')
        destination=object_path.split('/',1)[0]+'/'+self.request.id+'.json'
        db.storage.from_('landshop-import-results').upload(
            destination,encoded,{'content-type':'application/json','upsert':'false'}
        )
        return {'status':'requires_manual_review','review_result':destination,
                'row_count':sum(len(x.rows) for x in results),
                'document_count':len(results)}
    except (OSError,ConnectionError,TimeoutError) as exc:
        raise self.retry(exc=exc)
