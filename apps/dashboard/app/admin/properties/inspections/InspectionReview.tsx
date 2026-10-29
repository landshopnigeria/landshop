'use client';
import {useState,type FormEvent} from 'react';
import {createBrowserClient} from '@supabase/ssr';
const choices=['confirmed','rescheduled','completed','rejected','cancelled'];
export default function InspectionReview({requestId,currentStatus}:{requestId:string;currentStatus:string}){
 const [status,setStatus]=useState('confirmed'),[note,setNote]=useState(''),[date,setDate]=useState(''),[time,setTime]=useState(''),
 [busy,setBusy]=useState(false),[feedback,setFeedback]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setBusy(true);setFeedback('');
  try{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!key)throw Error('Inspection service unavailable');
   if(note.trim().length<15)throw Error('Add a note describing the approval decision');
   const db=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
   const args=status==='rescheduled'?{p_id:requestId,p_date:date,p_time:time,p_note:note.trim()}:{p_id:requestId,p_status:status,p_note:note.trim()};
   const {data,error}=await db.rpc(status==='rescheduled'?'landshop_inspection_reschedule':'landshop_inspection_review',args);
   if(error||!data)throw Error(error?.message||'Decision not saved');
   setFeedback('Decision saved and audited. The notification has been queued for delivery processing. Refresh to see its updated status.');
   setNote('');
  }catch(err){setFeedback(err instanceof Error?err.message:'Unable to save decision')}
  finally{setBusy(false)}
 }
 return <form onSubmit={submit} style={{marginTop:20,padding:18,background:'#f3faf5',borderRadius:12,border:'1px solid #d5e9dc'}}>
  <div style={{display:'flex',flexWrap:'wrap',alignItems:'end',gap:12}}>
   <label style={{display:'grid',gap:6,flex:'1 1 180px',fontSize:12}}>Decision
    <select value={status} onChange={e=>setStatus(e.target.value)} style={{padding:12,borderRadius:9,border:'1px solid #c9ddce'}}>{choices.filter(x=>currentStatus!=='pending_confirmation'||x!=='completed').map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select>
   </label>
   {status==='rescheduled'&&<><label style={{display:'grid',gap:6,fontSize:12}}>New preferred date<input type="date" required value={date} onChange={e=>setDate(e.target.value)} style={{padding:11,border:'1px solid #c9ddce',borderRadius:9}}/></label><label style={{display:'grid',gap:6,fontSize:12}}>New time (WAT)<select value={time} required onChange={e=>setTime(e.target.value)} style={{padding:11,border:'1px solid #c9ddce',borderRadius:9}}><option value="">Choose time</option>{['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].map(t=><option key={t}>{t}</option>)}</select></label></>}
  </div>
  <label style={{display:'grid',gap:6,fontSize:12,marginTop:13}}>Staff decision note<textarea required rows={3} minLength={15} maxLength={1000} value={note} onChange={e=>setNote(e.target.value)} style={{padding:12,borderRadius:9,border:'1px solid #c9ddce'}} placeholder="Reason for confirmation, reschedule, rejection, cancellation or completion"/></label>
  <button type="submit" disabled={busy||note.trim().length<15} style={{background:'#2ba47a',color:'#fff',border:0,borderRadius:9,padding:'12px 19px',fontWeight:800,marginTop:13,cursor:'pointer'}}>{busy?'Recording…':'Record decision'}</button>
  {feedback&&<p role="status" style={{fontSize:12}}>{feedback}</p>}
 </form>;
}
