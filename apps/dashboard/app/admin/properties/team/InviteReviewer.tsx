'use client';
import BrandedSelect from '../../../../components/BrandedSelect';

import {useState,type FormEvent} from 'react';
import {createBrowserClient} from '@supabase/ssr';
export default function InviteReviewer(){
 const [email,setEmail]=useState(''),[role,setRole]=useState('legal'),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[good,setGood]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setMsg('');setGood(false);
  try{
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!key)throw Error('Secure Landshop Auth is not configured');
   const db=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
   const {data,error}=await db.rpc('landshop_staff_invite_reviewer',{p_email:email.trim().toLowerCase(),p_role:role,p_reason:reason.trim()});
   if(error||!data)throw Error(error?.message||'Invitation was not saved');
   setGood(true);setMsg('Invitation saved and audited. The verified reviewer can now sign in and explicitly accept at https://app.landshopnigeria.com/reviewer/accept . No invitation email was automatically sent.');
   setReason('');
  }catch(e){setMsg(e instanceof Error?e.message:'Invite failed')}finally{setBusy(false)}
 }
 return <form onSubmit={submit} style={{display:'grid',gap:16,background:'#fff',border:'1px solid #d7e9dc',padding:27,borderRadius:18,maxWidth:800}}>
  <label style={{display:'grid',gap:7}}>Registered reviewer email <input type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="reviewer@company.ng" style={{padding:13,border:'1px solid #c5decc',borderRadius:11}}/></label>
  <label style={{display:'grid',gap:7}}>Review role <BrandedSelect value={role} onChange={e=>setRole(e.target.value)} style={{padding:13,border:'1px solid #c5decc',borderRadius:11}}>
    <option value="legal">Legal reviewer</option><option value="operations">Operations reviewer</option><option value="admin">Administrator</option>
  </BrandedSelect></label>
  <label style={{display:'grid',gap:7}}>Justification and appointment authorization<textarea rows={4} required minLength={20} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Why this separately verified person should review property title, current price, owner authority and public listing approval…" style={{padding:13,border:'1px solid #c5decc',borderRadius:11}}/></label>
  <button type="submit" disabled={busy||reason.trim().length<20} style={{border:0,borderRadius:11,padding:15,background:'#2ba47a',color:'#fff',fontWeight:800,cursor:'pointer'}}>{busy?'Checking verified identity…':'Invite authorized reviewer'}</button>
  {msg&&<p role={good?'status':'alert'} style={{color:good?'#0c845f':'#ad3e28',background:good?'#e9f8ee':'#fff0e9',borderRadius:11,padding:14,fontSize:13,lineHeight:1.65}}>{msg}</p>}
 </form>;
}
