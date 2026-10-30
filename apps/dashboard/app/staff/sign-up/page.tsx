'use client';
import BrandedSelect from '../../../components/BrandedSelect';

import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '@supabase/ssr';
const roles=[
 ['staff','Staff / Team Member'],['ceo','Chief Executive Officer (CEO)'],['founder','Founder'],['admin','Administrator'],['hr_officer','Human Resources Officer (HRO)'],
 ['head_finance','Head of Finance'],['technology_officer','Technology Officer'],['technology_consultant','Technology Consultant'],['social_media_manager','Social Media Manager'],
 ['customer_service_manager','Customer Service Manager'],['department_manager','Department Manager'],['operations','Operations'],['marketing','Marketing'],['sales','Sales'],
 ['legal','Legal / Compliance'],['youth_corps','Youth Corps (NYSC)'],['intern','Intern / Internship']
];
export default function StaffSignUp(){
 const [v,setV]=useState({email:'',username:'',age:'',gender:'prefer_not_to_say',role:'staff',password:'',confirm:''});
 const [busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[acknowledged,setAcknowledged]=useState(false);
 const update=(k:keyof typeof v,s:string)=>setV(p=>({...p,[k]:s}));
 async function submit(e:FormEvent<HTMLFormElement>){
 e.preventDefault();setBusy(true);setMsg('');
 try{
  if(!/^[a-zA-Z][\w.]{2,29}$/.test(v.username))throw Error('Username must contain 3–30 letters, numbers, underscores or periods, starting with a letter');
  if(+v.age<18||+v.age>120||!Number.isInteger(+v.age))throw Error('Staff registration is available to adults aged 18 or above');
  if(v.password.length<12||v.password!==v.confirm)throw Error('Use matching passwords of at least 12 characters');
  if(!acknowledged)throw Error('Read the staff data and location privacy notice before continuing');
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw Error('Authentication service unavailable');
  const db=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',secure:true,sameSite:'lax',path:'/'}});
  const {error}=await db.auth.signUp({email:v.email.trim().toLowerCase(),password:v.password,options:{
   emailRedirectTo:'https://app.landshopnigeria.com/auth/callback',
   data:{staff_signup:true,preferred_username:v.username.toLowerCase(),age_at_registration:+v.age,gender:v.gender,requested_role:v.role}
  }});
  if(error)throw error;
  setMsg('Check your email to confirm your account. Then sign in to finish staff registration and submit your ID photograph. The job title is requested—not approved—and grants no access until management verification.');
 }catch(e){setMsg(e instanceof Error?e.message:'Unable to register')}finally{setBusy(false)}
 }
 const control={width:'100%',padding:'13px 14px',borderRadius:11,border:'1px solid #cbded3',background:'#fff',boxSizing:'border-box' as const};
 return <main className="ls-staff-auth"><style>{`*{box-sizing:border-box}.ls-staff-auth{min-height:100vh;background:linear-gradient(125deg,#e9f6ee,#fff);color:#154835;font-family:Arial,sans-serif;padding:32px 16px;display:grid;place-items:center}.ls-staff-form{width:min(100%,565px);border:1px solid #d4e9dc;background:rgba(255,255,255,.9);padding:clamp(22px,5vw,41px);border-radius:23px;box-shadow:0 16px 55px #134c3612}.ls-staff-form h1{font-size:clamp(28px,4vw,37px);margin-bottom:10px}.ls-staff-form label{display:grid;gap:7px;font-size:13px;font-weight:700}.ls-staff-form button{border:0;background:#2ba47a;color:white;cursor:pointer;border-radius:11px;padding:15px;font-weight:800}.ls-staff-form button:disabled{opacity:.65}.ls-staff-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(205px,1fr));gap:14px}`}</style>
 <form onSubmit={submit} className="ls-staff-form"><Link href="https://www.landshopnigeria.com/" aria-label="Landshop official website" style={{display:'flex',alignItems:'center',justifyContent:'center',width:245,maxWidth:'100%',height:100,background:'#fff',borderRadius:14,marginBottom:15}}><img src="/media/logo-transparent.png" onError={e=>{e.currentTarget.src='/media/logo.webp'}} alt="Original Landshop logo, Develop Incubate Grow" style={{width:'100%',height:'100%',objectFit:'contain'}}/></Link><p style={{color:'#dc6f13',fontWeight:800,fontSize:12,letterSpacing:1}}>LANDSHOP PEOPLE & MANAGEMENT</p>
  <h1>Join the Landshop team</h1><p style={{fontSize:13,lineHeight:1.7,color:'#607d6c'}}>Register with your email, username and password. Your chosen role is a request and needs authorized management approval. Only verified, approved employees receive dashboards and ID cards.</p>
  <div className="ls-staff-grid">
   <label>Email<input required type="email" autoComplete="email" style={control} value={v.email} onChange={e=>update('email',e.target.value)} placeholder="you@company.com"/></label>
   <label>Username<input required autoComplete="username" minLength={3} maxLength={30} style={control} value={v.username} onChange={e=>update('username',e.target.value)} placeholder="your.username"/></label>
   <label>Age<input required min={18} max={120} type="number" style={control} value={v.age} onChange={e=>update('age',e.target.value)}/></label>
   <label>Gender<BrandedSelect required style={control} value={v.gender} onChange={e=>update('gender',e.target.value)}><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></BrandedSelect></label>
  </div>
  <label style={{margin:'14px 0'}}>Requested staff role<BrandedSelect style={control} value={v.role} onChange={e=>update('role',e.target.value)}>{roles.map(([key,name])=><option key={key} value={key}>{name}</option>)}</BrandedSelect></label>
  <div className="ls-staff-grid">
   <label>Password<input required minLength={12} autoComplete="new-password" type="password" style={control} value={v.password} onChange={e=>update('password',e.target.value)}/></label>
   <label>Confirm password<input required minLength={12} autoComplete="new-password" type="password" style={control} value={v.confirm} onChange={e=>update('confirm',e.target.value)}/></label>
  </div>
  <p style={{fontSize:12,color:'#6b806e',lineHeight:1.6}}>Your photograph and work location are requested separately after you sign in. No automatic GPS monitoring occurs.</p>
  <label style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:12,lineHeight:1.5,marginBottom:12}}><input type="checkbox" required checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)} style={{accentColor:'#2ba47a',marginTop:3}}/> I have read the <Link href="/staff/privacy" style={{color:'#148864',fontWeight:800}}>staff identity, GPS and performance privacy notice</Link>. Actual location access will be requested separately at each clock event.</label>
  <button disabled={busy} type="submit" style={{width:'100%'}}>{busy?'Submitting…':'Sign Up as Staff'}</button>
  {msg&&<p role="status" style={{fontSize:13,background:'#fff0e1',padding:14,borderRadius:10,lineHeight:1.6}}>{msg}</p>}
  <p style={{textAlign:'center'}}>Already registered? <Link href="/staff/sign-in" style={{color:'#12815e',fontWeight:800}}>Sign In</Link></p>
 </form></main>;
}
