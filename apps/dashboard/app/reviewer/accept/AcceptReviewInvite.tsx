'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
export default function AcceptReviewInvite(){
 const [busy,setBusy]=useState(false),[ok,setOk]=useState(false),[result,setResult]=useState('');
 async function accept(){
  if(busy)return;setBusy(true);setResult('');
  try{
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!key)throw Error('Sign-in configuration unavailable');
   const db=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
   const {data,error}=await db.rpc('landshop_staff_accept_review_invite');
   if(error||!data)throw Error(error?.message||'No active invitation');
   setOk(true);setResult('Reviewer invitation accepted. You can access the private Property Command Center and review the actual developer evidence.');
  }catch(e){setResult(e instanceof Error?e.message:'Could not accept reviewer invitation')}finally{setBusy(false)}
 }
 return <div style={{display:'grid',gap:15,marginTop:20}}>
  <button type="button" onClick={accept} disabled={busy||ok} style={{border:0,background:'#2ba47a',color:'white',padding:16,borderRadius:12,fontWeight:850,cursor:'pointer'}}>{busy?'Verifying invitation…':ok?'Reviewer role active':'Accept my reviewer invitation'}</button>
  {result&&<p role={ok?'status':'alert'} style={{background:ok?'#eaf9ef':'#fff0e9',padding:15,borderRadius:11,color:ok?'#0d825b':'#ad4e1e'}}>{result}</p>}
  {ok&&<a href="/admin/properties/readiness" style={{color:'#087b5d',fontWeight:800}}>Open publication readiness →</a>}
 </div>;
}
