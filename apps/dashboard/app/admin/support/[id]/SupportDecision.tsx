'use client';
import BrandedSelect from '../../../../components/BrandedSelect';

import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
export default function SupportDecision({ticketId,currentStatus,currentPriority}:{ticketId:string;currentStatus:string;currentPriority:string}){
 const [status,setStatus]=useState(currentStatus),[priority,setPriority]=useState(currentPriority),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  try{
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!key)throw Error('Support database unavailable');
   const db=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
   const {data,error}=await db.rpc('landshop_support_decide',{p_ticket:ticketId,p_status:status,p_priority:priority,p_note:note.trim()});
   if(error||!data)throw Error('The transition was not permitted or the ticket changed. Refresh before retrying.');
   setMessage('Ticket updated, audited and queued for customer notification.');setNote('');
  }catch(err){setMessage(err instanceof Error?err.message:'Decision failed')}
  finally{setBusy(false)}
 }
 return <form onSubmit={submit} style={{padding:22,borderRadius:15,border:'1px solid #d4e8db',background:'white',display:'grid',gap:16}}>
  <h2 style={{margin:0}}>Operator Decision</h2>
  <label>Status<BrandedSelect value={status} onChange={e=>setStatus(e.target.value)} style={{display:'block',width:'100%',padding:13,marginTop:6}}>{['open','in_progress','awaiting_customer','resolved','closed'].map(x=><option key={x} value={x}>{x.replaceAll('_',' ')}</option>)}</BrandedSelect></label>
  <label>Priority<BrandedSelect value={priority} onChange={e=>setPriority(e.target.value)} style={{display:'block',width:'100%',padding:13,marginTop:6}}>{['low','normal','high','urgent'].map(x=><option key={x}>{x}</option>)}</BrandedSelect></label>
  <label>Internal case note<textarea required minLength={10} maxLength={2000} rows={4} value={note} onChange={e=>setNote(e.target.value)} placeholder="Describe the action taken and why" style={{display:'block',width:'100%',padding:13,marginTop:6}}/></label>
  <button disabled={busy} type="submit" style={{background:'#078369',color:'white',border:0,borderRadius:11,padding:13}}>{busy?'Saving…':'Save Status & Audit Event'}</button><p role="status" aria-live="polite">{message}</p>
 </form>;
}