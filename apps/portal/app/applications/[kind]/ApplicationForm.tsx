'use client';
import {useState} from 'react';
import Link from 'next/link';
import {browserSupabase} from '../../../lib/supabase-browser';
import {formDefinitions, type Field} from '../../../lib/landshop-forms';
type Value=Record<string,string>;
export default function ApplicationForm({slug}:{slug:string}){
 const definition=formDefinitions[slug];
 const [step,setStep]=useState(0),[answers,setAnswers]=useState<Value>({}),[draftId,setDraftId]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[files,setFiles]=useState<Record<string,File>>({});
 if(!definition)return <main style={{padding:40}}>Unknown Landshop application. <Link href="/">Back to portal</Link></main>;
 const fields=definition.steps[step].fields;const set=(key:string,val:string)=>setAnswers(previous=>({...previous,[key]:val}));
 async function ensureDraft(){
  const db=browserSupabase();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)throw Error('Sign in to your secure Landshop account before saving.');
  if(draftId)return {db,user,id:draftId};
  const {data,error}=await db.from('applications').insert({applicant_id:user.id,kind:definition.kind,status:'draft',answers}).select('id').single();
  if(error||!data)throw Error('Unable to create secure application draft. Check database permissions.');
  setDraftId(data.id);
  return {db,user,id:data.id as string};
 }
 async function save(){
  setBusy(true);setMessage('');
  try{
   const {db,user,id}=await ensureDraft();
   const {error}=await db.from('applications').update({answers}).eq('id',id).eq('applicant_id',user.id).eq('status','draft');
   if(error)throw Error('Could not save application draft.');
   for(const [kind,file] of Object.entries(files)){
    if(file.size>10485760||file.size<=0)throw Error(kind+' must be under 10 MiB');
    if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type))throw Error('Unsupported document format');
    const extension=file.type==='application/pdf'?'pdf':file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const path=user.id+'/'+id+'/'+kind+'-'+crypto.randomUUID()+'.'+extension;
    const {error:uploadError}=await db.storage.from('landshop-applications').upload(path,file,{upsert:false,contentType:file.type});
    if(uploadError)throw Error('Document upload failed. Your draft was saved; try again.');
    const {error:recordError}=await db.from('application_documents').insert({application_id:id,applicant_id:user.id,document_type:kind,object_path:path});
    if(recordError)throw Error('Document registry update failed. Please contact support.');
   }
   setFiles({});setMessage('Draft saved privately. Application reference: '+id);
   return id;
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to save draft');return null}
  finally{setBusy(false)}
 }
 function validateFields(){
  for(const f of fields){if(f.required&&!answers[f.key]){setMessage('Complete '+f.label+' before continuing.');return false}}
  setMessage('');return true;
 }
 async function submit(){
  setBusy(true);setMessage('');
  try{
   if(!answers.declaration_accepted||!answers.applicant_signature)throw Error('Complete and accept the declaration first.');
   const id=await save();if(!id)return;
   const {data,error}=await browserSupabase().rpc('landshop_submit_application',{p_id:id});
   if(error||!data)throw Error('Submission requires complete personal, product and declaration details.');
   setMessage('Application submitted. Reference: '+id+'. You will receive a notification when configured.');
  }catch(e){setMessage(e instanceof Error?e.message:'Submission failed')}
  finally{setBusy(false)}
 }
 function input(field:Field){
  const val=answers[field.key]||'';
  const label=<label htmlFor={field.key}>{field.label}{field.required?' *':''}</label>;
  const common={id:field.key,'aria-label':field.label};
  return <div key={field.key} className="app-field">{label}
   {field.type==='file'?<input {...common} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>{const f=e.target.files?.[0];if(f)setFiles(prev=>({...prev,[field.key]:f}))}}/>:
    field.type==='select'?<select {...common} value={val} onChange={e=>set(field.key,e.target.value)}><option value="">Select {field.label.toLowerCase()}</option>{field.choices?.map(option=><option key={option}>{option}</option>)}</select>:
    field.type==='textarea'?<textarea {...common} value={val} rows={3} onChange={e=>set(field.key,e.target.value)} placeholder={'Enter '+field.label.toLowerCase()}/>:
    field.type==='checkbox'?<label className="check"><input type="checkbox" checked={val==='true'} onChange={e=>set(field.key,String(e.target.checked))}/> I confirm</label>:
    <input {...common} type={field.type||'text'} value={val} onChange={e=>set(field.key,e.target.value)}
       min={field.type==='number'?0:undefined} required={field.required} placeholder={field.placeholder||'Enter '+field.label.toLowerCase()}/>}
  </div>;
 }
 return <main className="application-scene"><div className="application-wrap"><div className="application-sheet">
   <div className="application-head">
    <div className="application-logos"><strong className="landshop-wordmark">Landshop</strong><span className="separator"/> <strong className="product-mark">{definition.brand}</strong></div>
    <h1>{definition.title}</h1><p>All required (*) information must be completed. Product-specific terms are subject to verified offers.</p>
   </div>
   <div className="application-body">
    <div className="progress-title"><strong>Step {step+1} of {definition.steps.length}</strong><span>{definition.steps[step].name}</span></div>
    <div className="step-progress">{definition.steps.map((s,i)=><button key={s.name} aria-label={'Open '+s.name} disabled={i>step} className={i===step?'current':''} onClick={()=>setStep(i)}><span>{i+1}</span><small>{s.name}</small></button>)}</div>
    {fields.length?<div className="application-grid">{fields.map(input)}</div>:
     <section className="application-review"><h2>Review your application</h2><p>Check the details below before submission. Government ID and financial evidence remain private and accessible only to authorized reviewers.</p>
       <dl>{Object.entries(answers).filter(([k])=>!k.endsWith('_accepted')).map(([k,v])=><div key={k}><dt>{k.replaceAll('_',' ')}</dt><dd>{v}</dd></div>)}</dl>
       <p>Only submit once the declaration and required documents are complete.</p>
     </section>}
    <div className="application-actions"><button type="button" className="secondary" disabled={step===0||busy} onClick={()=>{setStep(x=>x-1);setMessage('')}}>← Previous</button>
     <button type="button" className="secondary" disabled={busy} onClick={save}>{busy?'Saving…':'Save Draft'}</button>
     {step<definition.steps.length-1?<button type="button" className="action" onClick={()=>{if(validateFields())setStep(x=>x+1)}}>Next Step →</button>
       :<button type="button" className="action" disabled={busy} onClick={submit}>Submit Secure Application →</button>}
    </div><p role="status" aria-live="polite" className="app-message">{message}</p>
   </div>
  </div><aside className="application-sidebar"><h2>Application guidance</h2><p><strong>{definition.brand}</strong> · {definition.title}</p><p>Use Save Draft to keep your answers securely in Landshop. Verification and approval are completed by authorized Landshop staff.</p><Link href="/">Return to customer portal</Link><a href="mailto:care@landshopnigeria.com">Need help? Contact support</a><p className="disclaimer">Mortgage estimates are not offers or approvals. Never pay into unverified accounts.</p></aside>
  </div></main>;
}
