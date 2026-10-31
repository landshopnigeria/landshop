'use client';
import {useEffect,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
type Submission={id:string;title:string;details:string;period:string;recipient_role:string;report_date:string;status:string};
export default function StaffReportHistory({userId}:{userId:string}){
 const [rows,setRows]=useState<Submission[]>([]),[message,setMessage]=useState(''),[loading,setLoading]=useState(false);
 const [editing,setEditing]=useState<string|null>(null),[title,setTitle]=useState(''),[details,setDetails]=useState('');
 function db(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw Error('Reporting service unavailable');
  return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
 }
 async function load(){
  try{
   const {data,error}=await db().from('landshop_staff_submissions').select('id,title,details,period,recipient_role,report_date,status').eq('staff_id',userId).order('created_at',{ascending:false}).limit(40);
   if(error)throw error;setRows(data||[]);
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to load reports')}
 }
 useEffect(()=>{void load()},[userId]);
 function edit(r:Submission){setEditing(r.id);setTitle(r.title);setDetails(r.details);setMessage('')}
 async function revise(){
  if(!editing||loading)return;setLoading(true);setMessage('');
  try{
   const {error}=await db().rpc('landshop_staff_revise_report',{p_submission:editing,p_title:title.trim(),p_details:details.trim()});
   if(error)throw error;setEditing(null);await load();setMessage('Corrected report resubmitted for management review.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to resubmit')}
  finally{setLoading(false)}
 }
 return <section style={{margin:'18px 22px',padding:22,border:'1px solid #d3e6da',background:'white',borderRadius:16,color:'#173e30'}}>
  <h2>My submitted reports</h2>
  <p style={{fontSize:14}}>Review submission history and revise a report if management returns it.</p>
  {message&&<p role="status" aria-live="polite">{message}</p>}
  {rows.length===0?<p>No reports submitted yet.</p>:rows.map(r=><div key={r.id} style={{borderTop:'1px solid #d9e7dd',padding:'14px 0'}}>
   <strong>{r.title}</strong><p style={{margin:'4px 0'}}><small>{r.period} · {r.report_date} · {r.recipient_role.replaceAll('_',' ')} · {r.status}</small></p>
   {r.status==='returned'&&<button type="button" onClick={()=>edit(r)}>Revise returned report</button>}
   {editing===r.id&&<div style={{display:'grid',gap:8,marginTop:12}}>
    <label>Report title<input value={title} maxLength={180} onChange={e=>setTitle(e.target.value)} style={{padding:10,border:'1px solid #a9cbb5',borderRadius:8}}/></label>
    <label>Corrected report<textarea value={details} maxLength={6000} onChange={e=>setDetails(e.target.value)} style={{display:'block',width:'100%',minHeight:105,padding:10,border:'1px solid #a9cbb5',borderRadius:8}}/></label>
    <div><button type="button" disabled={loading||title.trim().length<5||details.trim().length<15} onClick={revise}>Resubmit report</button> <button type="button" onClick={()=>setEditing(null)}>Cancel</button></div>
   </div>}
  </div>)}
  <button type="button" disabled={loading} onClick={()=>void load()}>Refresh report history</button>
 </section>;
}
