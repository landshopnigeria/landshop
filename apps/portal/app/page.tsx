'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
const callback='https://portal.landshopnigeria.com/auth/callback';
function client(){
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    throw Error('Supabase connection is not configured');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{flowType:'pkce'}});
}
export default function Portal(){
  const [mode,setMode]=useState<'signup'|'signin'>('signup');
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState(''); const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false); const [show,setShow]=useState(false);
  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMessage('');
    try{
      if(mode==='signup'){
        if(password!==confirm)throw Error('Passwords do not match');
        const {error}=await client().auth.signUp({email,password,options:{emailRedirectTo:callback}});
        if(error)throw error;setMessage('Check your inbox for a confirmation email.');
      }else{
        const {error}=await client().auth.signInWithPassword({email,password});
        if(error)throw error;setMessage('Sign-in succeeded. Dashboard session handoff is pending.');
      }
    }catch(e){setMessage(e instanceof Error?e.message:'Authentication failed')}finally{setBusy(false)}
  }
  async function google(){
    try{const {error}=await client().auth.signInWithOAuth({provider:'google',options:{redirectTo:callback}});if(error)throw error}
    catch(e){setMessage(e instanceof Error?e.message:'Google sign-in unavailable')}
  }
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#ecf6f1',fontFamily:'Arial,sans-serif'}}>
    <div style={{maxWidth:520,width:'92%',background:'#ffffffcc',border:'1px solid #cfe7d8',borderRadius:22,padding:34,boxShadow:'0 22px 70px #064b3620'}}>
      <h1 style={{color:'#076d57'}}>Landshop</h1><div style={{display:'flex',gap:10}}>
      <button type="button" onClick={()=>setMode('signin')}>Sign In</button><button type="button" onClick={()=>setMode('signup')}>Sign Up</button></div>
      <h2>{mode==='signup'?'Create your Landshop account':'Sign in to your secure Landshop portal'}</h2>
      <form onSubmit={submit} style={{display:'grid',gap:15}}>
        <label>Email address <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:'block',padding:12,width:'100%'}} /></label>
        <label>Password <input required minLength={8} type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block',padding:12,width:'100%'}} /></label>
        {mode==='signup'&&<label>Confirm password <input required type={show?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} style={{display:'block',padding:12,width:'100%'}} /></label>}
        <label><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)} /> Show passwords</label>
        <button disabled={busy} type="submit" style={{padding:14,background:'#078e72',color:'white',border:0,borderRadius:10}}>{mode==='signup'?'Create Account':'Sign In'}</button>
        <button type="button" onClick={google} style={{padding:14,borderRadius:10}}>Continue with Google</button>
      </form><p role="status">{message}</p><p>Email verification and KYC are required before protected activities.</p>
    </div></main>
}
