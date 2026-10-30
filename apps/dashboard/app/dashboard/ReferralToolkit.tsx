'use client';
import {useState} from 'react';

type ReferralSummary={total_referrals:number;email_verified:number;kyc_verified:number;approved_applications:number};
type ReferralActivity={joined_at:string;milestone:string;email_verified:boolean;kyc_approved:boolean;application_approved:boolean};
type RewardEvent={id:string;created_at:string;description:string|null;status:string;direction:string;amount_kobo:number};
export default function ReferralToolkit({code,summary,activity=[],rewards=[]}:{code:string|null;summary:ReferralSummary|null;activity?:ReferralActivity[];rewards?:RewardEvent[]}){
 const [feedback,setFeedback]=useState('');
 const invitation=code?'https://portal.landshopnigeria.com/?mode=signup&ref='+encodeURIComponent(code):'';
 const qrUrl=invitation?'/api/referral-qr':'';
 const counts={total_referrals:Number(summary?.total_referrals||0),email_verified:Number(summary?.email_verified||0),kyc_verified:Number(summary?.kyc_verified||0),approved_applications:Number(summary?.approved_applications||0)};
 const copy=async(s:string,what:string)=>{
  try{await navigator.clipboard.writeText(s);setFeedback(what+' copied')}catch{setFeedback('Use your browser’s copy command to share this link.')}
 };
 const share=async()=>{
  if(!invitation)return;
  if(typeof navigator.share==='function'){try{await navigator.share({title:'Join Landshop Nigeria',text:'Explore property opportunities with Landshop.',url:invitation});return}catch{}}
  await copy(invitation,'Referral link');
 };
 const social=(channel:string)=>{
  if(!invitation)return;
  const text='Discover Landshop Nigeria through my invitation: '+invitation;
  const encoded=encodeURIComponent(text),link=encodeURIComponent(invitation);
  const urls:{[key:string]:string}={
   WhatsApp:'https://wa.me/?text='+encoded,
   Facebook:'https://www.facebook.com/sharer/sharer.php?u='+link,
   X:'https://twitter.com/intent/tweet?text='+encoded,
   LinkedIn:'https://www.linkedin.com/sharing/share-offsite/?url='+link,
   Telegram:'https://t.me/share/url?url='+link+'&text='+encodeURIComponent('Join me on Landshop Nigeria')
  };
  const url=urls[channel];if(url)window.open(url,'_blank','noopener,noreferrer');
 };
 if(!code)return <section className="cd-referral cd-panel" id="referrals"><h2>Refer &amp; Grow</h2><p>Your referral code is being prepared. Refresh after your account registration is completed.</p></section>;
 return <section className="cd-referral cd-panel" id="referrals" aria-labelledby="ref-title">
  <div className="cd-section-head"><div><small>REFER &amp; GROW</small><h2 id="ref-title">Your Referral Centre</h2></div><span className="cd-ref-tag">Landshop invitation</span></div>
  <div className="cd-ref-grid">
   <div className="cd-code-panel"><small>YOUR UNIQUE REFERRAL CODE</small><div className="cd-code-value">{code}<button type="button" aria-label="Copy referral code" onClick={()=>copy(code,'Code')}>Copy</button></div>
    <p>Share this code or your invitation link with new customers.</p>
    <div className="cd-link-box"><span>{invitation}</span><button type="button" onClick={()=>copy(invitation,'Referral link')}>Copy link</button></div>
    <div className="cd-ref-buttons">
     <button type="button" className="cd-primary-share" onClick={share}>Share invitation</button>
     {['WhatsApp','Facebook','X','LinkedIn','Telegram'].map(channel=><button key={channel} type="button" onClick={()=>social(channel)}>{channel}</button>)}
    </div>
    {feedback&&<p className="cd-copy-status" role="status">{feedback}</p>}
   </div>
   <div className="cd-qr-panel">
    <div className="cd-qr-image"><img src={qrUrl} loading="lazy" alt={'Scannable QR code for your Landshop referral link '+invitation} width={190} height={190}/></div>
    <strong>Scan to Register</strong><p>Visitors can scan this QR code to open your personal sign-up link.</p>
    <a href={qrUrl+'?download=1'} download={'Landshop-'+code+'-Referral-QR.png'}>Download QR code</a>
   </div>
  </div>
  <div className="cd-ref-stats" aria-label="Referral performance">
   <div><strong>{counts.total_referrals}</strong><span>Registrations</span></div>
   <div><strong>{counts.email_verified}</strong><span>Email verified</span></div>
   <div><strong>{counts.kyc_verified}</strong><span>KYC approved</span></div>
   <div><strong>{counts.approved_applications}</strong><span>Approved applications</span></div>
  </div>
  <div className="cd-ref-tracking">
    <section aria-labelledby="cd-ref-activity-title">
     <h3 id="cd-ref-activity-title">Recent Referral Activity</h3>
     {activity.length?<ol className="cd-ref-activity-list">{activity.map((item,index)=><li key={item.joined_at+'-'+index}>
      <span className="cd-ref-milestone"><span className="cd-ref-check" aria-hidden="true">✓</span><strong>{item.milestone}</strong></span>
      <time dateTime={item.joined_at}>{new Date(item.joined_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</time>
     </li>)}</ol>:<p className="cd-ref-empty">No referrals yet. Share your personal link or QR code to invite new customers.</p>}
     <p className="cd-ref-fine">Milestones only. Names, emails and identity documents of referred people remain private.</p>
    </section>
    <section aria-labelledby="cd-ref-rewards-title">
     <h3 id="cd-ref-rewards-title">Referral Reward History</h3>
     {rewards.length?<ol className="cd-ref-activity-list">{rewards.map(item=><li key={item.id}>
      <span><strong>{item.description||'Referral reward'}</strong><small className="cd-reward-status">{item.status} · {item.direction}</small></span>
      <strong className="cd-reward-amount">{new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(item.amount_kobo/100)}</strong>
     </li>)}</ol>:<p className="cd-ref-empty">No reward transactions recorded yet.</p>}
     <p className="cd-ref-fine">Reward amounts appear here only when recorded by Landshop's authorized finance process.</p>
    </section>
  </div>
  <p className="cd-ref-fine">Referral rewards require Landshop’s verified eligibility rules and approved financial transactions. Sharing or sign-up alone does not create an earnings balance.</p>
 </section>;
}
