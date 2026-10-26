'use client';
import {useState} from 'react';
type Doc={id:string;document_type:string};
export default function DocumentReview({documents}:{documents:Doc[]}){
 const [error,setError]=useState('');
 const [opening,setOpening]=useState<string|null>(null);
 async function openDocument(documentId:string){
  setError('');setOpening(documentId);
  // Open on direct user action, avoiding browser popup blocking after async fetch.
  const windowRef=window.open('about:blank','_blank');
  if(windowRef)windowRef.opener=null;
  try{
   const response=await fetch('/api/admin/kyc/document',{
     method:'POST',credentials:'same-origin',
     headers:{'Content-Type':'application/json'},body:JSON.stringify({documentId})
   });
   const result=await response.json();
   if(!response.ok||!result.url)throw Error(result.error||'Document access denied');
   if(windowRef)windowRef.location.href=result.url;
   else setError('Your browser blocked the document viewer. Enable popups and try again.');
  }catch(e){if(windowRef)windowRef.close();setError(e instanceof Error?e.message:'Unable to open document')}
  finally{setOpening(null)}
 }
 return <section><h3>Private documents</h3>
 <p>Access opens for 60 seconds and is logged. Inspect identity evidence before considering an approval.</p>
 <ul style={{display:'grid',gap:10}}>{documents.map(doc=><li key={doc.id}>
  <button disabled={opening!==null} onClick={()=>openDocument(doc.id)}
   style={{border:'1px solid #a6cfbe',padding:'10px 15px',borderRadius:10,background:'white'}}>
   {opening===doc.id?'Opening…':'Review '+doc.document_type.replaceAll('_',' ')}
  </button></li>)}</ul>
 {!documents.length&&<p>No documents available to review.</p>}
 <p role="alert">{error}</p>
 </section>;
}
