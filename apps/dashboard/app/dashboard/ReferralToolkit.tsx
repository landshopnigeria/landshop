'use client';
import {useState} from 'react';

type ReferralSummary={total_referrals:number;email_verified:number;kyc_verified:number;approved_applications:number};
export default function ReferralToolkit({code,summary}:{code:string|null;summary:ReferralSummary|null}){
 const [feedback,setFeedback]=useState('');
 const invitation=code?'https://portal.landshopnigeria.com/?mode=signup&ref='+encodeURIComponent(code):'';
 const qrUrl=invitation?'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=16&data='+encodeURIComponent(invitation):'';
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
    <a href={qrUrl} target="_blank" rel="noopener noreferrer">Open / Save QR code</a>
   </div>
  </div>
  <div className="cd-ref-stats" aria-label="Referral performance">
   <div><strong>{counts.total_referrals}</strong><span>Registrations</span></div>
   <div><strong>{counts.email_verified}</strong><span>Email verified</span></div>
   <div><strong>{counts.kyc_verified}</strong><span>KYC approved</span></div>
   <div><strong>{counts.approved_applications}</strong><span>Approved applications</span></div>
  </div>
  <p className="cd-ref-fine">Referral rewards require Landshop’s verified eligibility rules and approved financial transactions. Sharing or sign-up alone does not create an earnings balance.</p>
 </section>;
}
