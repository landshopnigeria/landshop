'use client';
import {useEffect,useState,type FormEvent} from 'react';
import StaffAuthShell,{StaffAuthLogo} from '../StaffAuthShell';
import StaffPasswordField from '../StaffPasswordField';
import {createBrowserClient} from '@supabase/ssr';
const callbackErrors:Record<string,string>={
 missing_confirmation:'Your confirmation link is incomplete. Request a new confirmation email.',
 invalid_confirmation:'This confirmation link is not valid. Request a new email.',
 verification_failed:'The confirmation link could not be verified. It may have expired or already been used.',
 session_unavailable:'Email verification completed without a usable session. Please sign in with your email and password.',
 configuration:'Staff authentication is temporarily unavailable. Please contact Landshop support.'
};
export default function StaffSignIn(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{
  const reason=new URLSearchParams(window.location.search).get('error');
  if(reason&&Object.prototype.hasOwnProperty.call(callbackErrors,reason))setMessage(callbackErrors[reason]);
 },[]);
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

 return <StaffAuthShell><section className="lsa-card signin" aria-labelledby="staff-login-title"><StaffAuthLogo/><p className="lsa-kicker">Staff &amp; Management Access</p><h1 className="lsa-title" id="staff-login-title">Welcome <span>back.</span></h1>
 <form onSubmit={enter}><div className="lsa-grid">
 <div className="lsa-field"><label htmlFor="staff-login-email">Email address</label><input id="staff-login-email" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your work email"/></div>
 <StaffPasswordField id="staff-login-password" label="Password" value={password} onChange={setPassword} placeholder="Enter your password" autoComplete="current-password"/>
 </div><button className="lsa-submit" disabled={busy} type="submit">{busy?'Signing In…':'Sign In'}</button>
 {message&&<p role="alert" className="lsa-message">{message}</p>}
 <div className="lsa-links"><a href="/staff/sign-up">Sign Up</a><span aria-hidden="true" className="lsa-split"/><a href="https://portal.landshopnigeria.com/reset-password">Forgot password?</a></div>
 </form></section></StaffAuthShell>;
}
