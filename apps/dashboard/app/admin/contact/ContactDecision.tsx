'use client';
import {useState,type FormEvent} from 'react';
import {createBrowserClient} from '@supabase/ssr';
export default function ContactDecision({id}:{id:string}){
 const [status,setStatus]=useState('in_progress'),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setFeedback('');
  try{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw Error('Database configuration missing');
   const db=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
   const {data,error}=await db.rpc('landshop_contact_decide',{p_enquiry:id,p_status:status,p_note:note.trim()});
   if(error||!data)throw Error(error?.message||'The enquiry decision was not saved');
   setFeedback('Status recorded and audited. Refresh for the latest queue.');setNote('');
  }catch(e){setFeedback(e instanceof Error?e.message:'Could not save decision')}finally{setBusy(false)}}
 return <form onSubmit={submit} style={{borderTop:'1px solid #e3ede5',marginTop:15,paddingTop:14,display:'flex',flexWrap:'wrap',alignItems:'end',gap:12}}>
  <label style={{display:'grid',gap:6,fontSize:12}}>New status<select value={status} onChange={e=>setStatus(e.target.value)} style={{padding:11,borderRadius:8,border:'1px solid #d0e2d5'}}>{['assigned','in_progress','resolved','closed'].map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label>
  <label style={{display:'grid',gap:6,flex:'1 1 300px',fontSize:12}}>Staff note<input required minLength={15} maxLength={1000} value={note} onChange={e=>setNote(e.target.value)} style={{padding:12,border:'1px solid #d0e2d5',borderRadius:8}} placeholder="Describe response, assignment or resolution"/></label>
  <button disabled={busy||note.trim().length<15} type="submit" style={{padding:'12px 19px',border:0,borderRadius:9,background:'#2ba47a',color:'#fff',fontWeight:800}}>Save decision</button>
  {feedback&&<p role="status" style={{width:'100%',fontSize:12}}>{feedback}</p>}
 </form>;
}
