'use client';
import {useEffect,useState} from 'react';
import {browserSupabase} from '../../lib/supabase-browser';

const DASH='https://app.landshopnigeria.com';
const PORTAL='https://portal.landshopnigeria.com';
type Props={signedIn:boolean;onSignIn:()=>void};
type Activity={id:string;kind:string;status:string;created_at:string};

export function MobileReferralPanel({signedIn,onSignIn}:Props){
 const [code,setCode]=useState<string|null>(null);
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState('');
 const invitation=code?PORTAL+'/?mode=signup&ref='+encodeURIComponent(code):'';
 useEffect(()=>{
  if(!signedIn){setCode(null);return}
  let active=true;setLoading(true);setMessage('');
  const load=async()=>{
   try{
    const db=browserSupabase();
    const {data:{user},error:authError}=await db.auth.getUser();
    if(authError||!user)throw Error('Session unavailable');
    const {data,error}=await db.from('referral_codes').select('code').eq('user_id',user.id).maybeSingle();
    if(error)throw error;
    if(active)setCode(typeof data?.code==='string'&&/^LANDSHOP[0-9]{2,12}$/.test(data.code)?data.code:null);
   }catch{if(active)setMessage('Your referral information could not be loaded securely.')}
   finally{if(active)setLoading(false)}
  };void load();return()=>{active=false};
 },[signedIn]);
 const copy=async(value:string,label:string)=>{
  if(!navigator.clipboard?.writeText){setMessage('Select the code or link to copy it from your browser.');return}
  try{await navigator.clipboard.writeText(value);setMessage(label+' copied.')}
  catch{setMessage('Select the code or link to copy it manually.')}
 };
 const share=async()=>{
  if(!invitation)return;
  if(navigator.share){
   try{await navigator.share({title:'Join Landshop Nigeria',text:'Explore property ownership opportunities with Landshop.',url:invitation});return}
   catch{/* The visitor can still copy the link. */}
  }
  await copy(invitation,'Invitation link');
 };
 if(!signedIn)return <div className="lm-member-state"><p>Your personal referral code and QR toolkit are available after sign-in.</p><button onClick={onSignIn}>Sign In to Refer &amp; Grow</button></div>;
 if(loading)return <p className="lm-member-loading" role="status">Loading your secure referral details…</p>;
 if(!code)return <div className="lm-member-state"><p>{message||'Your referral code is being prepared for your customer account.'}</p><a href={DASH+'/dashboard#referrals'}>Open Referral Centre</a></div>;
 return <div className="lm-member-panel">
  <section className="lm-referral-code-card" aria-label="Your referral invitation">
   <small>YOUR PERSONAL REFERRAL CODE</small><div><strong>{code}</strong><button onClick={()=>void copy(code,'Referral code')}>Copy code</button></div>
   <label>Invitation link<input readOnly value={invitation} onFocus={e=>e.currentTarget.select()} aria-label="Your referral invitation link"/></label>
   <div className="lm-member-actions"><button onClick={()=>void copy(invitation,'Invitation link')}>Copy link</button><button onClick={()=>void share()}>Share invitation</button></div>
  </section>
  <div className="lm-member-actions"><a href={'https://wa.me/?text='+encodeURIComponent('Explore Landshop Nigeria: '+invitation)} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a><a href={DASH+'/dashboard#referrals'}>My QR &amp; referral activity</a></div>
  {message&&<p className="lm-member-feedback" role="status">{message}</p>}
  <p className="lm-member-disclaimer">Sharing an invitation does not guarantee a reward. Referral eligibility and any earnings are verified by Landshop.</p>
 </div>;
}

export function MobileActivityPanel({signedIn,onSignIn}:Props){
 const [activity,setActivity]=useState<Activity[]>([]);
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{
  if(!signedIn){setActivity([]);setState('ready');return}
  let active=true;setState('loading');
  const load=async()=>{
   try{
    const db=browserSupabase();
    const {data:{user},error:authError}=await db.auth.getUser();
    if(authError||!user)throw Error('Session unavailable');
    const {data,error}=await db.from('applications').select('id,kind,status,created_at').eq('applicant_id',user.id).order('created_at',{ascending:false}).limit(5);
    if(error)throw error;
    if(active){setActivity((data||[]) as Activity[]);setState('ready')}
   }catch{if(active)setState('error')}
  };void load();return()=>{active=false};
 },[signedIn]);
 if(!signedIn)return <div className="lm-member-state"><p>Sign in to view your account activity and application updates.</p><button onClick={onSignIn}>Sign In</button></div>;
 if(state==='loading')return <p className="lm-member-loading" role="status">Checking your latest account activity…</p>;
 if(state==='error')return <div className="lm-member-state"><p>We could not load your recent activity. Your secure dashboard may have more information.</p><a href={DASH+'/dashboard/applications'}>Open My Applications</a></div>;
 if(!activity.length)return <div className="lm-member-state"><p>No application updates yet. Submitted requests will appear here when they are recorded.</p><a href="https://portal.landshopnigeria.com/applications">Explore Product Applications</a></div>;
 return <div className="lm-member-panel"><h2 className="lm-member-heading">Recent application activity</h2><ul className="lm-activity-list">
  {activity.map(item=><li key={item.id}><span className="lm-activity-dot" aria-hidden="true"/><div><strong>{item.kind.replaceAll('_',' ')}</strong><span>Status: {item.status.replaceAll('_',' ')}</span><small>{new Date(item.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric',timeZone:'Africa/Lagos'})}</small></div></li>)}
 </ul><a className="lm-member-full-link" href={DASH+'/dashboard/applications'}>View all applications</a>
 <p className="lm-member-disclaimer">These are recorded application status updates, not push notifications or inspection confirmations.</p></div>;
}
