'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
export default function UnsubscribeForm({token}:{token:string}){
 const [busy,setBusy]=useState(false),[done,setDone]=useState(false),[message,setMessage]=useState('');
 const valid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(token);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!valid||busy||done)return;
  setBusy(true);setMessage('');
  try{
   const r=await fetch('/api/newsletter/unsubscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});
   const data=await r.json();
   if(!r.ok||!data.ok)throw Error(data.message||'Could not update your newsletter preference.');
   setDone(true);setMessage('Your request was received. Landshop newsletter messages will stop for this subscription.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to unsubscribe at this time.');}finally{setBusy(false)}
 }
 return <section style={{maxWidth:740,margin:'0 auto',padding:'65px 24px 100px',color:'#274b3a'}} aria-labelledby="preference-heading">
  <span style={{color:'#218a60',fontWeight:750,fontSize:13,letterSpacing:'.13em'}}>LANDSHOP NEWSLETTER</span>
  <h1 id="preference-heading" style={{fontSize:'clamp(30px,5vw,50px)',lineHeight:1.12,margin:'13px 0 16px',letterSpacing:'-.045em'}}>Manage your newsletter preference.</h1>
  <p style={{fontSize:16,lineHeight:1.8,color:'#557361'}}>You can stop property news and insights emails at any time. This does not affect property applications, receipts, or essential account notifications.</p>
  {valid&&!done?<form onSubmit={submit} style={{marginTop:32}}>
   <button type="submit" disabled={busy} style={{border:0,borderRadius:12,padding:'17px 27px',background:'#218b64',color:'#fff',fontWeight:760,cursor:busy?'wait':'pointer'}}>{busy?'Updating preference…':'Unsubscribe from the newsletter'}</button>
  </form>:null}
  {!valid?<p role="alert" style={{marginTop:27,color:'#ae4237'}}>This unsubscribe link is invalid. Please use the link provided in your Landshop newsletter, or <Link href="/contact">contact us</Link>.</p>:null}
  {message&&<p role={done?'status':'alert'} style={{marginTop:20,color:done?'#137450':'#b42318'}}>{message}</p>}
  <p style={{marginTop:26,fontSize:13,color:'#678274'}}>For assistance, email <a href="mailto:care@landshopnigeria.com">care@landshopnigeria.com</a>.</p>
  <Link href="/insights" style={{color:'#177a56',fontSize:13,fontWeight:700}}>Explore Landshop insights →</Link>
 </section>;
}