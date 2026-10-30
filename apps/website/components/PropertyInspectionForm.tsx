'use client';
import BrandedSelect from 'BrandedSelect';

import {useState,type FormEvent} from 'react';
import SiteIcon from './SiteIcon';
type State='idle'|'sending'|'success'|'error';
const hours=['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
export default function PropertyInspectionForm({propertyId,title}:{propertyId:string;title:string}){
 const [status,setStatus]=useState<State>('idle'),[feedback,setFeedback]=useState('');
 const [same,setSame]=useState(true);
 const [reference,setReference]=useState('');
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(status==='sending')return;
  const form=e.currentTarget,d=new FormData(form);
  const payload={property_id:propertyId,full_name:String(d.get('full_name')||''),email:String(d.get('email')||''),
   phone:String(d.get('phone')||''),whatsapp:same?String(d.get('phone')||''):String(d.get('whatsapp')||''),
   date:String(d.get('date')||''),time:String(d.get('time')||''),inspection_type:String(d.get('inspection_type')||'physical'),
   attendees:Number(d.get('attendees')||1),message:String(d.get('message')||''),consent:d.get('consent')==='yes',
   website:String(d.get('website')||'')};
  setStatus('sending');setFeedback('');
  try{const r=await fetch('/api/inspection',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify(payload),cache:'no-store'});
   const data=await r.json();if(!r.ok||!data.ok)throw Error(data.message||'Unable to request inspection');
   setReference(data.reference||'');setFeedback('Your preferred time is requested, not confirmed. Landshop must accept or reschedule your inspection.');
   setStatus('success');form.reset();
  }catch(error){setStatus('error');setFeedback(error instanceof Error?error.message:'Unable to request inspection')}
 }
 return <form onSubmit={submit} className="ld-inspection-form" aria-label="Request a property inspection">
  <div className="ld-inspection-fields">
   <label>Full name *<input required name="full_name" autoComplete="name" minLength={2} maxLength={120} placeholder="Your full name"/></label>
   <label>Email address *<input required type="email" name="email" autoComplete="email" placeholder="you@example.com"/></label>
   <label>Phone number *<input required type="tel" name="phone" autoComplete="tel" minLength={7} maxLength={30} placeholder="+234…"/></label>
   <label>WhatsApp number<label className="ld-same"><input type="checkbox" checked={same} onChange={e=>setSame(e.target.checked)}/> Same as phone</label>{!same&&<input name="whatsapp" type="tel" maxLength={30} placeholder="WhatsApp contact"/>}</label>
   <label>Property<input value={title} readOnly aria-label="Selected property"/></label>
   <label>Preferred inspection date *<input type="date" min={day} name="date" required/></label>
   <label>Preferred time (WAT) *<BrandedSelect name="time" required defaultValue=""><option value="" disabled>Choose a preferred time</option>{hours.map(h=><option key={h} value={h}>{h} WAT</option>)}</BrandedSelect></label>
   <label>Inspection type *<BrandedSelect name="inspection_type" defaultValue="physical" required><option value="physical">Physical site inspection</option><option value="virtual">Virtual inspection (subject to availability)</option></BrandedSelect></label>
   <label>Attendees (optional)<input type="number" name="attendees" min={1} max={20} defaultValue={1}/></label>
   <label className="ld-inspection-wide">Additional requests<textarea name="message" maxLength={1200} rows={3} placeholder="Access requirements, preferred estate contact or questions"/></label>
  </div>
  <div className="ld-form-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
  <label className="ld-inspection-consent"><input name="consent" value="yes" required type="checkbox"/><span>I consent to Landshop using these details solely to process and respond to this inspection request. *</span></label>
  <button className="ld-book-button" type="submit" disabled={status==='sending'}><SiteIcon name="calendar" size={21}/>{status==='sending'?'Recording request…':'Request Property Inspection'}<SiteIcon name="arrow" size={20}/></button>
  {feedback&&<p role={status==='error'?'alert':'status'} className={'ld-form-feedback '+status}>{reference&&status==='success'?<strong>Reference: {reference}. </strong>:null}{feedback}</p>}
  <p className="ld-disclaimer">Preferred dates are not confirmed appointments. A Landshop team member must approve or reschedule the visit.</p>
 </form>
}
