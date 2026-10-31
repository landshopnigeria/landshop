'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
export default function EnquiryAction({id,current}:{id:string;current:string}){
 const [status,setStatus]=useState(current),[choice,setChoice]=useState(''),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const next=status==='new'?['assigned','in_progress','resolved']:status==='assigned'?['in_progress','resolved']:status==='in_progress'?['resolved']:status==='resolved'?['closed']:[];
 async function submit(){
  if(busy||!choice)return;
  setBusy(true);setMessage('');
  try{
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!key)throw Error('Enquiry service is not configured');
   const db=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'}}); 
   const {error}=await db.rpc('landshop_management_enquiry_action',{p_enquiry:id,p_status:choice,p_note:note.trim()});
   if(error)throw error;
   setStatus(choice);setChoice('');setNote('');setMessage('Enquiry status updated. The decision was recorded in the audit log.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to update enquiry')}
  finally{setBusy(false)}
 }
 return <section style={{marginTop:16,paddingTop:14,borderTop:'1px solid #e3eee6',display:'grid',gap:9}}>
  <strong style={{fontSize:13}}>Manage enquiry · {status.replaceAll('_',' ')}</strong>
  {next.length>0&&<>
   <label style={{display:'grid',gap:5}}>Next status<select value={choice} onChange={e=>setChoice(e.target.value)} style={{padding:10,borderRadius:8,border:'1px solid #bddaca'}}><option value="">Choose action</option>{next.map(x=><option value={x} key={x}>{x.replaceAll('_',' ')}</option>)}</select></label>
   <label style={{display:'grid',gap:5}}>Internal action note<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={1000} minLength={10} placeholder="Describe the follow-up taken or outcome" style={{minHeight:70,padding:10,borderRadius:8,border:'1px solid #bddaca'}}/></label>
   <button type="button" disabled={busy||!choice||note.trim().length<10} onClick={submit} style={{padding:'10px 14px',borderRadius:9,border:0,background:'#2ba47a',color:'white',fontWeight:700,cursor:'pointer'}}>Save status</button>
  </>}
  {message&&<p role="status" aria-live="polite">{message}</p>}
 </section>;
}