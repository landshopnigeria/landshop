'use client';
import {useEffect,useState,type FormEvent,type ReactNode} from 'react';
import BrandedSelect from '../components/BrandedSelect';
import {browserSupabase} from '../lib/supabase-browser';
import './auth-enterprise.css';

type Mode='signin'|'signup'|'verify';
const portalOrigin='https://portal.landshopnigeria.com';
const appOrigin='https://app.landshopnigeria.com';
const refPattern=/^LANDSHOP[0-9]{2,12}$/;
const logo='/media/logo.webp';
function Brand(){return <a href="https://www.landshopnigeria.com" aria-label="Landshop homepage" className="authBrand"><img src={logo} alt="Landshop Nigeria" width={156} height={62}/></a>}
function Field({label,children}:{label:string;children:ReactNode}){return <label className="authField"><span>{label}</span>{children}</label>}
function GoogleMark(){return <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.8-6.8C35.9 2.5 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.3 5.48-4.86 7.18l7.73 6C44.3 38.04 46.98 31.9 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.6c-.5-1.5-.79-3.07-.79-4.6s.28-3.1.78-4.6l-7.9-6.1A23.6 23.6 0 0 0 0 24c0 3.89.94 7.57 2.62 10.7l7.91-6.1Z"/><path fill="#34A853" d="M24 48c6.4 0 11.8-2.1 15.7-5.8l-7.73-6c-2.14 1.44-4.88 2.28-7.97 2.28-6.3 0-11.6-4.23-13.48-9.88l-7.9 6.1C6.5 42.6 14.6 48 24 48Z"/></svg>}
export default function Portal(){
 const [mode,setMode]=useState<Mode>('signin'),[step,setStep]=useState<1|2>(1);
 const [referral,setReferral]=useState('');
 const [first,setFirst]=useState(''),[last,setLast]=useState(''),[username,setUsername]=useState(''),[phone,setPhone]=useState('');
 const [email,setEmail]=useState(''),[age,setAge]=useState(''),[gender,setGender]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [showPassword,setShowPassword]=useState(false),[accepted,setAccepted]=useState(false),[remember,setRemember]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  const code=(params.get('ref')||'').trim().toUpperCase();
  if(refPattern.test(code)){setReferral(code);setMode('signup')}
  else if(params.get('mode')==='signup')setMode('signup');
  if(params.get('error'))setMessage('The authentication link could not be verified. Please try again.');
  let live=true;
  const auth=browserSupabase();
  const route=(user:{user_metadata?:{staff_signup?:boolean}}|null|undefined)=>{
   if(live&&user?.user_metadata?.staff_signup===true)window.location.replace(appOrigin+'/staff');
  };
  auth.auth.getUser().then(({data})=>route(data.user)).catch(()=>{});
  const {data:{subscription}}=auth.auth.onAuthStateChange((_event,session)=>route(session?.user));
  return()=>{live=false;subscription.unsubscribe()};
 },[]);
 function changeMode(next:Mode){setMode(next);setStep(1);setMessage('');setPassword('');setConfirm('')}
 const validateBasics=()=>{
  if(!first.trim()||!last.trim())throw Error('Enter your first and last name.');
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw Error('Enter a valid email address.');
  if(!/^\+?[0-9 ()-]{8,20}$/.test(phone))throw Error('Enter a valid phone or WhatsApp number.');
 };
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(busy)return;
  setMessage('');
  if(mode==='signup'&&step===1){
   try{validateBasics();setStep(2)}catch(err){setMessage(err instanceof Error?err.message:'Please check your details.')}
   return;
  }
  setBusy(true);
  try{
   const db=browserSupabase();
   if(mode==='signup'){
    validateBasics();
    if(!/^[a-zA-Z][a-zA-Z0-9_.]{2,29}$/.test(username))throw Error('Username must be 3–30 characters and start with a letter.');
    if(!age||Number(age)<18||Number(age)>120)throw Error('You must be at least 18 to register.');
    if(password.length<12||confirm!==password)throw Error('Use at least 12 password characters and confirm them correctly.');
    if(!accepted)throw Error('Please accept the terms and privacy notice.');
    const {error}=await db.auth.signUp({email:email.trim().toLowerCase(),password,options:{
     emailRedirectTo:portalOrigin+'/auth/callback',
     data:{full_name:[first,last].filter(Boolean).join(' ').trim(),username:username.trim().toLowerCase(),phone:phone.trim(),age:Number(age),gender, ...(refPattern.test(referral)?{referral_code:referral}:{})}
    }});
    if(error)throw error;
    setPassword('');setConfirm('');setMode('verify');setMessage('');
   }else if(mode==='signin'){
    const {data,error}=await db.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
    if(error)throw error;
    if(!data.user)throw Error('Your account could not be verified.');
    const returnTo=new URLSearchParams(window.location.search).get('returnTo');
    let target=appOrigin+'/dashboard';
    if(returnTo){try{const u=new URL(returnTo);if(u.protocol==='https:'&&u.hostname==='www.landshopnigeria.com'&&u.pathname.startsWith('/insights/'))target=u.toString()}catch{}}
    window.location.assign(data.user.user_metadata?.staff_signup===true?appOrigin+'/staff':target);
   }
  }catch(err){setMessage(err instanceof Error?err.message:'Unable to complete the request.')}
  finally{setBusy(false)}
 }
 async function google(){
  setMessage('');
  try{
   const cb=new URL(portalOrigin+'/auth/callback');
   if(refPattern.test(referral))cb.searchParams.set('ref',referral);
   const {error}=await browserSupabase().auth.signInWithOAuth({provider:'google',options:{redirectTo:cb.toString()}});
   if(error)throw error;
  }catch{setMessage('Google authentication is unavailable. Please use email and password.')}
 }
 async function resend(){
  if(!email.trim())return setMessage('Enter your email address to resend confirmation.');
  setBusy(true);setMessage('');
  try{const {error}=await browserSupabase().auth.resend({type:'signup',email:email.trim().toLowerCase(),options:{emailRedirectTo:portalOrigin+'/auth/callback'}});if(error)throw error;setMessage('If this address is awaiting confirmation, a fresh email has been requested.')}
  catch{setMessage('Unable to send another confirmation email. Please try again.')}
  finally{setBusy(false)}
 }
 const topLinks=[['Home','https://www.landshopnigeria.com'],['Properties','https://www.landshopnigeria.com/properties'],['About','https://www.landshopnigeria.com/about'],['Resources','https://www.landshopnigeria.com/insights']];
 return <main className={'authEnt authEntV25 '+(mode==='signup'?'authSignUp':'authSignIn')}>
  <header className="authTop"><Brand/><nav aria-label="Landshop navigation">{topLinks.map(([name,href])=><a href={href} key={name}>{name}</a>)}<a href="https://www.landshopnigeria.com">Back to Website</a><a href="/support" className="support">Support</a></nav></header>
  <div className="authSceneEnterprise">
   <div className="authVisual" aria-label="Landshop property and staff activity">
    <div className="authMedia" aria-hidden="true"/>
    <div className="authBenefitGlass" aria-label="Explore Landshop">
     <a href="https://www.landshopnigeria.com/properties"><span className="authBenefitIcon" aria-hidden="true">⌂</span><span><b>Invest in property</b><small>Verified opportunities</small></span></a>
     <button type="button" onClick={()=>changeMode('signup')}><span className="authBenefitIcon" aria-hidden="true">♧</span><span><b>Refer and grow</b><small>Your personal referral link</small></span></button>
     <a href="https://portal.landshopnigeria.com/applications/incubate"><span className="authBenefitIcon" aria-hidden="true">↗</span><span><b>Build wealth</b><small>Develop · Incubate · Grow</small></span></a>
    </div>
   </div>
   <section className="authGlass" aria-label="Landshop customer account">
    {mode==='verify'?<div className="authVerify">
      <Brand/><div className="authVerifySymbol" aria-hidden="true">✉</div><h1>Verify Your <em>Email</em></h1><p>A confirmation link has been sent to <strong>{email}</strong>. Open your inbox and confirm your address to continue to Landshop.</p>
      <a className="authSubmit authLinkButton" href="mailto:">Open Email App</a>
      <button type="button" className="authGoogle" disabled={busy} onClick={resend}>Resend confirmation email</button>
      <button type="button" className="authTextButton" onClick={()=>changeMode('signin')}>Back to Sign In</button>
      {message&&<p className="authMessage" role="status">{message}</p>}
    </div>:<>
     <div className="authTabs" role="tablist" aria-label="Account access">
      <button type="button" role="tab" aria-selected={mode==='signin'} onClick={()=>changeMode('signin')}>Sign In</button>
      <button type="button" role="tab" aria-selected={mode==='signup'} onClick={()=>changeMode('signup')}>Sign Up</button>
     </div>
     {mode==='signup'&&<div className="authProgress" aria-label={'Step '+step+' of 2'}><span className={step>=1?'on':''}/><span className={step===2?'on':''}/><small>Step {step} of 2</small></div>}
     <h1>{mode==='signin'?<>Welcome <em>Back</em></>:<>Create Your <em>Account</em></>}</h1>
     <p className="authCaption">{mode==='signin'?'Sign in to your Landshop Nigeria account':'Create your Landshop account to start your property journey.'}</p>
     {referral&&mode==='signup'&&<p className="authRefNotice">Referral invitation: <strong>{referral}</strong></p>}
     <form onSubmit={submit} className="authForm">
      {mode==='signup'&&step===1&&<>
       <div className="authGrid authGridTwo">
        <Field label="First name"><input required autoComplete="given-name" value={first} onChange={e=>setFirst(e.target.value)} maxLength={55} placeholder="First name"/></Field>
        <Field label="Last name"><input required autoComplete="family-name" value={last} onChange={e=>setLast(e.target.value)} maxLength={55} placeholder="Last name"/></Field>
       </div>
       <Field label="Email address"><input required type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
       <Field label="WhatsApp / phone"><input required type="tel" autoComplete="tel" placeholder="+234 800 000 0000" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
      </>}
      {mode==='signup'&&step===2&&<>
       <Field label="Username"><input required autoComplete="username" pattern="[A-Za-z][A-Za-z0-9_.]{2,29}" placeholder="Choose a username" value={username} onChange={e=>setUsername(e.target.value)}/></Field>
       <div className="authGrid authGridTwo">
        <Field label="Age"><input required type="number" min={18} max={120} placeholder="18+" value={age} onChange={e=>setAge(e.target.value)}/></Field>
        <Field label="Gender (optional)"><BrandedSelect value={gender} onChange={e=>setGender(e.target.value)} aria-label="Gender"><option value="">Select gender</option><option value="female">Female</option><option value="male">Male</option><option value="prefer-not-to-say">Prefer not to say</option></BrandedSelect></Field>
       </div>
       <div className="authGrid authGridTwo">
        <Field label="Password"><div className="authPw"><input type={showPassword?'text':'password'} required minLength={12} autoComplete="new-password" value={password} placeholder="Minimum 12 characters" onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button></div></Field>
        <Field label="Confirm password"><input type={showPassword?'text':'password'} required minLength={12} autoComplete="new-password" value={confirm} placeholder="Confirm password" onChange={e=>setConfirm(e.target.value)}/></Field>
       </div>
       <label className="authInline"><input type="checkbox" checked={accepted} required onChange={e=>setAccepted(e.target.checked)}/> I agree to Landshop's Terms and Privacy notice.</label>
      </>}
      {mode==='signin'&&<>
       <Field label="Email address"><input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
       <Field label="Password"><div className="authPw"><input type={showPassword?'text':'password'} required autoComplete="current-password" placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button></div></Field>
       <div className="authHelp"><label className="authInline"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Remember this device</label><a href="/reset-password">Forgot password?</a></div>
      </>}
      {mode==='signup'&&step===2&&<button type="button" className="authBack" onClick={()=>{setStep(1);setMessage('')}}>← Previous step</button>}
      <button className="authSubmit" disabled={busy} type="submit">{busy?'Please wait…':mode==='signin'?'Sign In':step===1?'Next':'Create Account'} <span aria-hidden="true">→</span></button>
     </form>
     {message&&<p className="authMessage" role="status" aria-live="polite">{message}</p>}
     <p className="authBelow">{mode==='signin'?'Don’t have an account?':'Already have an account?'} <button type="button" onClick={()=>changeMode(mode==='signin'?'signup':'signin')}>{mode==='signin'?'Sign Up':'Sign In'}</button></p>
     <button type="button" className="authGoogle" onClick={google}><GoogleMark/> Continue with Google</button>
    </>}
   </section>
  </div>
  <footer className="authFoot"><span>Develop · Incubate · Grow</span><a href="https://www.landshopnigeria.com/contact">Contact Landshop</a><a href="/support">Support</a></footer>
 </main>;
}
