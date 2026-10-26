'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
type ReviewDoc={filename:string;rows:Record<string,string>[];text_for_review:string;warnings:string[]};
type Review={documents:ReviewDoc[];review_required:boolean;source_object:string};
function client(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Database unavailable');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'}});
}
export default function ReviewResult(){
 const [data,setData]=useState<Review|null>(null),[message,setMessage]=useState('');
 const [busy,setBusy]=useState(false),[next,setNext]=useState(0),[staged,setStaged]=useState<string[]>([]);
 async function load(){
  setBusy(true);setMessage('');
  try{
   const path=new URLSearchParams(window.location.search).get('path')||'';
   if(!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.json$/i.test(path))throw Error('Invalid review artifact reference');
   const {data:blob,error}=await client().storage.from('landshop-import-results').download(path);
   if(error||!blob)throw Error('Private result not found or reviewer lacks permission');
   const parsed=JSON.parse(await blob.text()) as Review;
   if(!Array.isArray(parsed.documents)||parsed.review_required!==true)throw Error('Review artifact is invalid');
   setData(parsed);setNext(0);setStaged([]);
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to load results')}
  finally{setBusy(false)}
 }
 const rows=data?.documents.flatMap(doc=>doc.rows.map(r=>({...r})))||[];
 async function stage(){
  if(!data)return;
  const chunk=rows.slice(next,next+100);
  if(!chunk.length)return;
  setBusy(true);setMessage('');
  try{
   const {data:batch,error}=await client().rpc('landshop_property_import_stage',{
    p_filename:'reviewed-extraction-'+String(next)+'.csv',p_rows:chunk
   });
   if(error||!batch)throw Error('Unable to stage these rows. Check required fields and limits.');
   setStaged(existing=>[...existing,String(batch)]);
   setNext(current=>current+chunk.length);
   setMessage('Rows '+(next+1)+'–'+(next+chunk.length)+' staged. A separate reviewer must approve this batch.');
  }catch(e){setMessage(e instanceof Error?e.message:'Staging failed')}
  finally{setBusy(false)}
 }
 return <main style={{minHeight:'100vh',background:'#f1f8f4',padding:'clamp(18px,4vw,55px)',fontFamily:'Arial,sans-serif',color:'#073d33'}}>
  <a href="/admin/properties/import/review">← Import Review Queue</a>
  <h1>Review Extracted Property Information</h1>
  <p>Nothing is published from this screen. Confirm the rows against original documents and resolve missing fields before staging.</p>
  <button disabled={busy} onClick={load}>Load Private Review Artifact</button>
  {data&&<section style={{marginTop:28}}>
   <p><strong>Source:</strong> {data.source_object}</p>
   <p><strong>Structured rows:</strong> {rows.length} · <strong>Staged:</strong> {next}</p>
   {data.documents.map((d,i)=><article key={i} style={{border:'1px solid #d9e7df',borderRadius:18,background:'white',padding:20,marginBottom:20}}>
    <h2>{d.filename}</h2><p>Rows extracted: {d.rows.length}</p>
    {d.warnings.map((w,j)=><p key={j} style={{color:'#955a20'}}>{w}</p>)}
    {!!d.text_for_review&&<details><summary>Extracted textual information (manual review)</summary>
     <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:350,overflow:'auto'}}>{d.text_for_review.slice(0,10000)}</pre>
    </details>}
   </article>)}
   {rows.length>0&&<section style={{background:'white',borderRadius:20,padding:25}}>
    <h2>Stage reviewed structured rows</h2>
    <p>The next 100 rows will be staged as an independently approved batch. Rows missing required information remain flagged.</p>
    <div style={{overflowX:'auto',maxHeight:350}}>
     <table style={{width:'100%',textAlign:'left'}}>
      <thead><tr><th>Title</th><th>Type</th><th>Price</th></tr></thead>
      <tbody>{rows.slice(next,next+25).map((r,i)=><tr key={next+i}>
       <td>{r.title||'Missing title'}</td><td>{r.property_type||'Missing type'}</td><td>{r.price||'—'}</td>
      </tr>)}</tbody>
     </table>
    </div>
    <button disabled={busy||next>=rows.length} onClick={stage}>Stage Next {Math.min(100,rows.length-next)} Rows</button>
    <p>Staged batch IDs: {staged.join(', ')||'none'}</p>
    <a href="/admin/properties/import/review">Open Approval Queue</a>
   </section>}
  </section>}
  <p role="status" aria-live="polite">{message}</p>
 </main>;
}
