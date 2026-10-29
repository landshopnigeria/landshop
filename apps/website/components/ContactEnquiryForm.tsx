
'use client';
import {useState,type FormEvent} from 'react';
const topics=['Property Acquisition','Mortgage Guidance','Property Inspection','Develop','Incubate','Grow','Customer Support','Other'];
export default function ContactEnquiryForm(){
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[success,setSuccess]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  const form=event.currentTarget,values=new FormData(form);
  setBusy(true);setSuccess(false);setNotice('');
  try{
   const body=Object.fromEntries(['full_name','email','phone','topic','message','consent','website'].map(k=>[k,String(values.get(k)||'')]));
   const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const data=await response.json() as {message?:string};
   if(!response.ok)throw Error(data.message||'Your enquiry could not be recorded.');
   setSuccess(true);setNotice(data.message||'Your enquiry has been received.');
   form.reset();
  }catch(e){setNotice(e instanceof Error?e.message:'Unable to submit. Try again or contact us directly.')}
  finally{setBusy(false)}
 }
 return <div className="v16-enquiry"><span className="v16-overline">START A CONVERSATION</span><h2 style={{fontWeight:550,fontSize:30,margin:'11px 0'}}>Send us a message.</h2><p>Share your enquiry securely. Never include passwords, OTPs, bank details or identity documents in this form.</p>
  <form onSubmit={submit}>
   <div className="v16-enquiry-row"><label>Full name *<input name="full_name" autoComplete="name" minLength={2} maxLength={120} required placeholder="Your full name"/></label><label>Email *<input type="email" name="email" autoComplete="email" required maxLength={254} placeholder="you@example.com"/></label></div>
   <div className="v16-enquiry-row"><label>Phone / WhatsApp<input name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="+234 …"/></label><label>Enquiry type *<select name="topic" required defaultValue=""><option value="" disabled>Choose a topic</option>{topics.map(t=><option key={t}>{t}</option>)}</select></label></div>
   <label>How can Landshop help? *<textarea name="message" minLength={20} maxLength={3000} required placeholder="Tell us which property, product or service you are enquiring about…"/></label>
   <label className="v16-sr" aria-hidden="true">Leave blank<input tabIndex={-1} autoComplete="off" name="website"/></label>
   <label style={{display:'flex',alignItems:'flex-start',gap:9,fontWeight:450}}><input type="checkbox" name="consent" value="yes" required style={{width:16,marginTop:4}}/><span>I agree that Landshop may use my details to respond to this specific enquiry. This does not subscribe me to marketing.</span></label>
   <button disabled={busy} type="submit">{busy?'Submitting securely…':'Send Enquiry ↗'}</button>
   {notice&&<p className="v16-enquiry-status" role={success?'status':'alert'} aria-live="polite">{notice}</p>}
  </form>
 </div>;
}
