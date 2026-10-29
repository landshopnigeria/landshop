
'use client';
import {useState} from 'react';
import {browserSupabase} from '../lib/supabase-browser';
import './auth-enterprise.css';
type Mode='signin'|'signup';
export default function Portal(){
 const [mode,setMode]=useState<Mode>('signin');
 const [first,setFirst]=useState(''),[middle,setMiddle]=useState(''),[last,setLast]=useState('');
 const [username,setUsername]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState('');
 const [age,setAge]=useState(''),[gender,setGender]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [visible,setVisible]=useState(false),[accepted,setAccepted]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 function selectMode(value:Mode){setMode(value);setMessage('');setPassword('');setConfirm('')}
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setMessage('');
  try{
   const db=browserSupabase();
   if(mode==='signup'){
    if(!/^[a-zA-Z][a-zA-Z0-9_.]{2,29}$/.test(username))throw Error('Username must be 3–30 characters, starting with a letter.');
    if(!first.trim()||!last.trim())throw Error('Your first and last name are required.');
    if(!/^\+?[0-9 ]{8,18}$/.test(phone))throw Error('Enter a valid phone number including country code.');
    if(Number(age)<18||Number(age)>120)throw Error('You must be 18 or older to register.');
    if(password.length<12||password!==confirm)throw Error('Use a password of at least 12 characters and confirm it correctly.');
    if(!accepted)throw Error('Please acknowledge the Terms and Privacy notice.');
    const {error}=await db.auth.signUp({email:email.trim().toLowerCase(),password,options:{
      emailRedirectTo:'https://portal.landshopnigeria.com/auth/callback',
      data:{full_name:[first,middle,last].filter(Boolean).join(' ').trim(),username:username.trim().toLowerCase(),phone:phone.trim(),age:Number(age),gender}
    }});
    if(error)throw error;
    setMessage('Registration received. Check your email for the confirmation link before signing in. Your username is captured as a profile preference; email remains the login identifier.');
    setPassword('');setConfirm('');
   }else{
    const {data,error}=await db.auth.signInWithPassword({email:email.trim(),password});
    if(error)throw error;
    if(!data.user)throw Error('Authentication could not be verified.');
    window.location.assign('https://app.landshopnigeria.com/dashboard');
   }
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to complete request.')}
  finally{setBusy(false)}
 }
 async function google(){
  setMessage('');
  try{const {error}=await browserSupabase().auth.signInWithOAuth({provider:'google',options:{redirectTo:'https://portal.landshopnigeria.com/auth/callback'}});if(error)throw error}
  catch{setMessage('Google sign-in is not available at this time. Try email and password.')}
 }
 const field=(label:string,node:React.ReactNode)=><label>{label}{node}</label>;
 return <main className="authEnt">
  <header className="authTop"><a href="https://www.landshopnigeria.com" aria-label="Landshop homepage"><img src="/media/logo.webp" alt="Landshop" width={128} height={48}/></a><nav aria-label="Portal navigation"><a href="https://www.landshopnigeria.com">Home</a><a href="https://www.landshopnigeria.com/properties">Properties</a><a href="https://www.landshopnigeria.com/about">About</a><a href="https://www.landshopnigeria.com/insights">Resources</a><a href="https://www.landshopnigeria.com">Back to Website ↗</a><a href="/support" className="support">Portal Support</a></nav></header>
  <section className="authSceneEnterprise">
   <div className="authStory"><span className="kick">WELCOME TO LANDSHOP NIGERIA PORTAL</span><h1>One Account.<br/><span>More Opportunities.</span></h1><p>Access properties, submit applications, track your progress, complete KYC and explore your property journey—all from one secure account.</p><div className="authBenefits"><span><b>⌂</b> Invest in property</span><span><b>♧</b> Refer and grow</span><span><b>↗</b> Build wealth</span></div></div>
   <section className="authGlass" aria-label="Landshop account sign in and registration">
    <div className="authTabs" role="tablist" aria-label="Account access"><button type="button" role="tab" aria-selected={mode==='signin'} onClick={()=>selectMode('signin')}>Sign In</button><button type="button" role="tab" aria-selected={mode==='signup'} onClick={()=>selectMode('signup')}>Sign Up</button></div>
    <h2>{mode==='signin'?'Welcome Back':'Create Your Account'}</h2><p className="caption">{mode==='signin'?'Sign in to your Landshop Nigeria portal':'Enter your details to begin your Landshop account'}</p>
    <form className="authForm" onSubmit={submit}>
     {mode==='signup'&&<div className="fields3">
      {field('First name',<input required autoComplete="given-name" value={first} onChange={e=>setFirst(e.target.value)} maxLength={55} placeholder="First name"/>)}
      {field('Middle name',<input autoComplete="additional-name" value={middle} onChange={e=>setMiddle(e.target.value)} maxLength={55} placeholder="Optional"/>)}
      {field('Last name',<input required autoComplete="family-name" value={last} onChange={e=>setLast(e.target.value)} maxLength={55} placeholder="Surname"/>)}
     </div>}
     {mode==='signup'&&<div className="fields2">
      {field('Username',<input required value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" placeholder="Preferred username" pattern="[A-Za-z][A-Za-z0-9_.]{2,29}"/>)}
      {field('WhatsApp / phone',<input required type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+234 800 000 0000"/>)}
     </div>}
     {field('Email address',<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" maxLength={254}/>)}
     {mode==='signup'&&<div className="fields2">
      {field('Age',<input required min={18} max={120} type="number" value={age} onChange={e=>setAge(e.target.value)} placeholder="18+"/>)}
      {field('Gender (optional)',<select value={gender} onChange={e=>setGender(e.target.value)}><option value="">Select if you wish</option><option value="female">Female</option><option value="male">Male</option><option value="prefer-not-to-say">Prefer not to say</option></select>)}
     </div>}
     <div className="fields2" style={mode==='signin'?{gridTemplateColumns:'1fr'}:{}}>
      {field('Password',<div className="authPw"><input required type={visible?'text':'password'} minLength={mode==='signup'?12:1} autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password"/><button type="button" onClick={()=>setVisible(x=>!x)} aria-label={visible?'Hide password':'Show password'}>{visible?'Hide':'Show'}</button></div>)}
      {mode==='signup'&&field('Confirm password',<input required type={visible?'text':'password'} minLength={12} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm password"/>)}
     </div>
     {mode==='signin'?<div className="authHelp"><label className="authInline"><input type="checkbox" defaultChecked/> Remember this device</label><a href="/reset-password">Forgot password?</a></div>:<label className="authInline"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} required/> I agree to the <a href="https://www.landshopnigeria.com/contact">Terms and Privacy notice</a></label>}
     <button type="submit" className="authSubmit" disabled={busy}>{busy?'Please wait…':mode==='signin'?'Sign In to Portal ↗':'Create Account ↗'}</button>
    </form>
    {mode==='signin'&&<div className="authAlt"><small>OR CONTINUE WITH</small><button type="button" onClick={google}>Continue with Google</button></div>}
    {message&&<p role="status" className="authMessage" aria-live="polite">{message}</p>}
    <p className="authBelow">{mode==='signin'?'Don’t have an account?':'Already registered?'} <button type="button" onClick={()=>selectMode(mode==='signin'?'signup':'signin')}>{mode==='signin'?'Sign Up':'Sign In'}</button></p>
   </section>
  </section>
  <footer className="authFoot"><span>Develop · Incubate · Grow</span><a href="/applications">Product Application Forms</a><a href="/support">Support</a><span>Identity verification is completed after registration.</span></footer>
 </main>;
}
