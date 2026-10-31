'use client';
import {useState,useEffect} from 'react';
export default function PaymentStatus({reference}:{reference:string}){
 const [status,setStatus]=useState('checking'),[notice,setNotice]=useState('');
 async function check(){
  if(!/^LNSPAY[A-Za-z0-9]{12,56}$/.test(reference)){setStatus('invalid');return}
  setStatus('checking');
  try{
   const r=await fetch('/api/payments/verify?reference='+encodeURIComponent(reference),{cache:'no-store'});
   const j=await r.json();
   if(!r.ok){setStatus('unavailable');setNotice(j.error||'Please sign in to view your payment.');return}
   setStatus(j.status==='success'?'success':'pending');
  }catch{setStatus('unavailable');setNotice('Unable to check payment status now.');}
 }
 useEffect(()=>{void check()},[reference]);
 return <div aria-live="polite">
  <strong style={{display:'block',padding:16,color:status==='success'?'#097c61':'#a36b20'}}>
   {status==='success'?'Payment verified. Your subscription has been recorded.':
    status==='checking'?'Checking with Paystack…':
    status==='pending'?'Payment pending. No subscription has been activated yet.':
    status==='invalid'?'Invalid payment reference.':'Status unavailable. No activation is being assumed.'}
  </strong>
  {notice&&<p role="alert">{notice}</p>}
  {reference&&<small style={{wordBreak:'break-all'}}>Reference: {reference}</small>}
  {status!=='success'&&<p><button onClick={()=>{void check()}} style={{padding:'11px 19px',borderRadius:9,background:'#0b8869',color:'#fff',fontWeight:800,border:0}}>Check again</button></p>}
 </div>;
}
