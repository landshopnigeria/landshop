'use client';
import {useState} from 'react';
import {browserSupabase} from '../lib/supabase-browser';
export default function Portal(){
 const [mode,setMode]=useState<'signin'|'signup'>('signup');
 const [email,setEmail]=useState(''),[phone,setPhone]=useState('');
 const [first,setFirst]=useState(''),[last,setLast]=useState('');
 const [age,setAge]=useState(''),[gender,setGender]=useState('');
 const [password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [show,setShow]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  try{
   const supabase=browserSupabase();
   if(mode==='signup'){
    if(password.length<12||password!==confirm)throw Error('Check password length (minimum 12) and confirmation.');
    if(Number(age)<18)throw Error('Registration requires age 18 or older.');
    const {error}=await supabase.auth.signUp({email,password,options:{
      emailRedirectTo:'https://portal.landshopnigeria.com/auth/callback',
      data:{full_name:first+' '+last,phone,age:Number(age),gender}
    }});
    if(error)throw error;
    setMessage('Check your inbox for the email confirmation link.');
   }else{
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error)throw error;
    window.location.assign('https://app.landshopnigeria.com/dashboard');
   }
  }catch(error){setMessage(error instanceof Error?error.message:'Sign-in failed.')}
  finally{setBusy(false)}
 }
 async function google(){
  try{const {error}=await browserSupabase().auth.signInWithOAuth({provider:'google',options:{
    redirectTo:'https://portal.landshopnigeria.com/auth/callback'
  }});if(error)throw error}catch{setMessage('Google sign-in unavailable.')}
 }
 const field=(name:string,input:React.ReactNode)=><label className="field">{name}{input}</label>;
 return <main className="authScene"><section className="authCard" style={{maxWidth:900}}>
  <a className="brand" href="https://www.landshopnigeria.com">Landshop</a>
  <div className="switcher" role="tablist" aria-label="Access account">
   <button role="tab" aria-selected={mode==='signin'} onClick={()=>setMode('signin')}>Sign In</button>
   <button role="tab" aria-selected={mode==='signup'} onClick={()=>setMode('signup')}>Sign Up</button>
  </div>
  <h1>{mode==='signin'?'Sign in to your secure Landshop portal':'Create your Landshop account'}</h1>
  <p>Everyone Deserves Affordable Property.</p>
  <form onSubmit={submit} style={{display:'grid',gap:14}}>
   {mode==='signup'&&<div className="formGrid">
    {field('First name',<input required placeholder="Enter your first name" autoComplete="given-name" value={first} onChange={e=>setFirst(e.target.value)}/>)}
    {field('Last name',<input required placeholder="Enter your last name" autoComplete="family-name" value={last} onChange={e=>setLast(e.target.value)}/>)}
   </div>}
   <div className="formGrid">
    {mode==='signup'&&field('Phone / WhatsApp',<input required type="tel" autoComplete="tel" placeholder="+234..." value={phone} onChange={e=>setPhone(e.target.value)}/>)}
    {field('Email address',<input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/>)}
   </div>
   {mode==='signup'&&<div className="formGrid">
    {field('Age',<input required min={18} max={120} type="number" value={age} onChange={e=>setAge(e.target.value)} placeholder="Select age"/>)}
    {field('Gender',<select required value={gender} onChange={e=>setGender(e.target.value)}>
      <option value="">Select gender</option><option>Female</option><option>Male</option><option>Prefer not to say</option>
    </select>)}
   </div>}
   <div className="formGrid">
    {field('Password',<input required minLength={mode==='signup'?12:1} type={show?'text':'password'} autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/>)}
    {mode==='signup'&&field('Confirm password',<input required type={show?'text':'password'} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/>)}
   </div>
   <label><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/> Show password</label>
   {mode==='signin'&&<a href="/reset-password">Forgot password?</a>}
   <div className="authActions"><button type="submit" disabled={busy}>{mode==='signup'?'Create Account':'Sign In'}</button>
   <button type="button" onClick={google}>Continue with Google</button></div>
  </form>
  <p role="status" aria-live="polite">{message}</p>
  <p>Verify your email after registration. KYC is required inside your dashboard.</p>
  <p>{mode==='signup'?'Already have an account?':'Don’t have an account?'} <button type="button" onClick={()=>setMode(mode==='signup'?'signin':'signup')}>{mode==='signup'?'Sign in':'Create account'}</button></p>
 </section></main>;
}
