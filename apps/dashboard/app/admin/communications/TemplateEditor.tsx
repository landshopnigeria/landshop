'use client';
import {useEffect,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import type {PremiumOverride,Scenario} from './PremiumMessagePreview';

type Props={scenario:Scenario;override?:PremiumOverride;onSaved:(saved:PremiumOverride|null)=>void};
const allowedPhoto=/^\/media\/[a-zA-Z0-9_./-]+\.webp$/;
function supabase(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Landshop management database settings unavailable');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',secure:true,sameSite:'lax'}});
}
export default function TemplateEditor({scenario,override,onSaved}:Props){
 const [subject,setSubject]=useState(override?.subject||scenario.subject);
 const [headline,setHeadline]=useState(override?.headline||scenario.premium.headline);
 const [body,setBody]=useState(override?.body||scenario.premium.body);
 const [wa,setWa]=useState(override?.whatsapp||scenario.wa);
 const [sms,setSms]=useState(override?.sms||scenario.sms);
 const [image,setImage]=useState(override?.image_url||'');
 const [note,setNote]=useState(override?.change_note||'');
 const [state,setState]=useState(override?.state||'draft');
 const [working,setWorking]=useState(false);
 const [notice,setNotice]=useState('');
 useEffect(()=>{
  setSubject(override?.subject||scenario.subject);setHeadline(override?.headline||scenario.premium.headline);
  setBody(override?.body||scenario.premium.body);setWa(override?.whatsapp||scenario.wa);setSms(override?.sms||scenario.sms);
  setImage(override?.image_url||'');setNote(override?.change_note||'');
  setState(override?.state||'draft');setNotice('');
 },[scenario.id,override?.id,override?.edited_at,override?.state]);
 async function save(nextState?:string){
  if(working)return;
  if(subject.trim().length<3||headline.trim().length<3||body.trim().length<8){setNotice('Headline, subject and message body are required.');return}
  if(image.trim()&&!allowedPhoto.test(image.trim())){setNotice('Image must be an approved /media/*.webp Landshop archive path.');return}
  setWorking(true);setNotice('');
  try{
   const db=supabase();const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||!user)throw Error('Management sign-in has expired.');
   const row={id:scenario.id,subject:subject.trim().slice(0,300),headline:headline.trim().slice(0,180),body:body.trim().slice(0,4000),whatsapp:wa.slice(0,4000),
    sms:sms.slice(0,1500),image_url:image.trim()||null,state:nextState||state,
    change_note:note.trim().slice(0,500)||null,edited_by:user.id,edited_at:new Date().toISOString()};
   const {data,error}=await db.from('landshop_comm_templates').upsert(row,{onConflict:'id'}).select('*').single();
   if(error||!data)throw Error(error?.message||'Unable to save this template.');
   onSaved(data as PremiumOverride);setState(row.state);
   setNotice('Saved to the management database as '+row.state+'. This does not send a message.');
  }catch(e){setNotice(e instanceof Error?e.message:'Template update failed.');}finally{setWorking(false);}
 }
 async function remove(){
  if(working||!override)return;
  if(!confirm('Delete this saved override? The original reviewed template will remain in the built-in library.'))return;
  setWorking(true);
  try{
   const {error}=await supabase().from('landshop_comm_templates').delete().eq('id',scenario.id);
   if(error)throw Error(error.message);
   onSaved(null);setState('draft');setNotice('Saved override deleted. Original premium template restored.');
  }catch(e){setNotice(e instanceof Error?e.message:'Cannot delete saved override.');}finally{setWorking(false)}
 }
 return <section className="comm-premium-editor" aria-label="Management template design controls">
  <h3>Design, edit, suspend or restore this template</h3>
  <p className="comm-footnote">These settings are private to verified management. Saving an approved design never overrides consent, financial checks or the disabled delivery gateway.</p>
  <label>Email subject<input value={subject} onChange={e=>setSubject(e.target.value)} maxLength={300}/></label>
  <label>Centered teal headline<input value={headline} onChange={e=>setHeadline(e.target.value)} maxLength={180}/></label>
  <label>Short email body<textarea rows={5} value={body} onChange={e=>setBody(e.target.value)} maxLength={4000}/></label>
  <label>WhatsApp business message<textarea rows={4} value={wa} onChange={e=>setWa(e.target.value)} maxLength={4000}/></label>
  <label>SMS message<textarea rows={3} value={sms} onChange={e=>setSms(e.target.value)} maxLength={1500}/></label>
  <label>Verified property photo path (optional)<input value={image} onChange={e=>setImage(e.target.value)} placeholder="/media/famous0.webp" maxLength={400}/></label>
  <label>Management change note<input value={note} onChange={e=>setNote(e.target.value)} maxLength={500} placeholder="Reason for this edit or suspension"/></label>
  <label>Review status<select value={state} onChange={e=>setState(e.target.value)}><option value="draft">Draft</option><option value="approved">Management approved design</option><option value="suspended">Suspended</option><option value="archived">Archived</option></select></label>
  <div className="actions"><button disabled={working} onClick={()=>void save()}>Save changes</button>
   <button className="secondary" disabled={working} onClick={()=>void save('approved')}>Approve design</button>
   <button className="warning" disabled={working} onClick={()=>void save('suspended')}>Suspend</button>
   <button className="secondary" disabled={working} onClick={()=>void save('archived')}>Archive</button>
   <button className="danger" disabled={working||!override} onClick={()=>void remove()}>Delete override</button>
  </div>
  {notice&&<p role="status" className="comm-footnote">{notice}</p>}
 </section>;
}
