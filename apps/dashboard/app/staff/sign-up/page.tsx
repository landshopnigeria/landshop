'use client';
import StaffAuthShell,{StaffAuthLogo} from '../StaffAuthShell';
import StaffPasswordField from '../StaffPasswordField';

import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '@supabase/ssr';
const roles=[
 ['owner','Company Owner (Verification Required)'],['staff','Staff / Team Member'],['ceo','Chief Executive Officer (CEO)'],['founder','Founder'],['admin','Administrator'],['hr_officer','Human Resources Officer (HRO)'],
 ['head_finance','Head of Finance'],['technology_officer','Technology Officer'],['technology_consultant','Technology Consultant'],['social_media_manager','Social Media Manager'],
 ['customer_service_manager','Customer Service Manager'],['department_manager','Department Manager'],['operations','Operations'],['marketing','Marketing'],['sales','Sales'],
 ['legal','Legal / Compliance'],['youth_corps','Youth Corps (NYSC)'],['intern','Intern / Internship']
];
export default function StaffSignUp(){
 const [v,setV]=useState({email:'',username:'',age:'',gender:'',role:'',password:'',confirm:''});
 const [busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[acknowledged,setAcknowledged]=useState(false);
 const [confirmationPending,setConfirmationPending]=useState(false),[resendCompleted,setResendCompleted]=useState(false),[pendingEmail,setPendingEmail]=useState('');
 const update=(k:keyof typeof v,s:string)=>setV(p=>({...p,[k]:s}));
 async function resendConfirmation(){
  if(!confirmationPending||resendCompleted||busy)return;
  setBusy(true);
  try{
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!key)throw Error('Email service unavailable');
   const db=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',secure:true,sameSite:'lax',path:'/'}});
   const {error}=await db.auth.resend({type:'signup',email:pendingEmail,
    options:{emailRedirectTo:'https://app.landshopnigeria.com/auth/callback'}});
   if(error)throw error;
   setResendCompleted(true);
   setMsg('If this address has an eligible unconfirmed account, another confirmation email will be sent. Check your inbox and spam folder.');
  }catch{
   setMsg('Unable to resend the confirmation email. Please check the address or try again later.');
  }finally{setBusy(false)}
 }
 async function submit(e:FormEvent<HTMLFormElement>){
 e.preventDefault();setBusy(true);setMsg('');
 try{
  if(!/^[a-zA-Z][\w.]{2,29}$/.test(v.username))throw Error('Username must contain 3–30 letters, numbers, underscores or periods, starting with a letter');
  if(+v.age<18||+v.age>120||!Number.isInteger(+v.age))throw Error('Staff registration is available to adults aged 18 or above');
  if(!v.gender||!v.role)throw Error('Select your gender preference and requested staff role');
  if(v.password.length<12||v.password!==v.confirm)throw Error('Use matching passwords of at least 12 characters');
  if(!acknowledged)throw Error('Please read and accept the Terms and Conditions to continue');
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw Error('Authentication service unavailable');
  const db=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',secure:true,sameSite:'lax',path:'/'}});
  const {error}=await db.auth.signUp({email:v.email.trim().toLowerCase(),password:v.password,options:{
   emailRedirectTo:'https://app.landshopnigeria.com/auth/callback',
   data:{staff_signup:true,preferred_username:v.username.toLowerCase(),age_at_registration:+v.age,gender:v.gender,requested_role:v.role}
  }});
  if(error)throw error;
  setPendingEmail(v.email.trim().toLowerCase());
  setConfirmationPending(true);
  setResendCompleted(false);
  setMsg(v.role==='owner'?'Confirm your email, then complete your owner identity request in the staff portal. Owner access requires independent approval.':'Check your email to confirm your account. Your requested staff role remains subject to identity verification and management approval.');
 }catch(e){setMsg(e instanceof Error?e.message:'Unable to register')}finally{setBusy(false)}
 }

 return <StaffAuthShell><section className="lsa-card signup" aria-labelledby="staff-register-title"><StaffAuthLogo/><h1 className="lsa-title" id="staff-register-title">Become a <span>Landshop Staff</span></h1>
 <form onSubmit={submit}><div className="lsa-grid">
 <div className="lsa-field"><label htmlFor="su-email">Email</label><input id="su-email" required type="email" autoComplete="email" value={v.email} onChange={e=>update('email',e.target.value)} placeholder="you@company.com"/></div>
 <div className="lsa-field"><label htmlFor="su-username">Username</label><input id="su-username" required autoComplete="username" minLength={3} maxLength={30} value={v.username} onChange={e=>update('username',e.target.value)} placeholder="Choose a username"/></div>
 <div className="lsa-field"><label htmlFor="su-age">Age</label><input id="su-age" required type="number" min={18} max={120} inputMode="numeric" value={v.age} onChange={e=>update('age',e.target.value)} placeholder="Enter your age"/></div>
 <div className="lsa-field"><label htmlFor="su-gender">Gender</label><div className="lsa-select"><select id="su-gender" required value={v.gender} onChange={e=>update('gender',e.target.value)}><option value="" disabled>Select gender</option><option value="prefer_not_to_say">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Other</option></select><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></div></div>
 <div className="lsa-field full"><label htmlFor="su-role">Requested staff role</label><div className="lsa-select"><select id="su-role" required value={v.role} onChange={e=>update('role',e.target.value)}><option value="" disabled>Select staff role</option>{roles.map(([key,name])=><option key={key} value={key}>{name}</option>)}</select><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></div>
 {v.role==='owner'&&<small className="lsa-owner-notice">Owner registration is a request. Verified owner access requires separate company authorization.</small>}</div>
 <StaffPasswordField id="su-password" label="Password" autoComplete="new-password" minLength={12} value={v.password} onChange={value=>update('password',value)} placeholder="Create password"/>
 <StaffPasswordField id="su-confirm" label="Confirm password" autoComplete="new-password" minLength={12} value={v.confirm} onChange={value=>update('confirm',value)} placeholder="Confirm password"/>
 </div><div className="lsa-terms"><input type="checkbox" id="su-terms" required checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)}/><label htmlFor="su-terms">I have read the <a href="/staff/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a></label></div>
 <button type="submit" className="lsa-submit" disabled={busy}>{busy?'Submitting…':'Sign Up'}</button>
 {msg&&<p role="status" className="lsa-message">{msg}</p>}
 {confirmationPending&&<button className="lsa-resend" type="button" disabled={busy||resendCompleted} onClick={resendConfirmation}>{resendCompleted?'Confirmation requested':'Resend confirmation email'}</button>}
 <div className="lsa-links">Already have an account? <a href="/staff/sign-in">Sign In</a></div>
 </form></section></StaffAuthShell>;
}
