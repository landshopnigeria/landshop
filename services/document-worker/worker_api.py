"""Staff-facing app must authenticate employees before calling this internal service.
Never expose this process directly to the internet without network restrictions.
"""
import hmac
import os
import re
from fastapi import FastAPI,HTTPException,Header
from pydantic import BaseModel,Field
from celery.result import AsyncResult
from celery_app import celery_app
from tasks import extract_import

app=FastAPI(title='Landshop Internal Import Worker',docs_url=None,redoc_url=None,openapi_url=None)
FILE_PATH=re.compile(r'^[0-9a-f-]{36}/[a-zA-Z0-9_.-]{1,160}\.(csv|xlsx|xml|pdf|docx|zip)$',re.I)

class ImportJob(BaseModel):
    object_path:str=Field(min_length=40,max_length=240)

def authorized(token:str|None):
    expected=os.getenv('LANDSHOP_INTERNAL_WORKER_TOKEN')
    if not expected or not token or not hmac.compare_digest(token,expected):
        raise HTTPException(403,'Not authorized')

@app.get('/health')
def health():
    return {'status':'ok','service':'landshop-import-worker','publication_enabled':False}

@app.post('/internal/imports')
def submit_import(payload:ImportJob,x_landshop_worker_token:str|None=Header(default=None)):
    authorized(x_landshop_worker_token)
    if not FILE_PATH.fullmatch(payload.object_path):raise HTTPException(422,'Invalid path')
    job=extract_import.delay(payload.object_path)
    return {'job_id':job.id,'status':'queued'}

@app.get('/internal/imports/{job_id}')
def get_import_status(job_id:str,x_landshop_worker_token:str|None=Header(default=None)):
    authorized(x_landshop_worker_token)
    if not re.fullmatch(r'[0-9a-f-]{36}',job_id,re.I):raise HTTPException(422,'Invalid job')
    job=AsyncResult(job_id,app=celery_app)
    if job.failed():
        return {'job_id':job_id,'status':'failed'}
    if job.successful():
        return {'job_id':job_id,'status':'completed','result':job.result}
    return {'job_id':job_id,'status':job.status.lower()}
