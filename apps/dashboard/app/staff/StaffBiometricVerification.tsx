'use client';
import {useEffect,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import Link from 'next/link';

type Check={enabled:boolean;status:string;next:string;url:string|null};
const endpoint='https://iwkfagzkogzidrbbezds.supabase.co/functions/v1/staff-identity';
export default function StaffBiometricVerification({photoReady,kycState}:{photoReady:boolean;kycState:string}){
 const [state,setState]=useState<Check|null>(null);
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [checked,setChecked]=useState(false);
 async function request(action:'status'|'start',approved=false):Promise<Check>{
  const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!u||!k)throw Error('Secure staff authentication is not configured.');
  const db=createBrowserClient(u,k,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
  const {data:{session},error:sessionError}=await db.auth.getSession();
  if(sessionError||!session?.access_token)throw Error('Your login session expired. Sign in again.');
  const response=await fetch(endpoint,{method:'POST',cache:'no-store',headers:{
   'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':k,
  },body:JSON.stringify({action,consent:approved}),credentials:'omit'});
  const result=await response.json().catch(()=>null);
  if(!response.ok)throw Error(typeof result?.error==='string'?result.error:'Identity verification service temporarily unavailable.');
  return result as Check;
 }
 async function refresh(){
  try{const result=await request('status');setState(result);setChecked(true);
   if(result.status==='approved'&&kycState!=='approved'&&
    typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('verification')){
    window.location.replace('/staff');}
  }catch(e){setError(e instanceof Error?e.message:'Unable to check verification');setChecked(true)}
 }
 useEffect(()=>{
  let active=true;let interval:number|undefined;
  const initial=async()=>{try{const result=await request('status');if(active){setState(result);setChecked(true);
   if(result.status==='approved'&&kycState!=='approved'&&new URLSearchParams(location.search).has('verification'))location.replace('/staff');}}
   catch(e){if(active){setError(e instanceof Error?e.message:'Status unavailable');setChecked(true)}}
  };
  void initial();
  interval=window.setInterval(()=>{if(active&&document.visibilityState==='visible')void initial()},25000);
  return()=>{active=false;if(interval!==undefined)window.clearInterval(interval)};
 },[kycState]);
 async function begin(){
  if(!consent||busy)return;
  setBusy(true);setError('');
  try{const result=await request('start',true);setState(result);
   if(result.url){const url=new URL(result.url);
    if(url.protocol!=='https:'||!(url.hostname.endsWith('.veriff.me')||url.hostname.endsWith('.veriff.com')))
      throw Error('Identity provider returned an unexpected address.');
    window.location.assign(result.url);
   }else setError('Your verification is being reviewed. Please check your status.')}
  catch(e){setError(e instanceof Error?e.message:'Unable to start verification')}
  finally{setBusy(false)}
 }
 const status=kycState==='approved'?'approved':state?.status||'not_started';
 return <section className="ls-biometric" aria-labelledby="ls-biometric-heading">
  <div className="ls-biometric-head"><div><small>INDEPENDENT IDENTITY CHECK</small><h3 id="ls-biometric-heading">Verify Document & Live Selfie</h3></div><span className={'ls-biometric-status '+(status==='approved'?'ok':'')}>{checked?status.replaceAll('_',' '):'Checking...'}</span></div>
  <p>Landshop can automatically approve staff identity only after a qualified verification service confirms a genuine identity document and matching live selfie. No one can authorize their own identity or management role.</p>
  {state?.enabled?<>
   {status==='approved'?<p role="status" className="ls-biometric-success">Independent identity verification passed. Your staff profile is approved.</p>:<>
    {!photoReady&&<p role="status">First submit a clear portrait above, then begin independent verification.</p>}
    <label className="ls-biometric-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/><span>I explicitly consent to transferring my identity-document and live-selfie evidence to Landshop's independent verification provider for the purpose of staff verification. I have read the <Link href="/staff/privacy">staff privacy notice</Link>, including the option to request a manual review.</span></label>
    <div className="ls-biometric-actions"><button type="button" onClick={()=>void begin()} disabled={busy||!photoReady||!consent||status==='review'}>{busy?'Connecting securely...':'Start Secure Identity Check'}</button>{state?.url&&<a href={state.url} rel="noreferrer">Continue existing verification</a>}</div>
   </>}
  </>:<p role="status" className="ls-biometric-pending">Automated document and biometric verification is awaiting activation of the independent provider credentials. Your basic staff dashboard remains active. Management can continue manual identity review.</p>}
  <button type="button" className="ls-biometric-refresh" onClick={()=>void refresh()} disabled={busy}>Refresh verification status</button>
  {error&&<p role="alert" className="ls-biometric-error">{error}</p>}
 </section>
}
