'use client';
import {useState} from 'react';
import {browserSupabase} from '../../lib/supabase-browser';

export default function UpdatePassword(){
  const [password,setPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [visible,setVisible]=useState(false);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setMessage('');
    if(password.length<12){setMessage('Choose a password of at least 12 characters.');return}
    if(password!==confirmation){setMessage('Passwords do not match.');return}
    setBusy(true);
    try{
      const {data:{user},error:sessionError}=await browserSupabase().auth.getUser();
      if(sessionError || !user){setMessage('This reset link is invalid or expired. Request a new link.');return}
      const {error}=await browserSupabase().auth.updateUser({password});
      if(error) throw error;
      setMessage('Password updated successfully. You may now sign in.');
    }catch{setMessage('Password update failed. Request a fresh recovery email.')}
    finally{setBusy(false)}
  }
  return <main className="authScene"><form className="authCard" onSubmit={submit}>
    <a href="/" className="brand">Landshop</a><h1>Choose a new password</h1>
    <label htmlFor="new-pass">New password</label><input id="new-pass" minLength={12} required type={visible?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/>
    <label htmlFor="confirm-pass">Confirm password</label><input id="confirm-pass" minLength={12} required type={visible?'text':'password'} value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="new-password"/>
    <label><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/> Show passwords</label>
    <button disabled={busy} type="submit">Update password</button>
    <p aria-live="polite" role="status">{message}</p>
    <a href="/">Back to sign in</a>
  </form></main>
}
