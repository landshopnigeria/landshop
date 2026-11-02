'use client';
import { useState } from 'react';

export default function ResetPassword(){
  const [email,setEmail]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');
    try{
      const response=await fetch('/api/auth/email-action',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        cache:'no-store',
        body:JSON.stringify({action:'recovery',email:email.trim().toLowerCase()})
      });
      const result=await response.json() as {ok?:boolean;message?:string};
      if(!response.ok||!result.ok)throw new Error(result.message||'Unable to request password recovery.');
      setMessage(result.message||'If this address is registered, a recovery email will arrive shortly.');
    }catch(error){
      setMessage(error instanceof Error?error.message:'Unable to request password recovery. Please try again later.');
    }finally{setBusy(false)}
  }
  return <main className="authScene"><form className="authCard" onSubmit={submit}>
    <a href="/" className="brand">Landshop</a><h1>Reset your password</h1>
    <p>Enter the email connected to your Landshop account.</p>
    <label htmlFor="reset-email">Email address</label>
    <input id="reset-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com"/>
    <button type="submit" disabled={busy}>Send recovery link</button>
    <p role="status" aria-live="polite">{message}</p><a href="/">Back to sign in</a>
  </form></main>
}
