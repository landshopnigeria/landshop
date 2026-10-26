'use client';
import { useState } from 'react';
import { browserSupabase } from '../../lib/supabase-browser';

export default function ResetPassword(){
  const [email,setEmail]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');
    try{
      const {error}=await browserSupabase().auth.resetPasswordForEmail(email,{
        redirectTo:'https://portal.landshopnigeria.com/update-password'
      });
      if(error) throw error;
      setMessage('If this address is registered, a recovery email will arrive shortly.');
    }catch{
      setMessage('Unable to request password recovery. Please try again later.');
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
