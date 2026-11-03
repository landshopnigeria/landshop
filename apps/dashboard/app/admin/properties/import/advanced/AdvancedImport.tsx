'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';

const allowed=['csv','xlsx','xml','pdf','docx','zip'];
const mimeByExtension:Record<string,string[]>={
 csv:['text/csv','application/csv','application/vnd.ms-excel','text/plain'],
 xlsx:['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
 xml:['application/xml','text/xml','text/plain'],
 pdf:['application/pdf'],
 docx:['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
 zip:['application/zip','application/x-zip-compressed','application/x-zip']
};
const defaultMime:Record<string,string>={
 csv:'text/csv',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 xml:'application/xml',pdf:'application/pdf',
 docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',zip:'application/zip'
};
function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Not configured');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
}
type Job={job_id:string;status:string;result?:{review_result:string;row_count:number;document_count:number}};
export default function AdvancedImport({userId}:{userId:string}){
 const [file,setFile]=useState<File|null>(null),[job,setJob]=useState<Job|null>(null);
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const [privatePath,setPrivatePath]=useState('');
 async function submit(){
  if(!file)return;
  setBusy(true);setMessage('');setJob(null);
  try{
   const ext=file.name.split('.').pop()?.toLowerCase()||'';
   if(!allowed.includes(ext))throw Error('Unsupported document extension.');
   const reportedMime=file.type.toLowerCase().trim();
   if(reportedMime && !mimeByExtension[ext].includes(reportedMime))
    throw Error('The file type does not match its extension.');
   if(file.size===0||file.size>20*1024*1024)throw Error('Maximum 20 MiB per document.');
   // Browsers may omit MIME information for valid files. Preserve explicit
   // extension validation and let the isolated worker validate actual contents.
   const uploadMime=reportedMime||defaultMime[ext];
   const path=userId+'/'+crypto.randomUUID()+'.'+ext;
   const {error:uploadError}=await db().storage.from('landshop-import-uploads').upload(path,file,{
    contentType:uploadMime,upsert:false});
   if(uploadError)throw Error('Private upload failed. Check database and staff permissions.');
   setPrivatePath(path);
   const response=await fetch('/api/admin/properties/import/jobs',{method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({object_path:path})});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'Unable to enqueue extraction');
   setJob({job_id:data.job_id,status:'queued'});
   setMessage('File queued for extraction. No listing has been created or published.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to submit import')}
  finally{setBusy(false)}
 }
 async function check(){
  if(!job)return;
  setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/admin/properties/import/jobs/'+job.job_id,{credentials:'same-origin',cache:'no-store'});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'Unable to fetch status');
   setJob(data);
  }catch(e){setMessage(e instanceof Error?e.message:'Status check failed')}
  finally{setBusy(false)}
 }
 return <main style={{background:'#f1f8f4',minHeight:'100vh',fontFamily:'Arial,sans-serif',color:'#073d33',padding:'clamp(18px,5vw,60px)'}}>
  <nav aria-label="Property import workflow" style={{display:'flex',flexWrap:'wrap',gap:16,marginBottom:20}}>
   <a href="/admin/properties/import">CSV Import Center</a>
   <a href="/admin/properties/import/review">Import Approval Queue</a>
   <a href="/admin/properties">Property Management</a>
   <a href="/admin/properties/readiness">Publication Readiness</a>
  </nav>
  <h1>Advanced Bulk Property Import</h1>
  <p>Extract Excel, XML, PDF, Word and ZIP documents in an isolated Python worker. Extracted information must be reviewed before it becomes a draft property.</p>
  <section style={{maxWidth:850,padding:30,borderRadius:22,border:'1px solid #d0e4d8',background:'white'}}>
   <h2>Upload source documents</h2>
   <input type="file" aria-label="Select property file" accept=".csv,.xlsx,.xml,.pdf,.docx,.zip" onChange={e=>setFile(e.target.files?.[0]||null)}/>
   <p>20 MiB maximum. ZIP up to 100 files. Encrypted or unsafe archives are rejected. No automatic OCR or automated title verification.</p>
   <button disabled={!file||busy} onClick={submit} style={{background:'#078a6b',color:'white',border:0,borderRadius:12,padding:'14px 24px'}}>Upload and Queue Extraction</button>
   {job&&<section style={{marginTop:25,background:'#eaf5ee',borderRadius:15,padding:20}}>
    <h3>Job {job.job_id}</h3><p>Status: {job.status}</p>
    <button disabled={busy} onClick={check}>Refresh Job Status</button>
    {job.result&&<><p>{job.result.row_count} structured rows, {job.result.document_count} documents extracted.</p>
     <p>Review artifact: {job.result.review_result}</p>
     <p><a href={'/admin/properties/import/results?path='+encodeURIComponent(job.result.review_result)}>Open Review Artifact (authorized reviewers)</a></p></>}
   </section>}
   <p style={{fontSize:13,lineHeight:1.6}}>After extracting a file, open its review artifact, stage only verified rows, and have a different authorized reviewer approve the batch. Approved rows then move into draft property management. Nothing is published automatically.</p>
   {privatePath&&<p style={{fontSize:12}}>Uploaded source: {privatePath}</p>}
   <p role="status" aria-live="polite">{message}</p>
  </section>
 </main>;
}
