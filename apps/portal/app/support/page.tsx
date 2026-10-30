'use client';
import BrandedSelect from '../../components/BrandedSelect';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {CSSProperties} from 'react';
import {browserSupabase} from '../../lib/supabase-browser';
type Ticket={id:string;subject:string;category:string;status:string;created_at:string};
const types=['property','application','mortgage','investment','document','payment','other'];
export default function SupportPortal(){
 const [subject,setSubject]=useState(''),[category,setCategory]=useState('application'),[description,setDescription]=useState('');
 const [tickets,setTickets]=useState<Ticket[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [signedIn,setSignedIn]=useState<boolean|null>(null);
 useEffect(()=>{let live=true;(async()=>{
  try{
   const db=browserSupabase();
   const {data:{user}}=await db.auth.getUser();if(!live)return;
   setSignedIn(Boolean(user));if(!user)return;
   const {data,error}=await db.from('support_tickets').select('id,subject,category,status,created_at')
    .eq('requester_id',user.id).order('created_at',{ascending:false}).limit(20);
   if(error)throw error;if(live)setTickets((data||[]) as Ticket[]);
  }catch{if(live)setMessage('Support history is not available. Please contact Landshop through the official email channel.')}
 })();return()=>{live=false}},[]);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setBusy(true);setMessage('');
  try{
   const db=browserSupabase();const {data:{user}}=await db.auth.getUser();
   if(!user)throw Error('Sign in before opening a secure support ticket.');
   const {data,error}=await db.from('support_tickets').insert({
    requester_id:user.id,subject:subject.trim(),category,description:description.trim()
   }).select('id,subject,category,status,created_at').single();
   if(error||!data)throw Error('Unable to open your ticket. Check your details and account session.');
   setTickets(old=>[data as Ticket,...old]);setSubject('');setDescription('');
   setMessage('Support ticket opened. Your reference is '+data.id+'. You can track its status below.');
  }catch(err){setMessage(err instanceof Error?err.message:'Support request failed.')}
  finally{setBusy(false)}
 }
 const inputStyle:CSSProperties={display:'block',width:'100%',border:'1px solid #cde2d8',borderRadius:11,padding:13,font:'inherit',marginTop:7,background:'white'};
 return <main style={{background:'#f0f8f3',minHeight:'100vh',padding:'clamp(18px,5vw,70px)',color:'#123e32',fontFamily:'Arial,sans-serif'}}>
  <section style={{maxWidth:1050,margin:'auto'}}>
   <nav style={{display:'flex',gap:20,flexWrap:'wrap'}}><Link href="/" style={{color:'#067f65'}}>← Landshop Portal</Link><Link href="/applications" style={{color:'#067f65'}}>Applications Center</Link></nav>
   <h1 style={{fontSize:'clamp(29px,5vw,49px)'}}>Customer Support</h1>
   <p style={{maxWidth:700,lineHeight:1.65}}>Raise a secure request about your property, documents, investment or product application. Never include your account password, OTP or bank PIN.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,355px),1fr))',gap:20}}>
    <form onSubmit={submit} style={{background:'white',borderRadius:20,border:'1px solid #d8e9de',padding:25,display:'grid',gap:15}}>
     <h2 style={{margin:'0 0 7px'}}>Open a Support Ticket</h2>
     <label>Request category<BrandedSelect style={inputStyle} value={category} onChange={e=>setCategory(e.target.value)}>{types.map(x=><option key={x} value={x}>{x[0].toUpperCase()+x.slice(1)}</option>)}</BrandedSelect></label>
     <label>Subject<input style={inputStyle} required minLength={5} maxLength={180} placeholder="e.g., Clarification about my Develop Land application" value={subject} onChange={e=>setSubject(e.target.value)}/></label>
     <label>Tell us what happened<textarea style={inputStyle} required minLength={20} maxLength={5000} rows={6} placeholder="Explain your request and provide your application reference if available" value={description} onChange={e=>setDescription(e.target.value)}/></label>
     <button disabled={busy||signedIn!==true} type="submit" style={{padding:15,background:'#087e61',border:0,color:'#fff',borderRadius:12,fontWeight:800}}>{busy?'Submitting…':'Submit Support Request →'}</button>
     {signedIn===false&&<p>Sign in to submit and track a secure ticket. <Link href="/">Sign In</Link></p>}
     <p role="status" aria-live="polite" style={{fontSize:13,color:'#05684f'}}>{message}</p>
    </form>
    <section style={{background:'white',borderRadius:20,border:'1px solid #d8e9de',padding:25}}>
     <h2 style={{marginTop:0}}>My Support Requests</h2>
     {!tickets.length?<p style={{lineHeight:1.65,color:'#617f71'}}>No support requests are visible for your account yet.</p>:<div style={{display:'grid',gap:11}}>{tickets.map(t=><article key={t.id} style={{border:'1px solid #dbe9e1',borderRadius:11,padding:14}}>
      <strong>{t.subject}</strong><p style={{fontSize:12,margin:'8px 0'}}>Category: {t.category} · Status: {t.status.replaceAll('_',' ')}</p>
      <small style={{overflowWrap:'anywhere',color:'#668273'}}>Reference: {t.id}</small></article>)}</div>}
     <p style={{fontSize:13,marginTop:24}}>Email support: <a href="mailto:care@landshopnigeria.com">care@landshopnigeria.com</a></p>
    </section>
   </div>
  </section>
 </main>;
}