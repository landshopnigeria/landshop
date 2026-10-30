'use client';
import BrandedSelect from '../../components/BrandedSelect';

import {useEffect,useState,type FormEvent} from 'react';
const TOPICS=['Develop','Incubate','Grow','Property Acquisition','Property Inspection','Mortgage Guidance','Customer Support','Property Updates','Other'] as const;
type Status='idle'|'sending'|'success'|'error';
export default function ContactForm(){
 const [status,setStatus]=useState<Status>('idle');
 const [feedback,setFeedback]=useState('');
 const [topic,setTopic]=useState('');
 useEffect(()=>{const param=new URLSearchParams(window.location.search).get('topic');if(param&&(TOPICS as readonly string[]).includes(param))setTopic(param)},[]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(status==='sending')return;
  const form=event.currentTarget;
  const data=new FormData(form);
  const payload={
   full_name:String(data.get('full_name')||'').trim(),
   email:String(data.get('email')||'').trim(),
   phone:String(data.get('phone')||'').trim(),
   topic:String(data.get('topic')||''),
   message:String(data.get('message')||'').trim(),
   consent:data.get('consent')==='yes',
   website:String(data.get('website')||'')
  };
  setStatus('sending');setFeedback('');
  try{
   const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
   const result=await response.json();
   if(!response.ok||!result.ok)throw new Error(typeof result.message==='string'?result.message:'We could not send your enquiry. Please try again.');
   setStatus('success');setFeedback('Your enquiry is saved. Reference: '+(result.reference||'not assigned')+'. The responsible Landshop team can review the request. Acknowledgement email delivery is not guaranteed until its notification is dispatched.');
   form.reset();setTopic('');
  }catch(error){setStatus('error');setFeedback(error instanceof Error?error.message:'We could not send your enquiry. Please try again.');}
 }
 return <form className="contact-enquiry-form" onSubmit={submit} aria-label="Contact Landshop enquiry form">
  <div className="contact-enquiry-fields">
   <label>Full name <span aria-hidden="true">*</span><input name="full_name" type="text" autoComplete="name" minLength={2} maxLength={120} required placeholder="Your full name"/></label>
   <label>Email address <span aria-hidden="true">*</span><input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com"/></label>
   <label>Phone (optional)<input name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="+234…"/></label>
   <label>Enquiry type <span aria-hidden="true">*</span><BrandedSelect name="topic" required value={topic} onChange={e=>setTopic(e.target.value)}><option value="" disabled>Select a topic</option>{TOPICS.map(topic=><option key={topic} value={topic}>{topic}</option>)}</BrandedSelect></label>
   <label className="contact-wide">How can we help? <span aria-hidden="true">*</span><textarea name="message" rows={6} minLength={20} maxLength={3000} required placeholder="Share the property, product, location, or question. Please do not include sensitive documents."/></label>
   <div className="contact-hidden-field" aria-hidden="true"><label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off"/></label></div>
  </div>
  <label className="contact-enquiry-consent"><input type="checkbox" name="consent" value="yes" required/><span>I agree to Landshop using the details I provide to respond to this enquiry.</span></label>
  <div className="contact-enquiry-actions"><button className="content-cta" disabled={status==='sending'} type="submit">{status==='sending'?'Sending enquiry…':'Send Enquiry ↗'}</button></div>
  {feedback&&<p role={status==='error'?'alert':'status'} className={'contact-enquiry-feedback '+status}>{feedback}</p>}
 </form>;
}
