'use client';
import type {ReactNode} from 'react';
import catalog from './catalog.json';
export type Scenario=(typeof catalog.templates)[number];
export type PremiumOverride={id:string;subject:string;headline:string;body:string;whatsapp:string;sms:string;image_url:string|null;state:string;change_note:string|null};
export type Channel='Email'|'WhatsApp'|'SMS';
const photos:Record<string,string>={
 Xtra:'/media/famous0.webp',Beta:'/media/maiyegun0.webp',Invest:'/media/deck-investment.webp',
 'Estate Pro':'/media/deck-building.webp',Develop:'/media/famous0.webp','Dev Pro':'/media/deck-building.webp'
};
const vars:Record<string,string>={
 first_name:'Amina',plan:'Mortgage Xtra',property:'Selected Landshop property',application_ref:'LNS-REVIEW-001',
 inspection_date:'Confirmed inspection date',inspection_time:'Confirmed time',booking_ref:'Confirmed booking reference',
 investment_status:'Verified investment status',loan_status:'Verified lender status',account_officer:'Assigned officer',
 payment_amount:'Confirmed amount',payment_ref:'Verified reference',payment_date:'Confirmed date',balance_due:'Verified balance',
 due_date:'Contractual due date',annual_rate:'Contractual rate',equity_rate:'Approved equity',milestone:'Verified milestone',
 staff_owner:'Assigned officer',staff_phone:'Verified officer phone',contract_year:'Contract year',
 investment_plan:'Selected investment plan',roi_summary:'Verified return summary',allocation_ref:'Official allocation reference'
};
function substitute(s:string){return s.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi,(_all,key:string)=>vars[key]||'Pending confirmation');}
function MsgText({text}:{text:string}){return <>{substitute(text).split(/\n\s*\n/).filter(Boolean).map((part,i)=><p key={i}>{part}</p>)}</>}
function MediaLogo({width=118}:{width?:number}){return <img src="/media/logo-transparent.png" width={width} height={Math.round(width*.62)} loading="lazy" alt="Original Landshop transparent logo" style={{objectFit:'contain',height:'auto',background:'transparent',border:'none'}}/>;}
function IconEmail():ReactNode{return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d7069" strokeWidth="1.7"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>;}
function IconWhatsapp():ReactNode{return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.5" fill="#25D366"/><path d="M6 18.5l.9-3.4a7 7 0 1 1 2.1 2.1L6 18.5z" fill="#fff"/><path d="M8.8 8.5c.1-.3.4-.5.7-.4.3 0 .5.3.8 1l.4 1c.1.2-.1.4-.3.7l-.3.4c.7 1.2 1.7 2.1 2.9 2.7l.5-.6c.2-.3.4-.3.7-.2l1.6.8c.3.2.2.5.1.9-.2.7-1 1.1-1.8 1.1-2 0-5.8-3.4-5.9-5.8 0-.7.2-1.2.6-1.6z" fill="#25D366"/></svg>;}
export default function PremiumMessagePreview({template,journey,channel,override}:{template:Scenario;journey:string;channel:Channel;override?:PremiumOverride}){
 const emailSubject=override?.subject||template.subject;
 const emailHeadline=override?.headline||template.premium.headline;
 const emailBody=override?.body||template.premium.body;
 const whatsapp=override?.whatsapp||template.wa;
 const sms=override?.sms||template.sms;
 const image=(override?.image_url && /^\/media\/[A-Za-z0-9_./-]+\.webp$/.test(override.image_url))?override.image_url:photos[journey]||photos.Develop;
 const state=override?.state||'draft';
 return channel==='Email'?<article className="comm-premium-mail" aria-label="Premium Landshop email preview">
  <div className="comm-premium-meta"><strong>LANDSHOP · EMAIL PREVIEW</strong><small>Subject: {substitute(emailSubject)}</small></div>
  <div className="comm-premium-top"><MediaLogo width={124}/><small>LANDSHOP CUSTOMER EXPERIENCE</small><span/></div>
  <div className="comm-premium-middle"><small>A NOTE FROM LANDSHOP</small><h2>{substitute(emailHeadline)}</h2><div className="comm-premium-accent"/></div>
  <div className="comm-premium-body">
    <figure className="comm-premium-photo"><img src={image} alt="Illustrative Landshop Nigerian property archive photo" loading="lazy"/><figcaption>Illustrative Landshop photograph. Live messages require verified property matching.</figcaption></figure>
    <strong className="comm-premium-greeting">Hello, {vars.first_name}.</strong>
    <div className="comm-premium-copy"><MsgText text={emailBody}/></div>
    <span className="comm-premium-cta">{template.premium.cta}<span aria-hidden="true">↗</span></span>
    <small className="comm-premium-trust">{template.intent==='Marketing'?'Thoughtful updates, on your terms. You can unsubscribe at any time.':'Your trusted updates, in one secure place.'}</small>
  </div>
  <footer className="comm-premium-footer"><MediaLogo width={104}/><strong>LANDSHOP LIMITED</strong>
   <p>Suite 1, 3rd Floor, King's Deck, Alternative Route, Chevron Drive,<br/> Lekki-Epe Expressway, Lagos, Nigeria.</p>
   <p>+234 1 888 0063 · WhatsApp +234 818 886 6772</p>
   <p><a href="mailto:care@landshopnigeria.com">care@landshopnigeria.com</a> · <a href="https://www.landshopnigeria.com">www.landshopnigeria.com</a></p>
   <div className="comm-premium-rule"/>
   <small>{template.intent==='Marketing'?'Marketing sends must include a working unsubscribe link.':'Landshop never requests passwords or OTPs by email.'}</small>
   <small>© {new Date().getFullYear()} Landshop Limited. All rights reserved.</small>
  </footer>
  <div className="comm-premium-state">Template status: <b>{state}</b> · This is a private preview, not a delivered email.</div>
 </article>:channel==='WhatsApp'?<div className="comm-premium-chat"><header><div className="comm-premium-chat-avatar"><MediaLogo width={42}/></div><div><strong>Landshop Business</strong><small>WhatsApp · Official green identity</small></div><IconWhatsapp/></header><div className="comm-premium-chat-body"><div className="comm-premium-bubble"><MsgText text={whatsapp}/><small>Sample verified business message · Not sent</small></div></div><footer>WhatsApp displays the profile logo when the official business account is configured.</footer></div>:
 <div className="comm-premium-sms"><header><span className="comm-premium-sms-icon"><IconEmail/></span><div><strong>LANDSHOP</strong><small>SMS sender ID preview</small></div></header><div className="comm-premium-sms-bubble"><MsgText text={sms}/></div><footer>Standard SMS cannot include an image. The registered sender identity is shown instead.</footer></div>;
}
