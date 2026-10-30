'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '@supabase/ssr';
export default function StaffSignIn(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function enter(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  try{
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!key)throw Error('Supabase environment unavailable');
   const db=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',secure:true,path:'/',sameSite:'lax'}});
   const {data,error}=await db.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
   if(error||!data.user)throw Error(error?.message||'Unable to verify this account');
   window.location.assign('/staff');
  }catch(e){setMessage(e instanceof Error?e.message:'Login failed')}finally{setBusy(false)}
 }
 return <main style={{minHeight:'100vh',background:'linear-gradient(120deg,#e9f8f0,#fff)',display:'grid',placeItems:'center',padding:20,color:'#164434',fontFamily:'Arial,sans-serif'}}>
  <form onSubmit={enter} style={{width:'min(100%,440px)',padding:'clamp(24px,5vw,42px)',background:'white',border:'1px solid #dcebe1',boxShadow:'0 20px 45px #0a633510',borderRadius:24,display:'grid',gap:16}}>
   <Link href="https://www.landshopnigeria.com/" aria-label="Landshop official website" style={{width:240,maxWidth:'100%',height:96,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:14}}><img src="/media/logo-transparent.png" onError={e=>{e.currentTarget.src='/media/logo.webp'}} alt="Original Landshop logo, Develop Incubate Grow" style={{width:'100%',height:'100%',objectFit:'contain'}}/></Link>
   <p style={{color:'#e17617',fontSize:12,fontWeight:850,margin:0}}>STAFF & MANAGEMENT ACCESS</p>
   <h1 style={{fontSize:35,margin:0}}>Welcome back.</h1><p style={{color:'#627b6b',fontSize:14,lineHeight:1.7}}>Sign in to your work dashboard. Only authorized owner, CEO, founder, administrator and technology management accounts can open the Global Command Center.</p>
   <label style={{display:'grid',gap:7,fontSize:13}}>Email address<input autoComplete="email" required type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:14,borderRadius:11,border:'1px solid #d1e4d8'}}/></label>
   <label style={{display:'grid',gap:7,fontSize:13}}>Password<input autoComplete="current-password" required type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{padding:14,borderRadius:11,border:'1px solid #d1e4d8'}}/></label>
   <button disabled={busy} style={{padding:14,border:0,background:'#2ba47a',borderRadius:11,color:'#fff',fontWeight:850}}>{busy?'Authenticating…':'Sign In'}</button>
   {message&&<p role="alert" style={{padding:13,background:'#fff1e7',color:'#a54c24',fontSize:13,borderRadius:11}}>{message}</p>}
   <div style={{display:'flex',justifyContent:'space-between',gap:12,fontSize:13}}><Link href="/staff/sign-up" style={{color:'#168963'}}>Sign Up</Link><Link href="https://portal.landshopnigeria.com/reset-password" style={{color:'#168963'}}>Forgot password?</Link></div>
  </form>
 </main>;
}
