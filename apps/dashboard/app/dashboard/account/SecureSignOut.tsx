'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';

export default function SecureSignOut(){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function signOut(){
  setBusy(true);setError('');
  try{
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!key)throw Error('Authentication is not configured.');
   const supabase=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',secure:true,sameSite:'lax'}});
   const result=await supabase.auth.signOut({scope:'global'});
   if(result.error)throw result.error;
   window.location.replace('https://portal.landshopnigeria.com/');
  }catch{
   setError('Could not securely sign out. Please retry or contact support.');
   setBusy(false);
  }
 }
 return <div><button disabled={busy} type="button" onClick={signOut} className="dc-cta" style={{cursor:'pointer',background:'#0c4c43'}}>{busy?'Signing out…':'Sign out of Landshop'}</button>{error&&<p role="alert" style={{color:'#9d2e1d'}}>{error}</p>}</div>;
}
