'use client';
import ApprovedArrow from './ApprovedArrow';

import {useState,type FormEvent} from 'react';
const propertyUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default function VisitEnquiryForm({home,project,propertyId}:{home?:string,project?:string,propertyId?:string}){
 const linkedProperty=Boolean(propertyId&&propertyUuid.test(propertyId));
 const [status,setStatus]=useState<'idle'|'sending'|'saved'|'error'>('idle');const [message,setMessage]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(status==='sending')return;const form=e.currentTarget,d=new FormData(form);
 const request={full_name:String(d.get('full_name')||''),email:String(d.get('email')||''),phone:String(d.get('phone')||''),topic:'Property Inspection',message:'Viewing enquiry: '+(project||'Famous Gardens')+'. Home: '+(home||'To be confirmed')+'. Mode: '+String(d.get('mode')||'physical')+'. Preferred date: '+String(d.get('date')||'')+'. Preferred time: '+String(d.get('time')||'')+'. Notes: '+String(d.get('notes')||'No other notes.'),consent:d.get('consent')==='yes',website:String(d.get('website')||'')};
 setStatus('sending');setMessage('');
 try{
  const payload=linkedProperty?{
   property_id:propertyId,full_name:request.full_name,email:request.email,phone:request.phone,
   whatsapp:request.phone,date:String(d.get('date')||''),time:String(d.get('time')||''),
   inspection_type:String(d.get('mode')||'physical'),attendees:1,
   message:String(d.get('notes')||'').slice(0,700),consent:request.consent,website:request.website
  }:request;
  const response=await fetch(linkedProperty?'/api/inspection':'/api/contact',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'
  });
  const result=await response.json();
  if(!response.ok||!result.ok)throw Error(result.message||'Unable to record your request');
  setStatus('saved');
  setMessage((linkedProperty?'Your property inspection request':'Your tour enquiry')+
   ' has been recorded. Reference: '+(result.reference||'pending')+
   '. The date and time are requested, not confirmed.');
  form.reset();
 }catch(error){setStatus('error');setMessage(error instanceof Error?error.message:'Please try again or email care@landshopnigeria.com.');}
}
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'});return <form className="ls26-visit-form ls26-loan" onSubmit={submit}><span className="ls26-eyebrow">REQUEST A VISIT</span><h2>Choose a convenient time.</h2><p>Request an inspection or live virtual tour. We will confirm availability and access details before you travel or join online.</p>
 <label>Full name *<input name="full_name" minLength={2} maxLength={120} required placeholder="Your name"/></label><label>Email *<input name="email" type="email" required placeholder="you@example.com"/></label><label>Phone {linkedProperty?"*":"(optional)"}<input name="phone" type="tel" required={linkedProperty} minLength={linkedProperty?7:undefined} maxLength={30} placeholder="+234…"/></label>
 <label>Tour type *<select name="mode" required><option value="physical">Physical inspection</option><option value="virtual">Live virtual tour</option></select></label><label>Preferred date *<input type="date" name="date" min={today} required/></label><label>Preferred time (WAT) *{linkedProperty?
 <select name="time" required>{['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].map(hour=><option key={hour} value={hour}>{hour}</option>)}</select>:
 <input type="time" name="time" min="08:00" max="17:00" required/>}</label><label>Notes (optional)<textarea name="notes" rows={3} maxLength={700} placeholder="Tell us what you want to see"/></label>
 <label><input type="checkbox" name="consent" value="yes" required/> I agree that Landshop may use these details to respond to my viewing request.</label><input type="text" name="website" tabIndex={-1} style={{display:'none'}} autoComplete="off" aria-hidden="true"/><button type="submit" className="ls26-button" disabled={status==='sending'}>{status==='sending'?'Saving request…':'Request my viewing'} <ApprovedArrow /></button>
 {message&&<p role={status==='error'?'alert':'status'} className="ls26-note">{message}</p>}<p className="ls26-note">This form does not reserve property or confirm an appointment.</p></form>}
