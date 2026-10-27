'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {browserSupabase} from '../../../lib/supabase-browser';
import {formDefinitions, type Field} from '../../../lib/landshop-forms';
type Value=Record<string,string>;
export default function ApplicationForm({slug}:{slug:string}){
 const definition=formDefinitions[slug];
 const [step,setStep]=useState(0),[answers,setAnswers]=useState<Value>({}),[draftId,setDraftId]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[files,setFiles]=useState<Record<string,File>>({});
 const [loading,setLoading]=useState(true),[submitted,setSubmitted]=useState(false),[savedDocuments,setSavedDocuments]=useState<string[]>([]),[autosaveStatus,setAutosaveStatus]=useState('');
 const lastSaved=useRef(''),autoSaving=useRef(false),submissionInFlight=useRef(false);
 // Restore only the authenticated user's own matching unsubmitted subscription, never another form.
 useEffect(()=>{
  let active=true;
  (async()=>{
   if(!definition){setLoading(false);return}
   try{
    const db=browserSupabase();
    const {data:{user}}=await db.auth.getUser();
    if(!user)return;
    const {data,error}=await db.from('applications').select('id,answers').eq('applicant_id',user.id).eq('kind',definition.kind)
      .eq('status','draft').order('created_at',{ascending:false}).limit(20);
    if(error)throw error;
    const existing=data?.find(record=>record.answers?.form_slug===slug ||
     (!record.answers?.form_slug && definition.kind!=='inspection'));
    if(existing&&active){
     const restored=existing.answers as Value;
     setDraftId(existing.id);setAnswers(restored);lastSaved.current=JSON.stringify(restored);
     const docs=await db.from('application_documents').select('document_type').eq('application_id',existing.id);
     if(active)setSavedDocuments((docs.data||[]).map(row=>row.document_type));
     setAutosaveStatus('Your saved application has been restored.');
    }
   }catch{if(active)setAutosaveStatus('Saved drafts could not be retrieved. Please sign in or check your connection.')}
   finally{if(active)setLoading(false)}
  })();
  return()=>{active=false};
 },[slug]);
 // Autosave answer edits after the first explicit save. Files remain private and upload on Save Draft.
 useEffect(()=>{
  if(loading||!draftId||busy||submitted||autoSaving.current||!Object.keys(answers).length)return;
  const snapshot=JSON.stringify(answers);
  if(snapshot===lastSaved.current)return;
  setAutosaveStatus('Unsaved changes');
  const timer=setTimeout(async()=>{
   if(autoSaving.current)return;
   autoSaving.current=true;
   try{
    const db=browserSupabase();
    const {data:{user}}=await db.auth.getUser();
    if(!user)throw Error('Authentication required');
    const {data:saved,error}=await db.from('applications').update({answers:{...answers,form_slug:slug}})
      .eq('id',draftId).eq('applicant_id',user.id).eq('status','draft').select('id').maybeSingle();
    if(error||!saved)throw error||Error('Application is no longer editable');
    lastSaved.current=JSON.stringify({...answers,form_slug:slug});
    setAutosaveStatus('Changes saved securely');
   }catch{setAutosaveStatus('Autosave failed. Select Save Draft to retry.')}
   finally{autoSaving.current=false}
  },1200);
  return()=>clearTimeout(timer);
 },[answers,draftId,loading,busy,slug,submitted]);
 if(!definition)return <main style={{padding:40}}>Unknown Landshop application. <Link href="/">Back to portal</Link></main>;
 const fields=definition.steps[step].fields;const set=(key:string,val:string)=>setAnswers(previous=>({...previous,[key]:val}));
 async function ensureDraft(){
  const db=browserSupabase();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)throw Error('Sign in to your secure Landshop account before saving.');
  if(draftId)return {db,user,id:draftId};
  const {data,error}=await db.from('applications').insert({applicant_id:user.id,kind:definition.kind,status:'draft',answers:{...answers,form_slug:slug}}).select('id').single();
  if(error||!data)throw Error('Unable to create secure application draft. Check database permissions.');
  setDraftId(data.id);
  return {db,user,id:data.id as string};
 }
 async function save(){
  if(submitted){setMessage('This application has already been submitted.');return null;}
  setBusy(true);setMessage('');
  try{
   const {db,user,id}=await ensureDraft();
   const {data:saved,error}=await db.from('applications').update({answers:{...answers,form_slug:slug}}).eq('id',id).eq('applicant_id',user.id).eq('status','draft').select('id').maybeSingle();
   if(error||!saved)throw Error('Could not save application draft. This application may already be submitted.');
   lastSaved.current=JSON.stringify({...answers,form_slug:slug});
   for(const [kind,file] of Object.entries(files)){
    if(file.size>10485760||file.size<=0)throw Error(kind+' must be under 10 MiB');
    if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type))throw Error('Unsupported document format');
    const extension=file.type==='application/pdf'?'pdf':file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const path=user.id+'/'+id+'/'+kind+'-'+crypto.randomUUID()+'.'+extension;
    const {error:uploadError}=await db.storage.from('landshop-applications').upload(path,file,{upsert:false,contentType:file.type});
    if(uploadError)throw Error('Document upload failed. Your draft was saved; try again.');
    const {error:recordError}=await db.from('application_documents').insert({application_id:id,applicant_id:user.id,document_type:kind,object_path:path});
    if(recordError)throw Error('Document registry update failed. Please contact support.');
    setSavedDocuments(previous=>Array.from(new Set([...previous,kind])));
   }
   setFiles({});setAutosaveStatus('Changes saved securely');setMessage('Draft saved privately. Application reference: '+id);
   return id;
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to save draft');return null}
  finally{if(!submissionInFlight.current)setBusy(false)}
 }
 function validateFields(stageFields:Field[]=fields){
  for(const f of stageFields){
   if(!f.required)continue;
   const present=f.type==='file'?Boolean(files[f.key]||savedDocuments.includes(f.key)):
    Boolean(answers[f.key]?.trim())&&answers[f.key]!=='false';
   if(!present){setMessage('Complete '+f.label+' before continuing.');return false}
  }
  setMessage('');return true;
 }
 async function submit(){
  if(submitted||submissionInFlight.current)return;
  submissionInFlight.current=true;
  setBusy(true);setMessage('');
  try{
   if(!answers.declaration_accepted||!answers.applicant_signature)throw Error('Complete and accept the declaration first.');
   for(let i=0;i<definition.steps.length;i++){
    if(!validateFields(definition.steps[i].fields)){setStep(i);throw Error('Complete all required fields in '+definition.steps[i].name+'.');}
   }
   const id=await save();if(!id)return;
   const {data,error}=await browserSupabase().rpc('landshop_submit_application',{p_id:id});
   if(error||!data)throw Error('Submission requires complete personal, product and declaration details.');
   setSubmitted(true);setAutosaveStatus('Submission recorded securely');
   setMessage('Application submitted successfully. Reference: '+id+'. Follow progress through My Applications.');
  }catch(e){setMessage(e instanceof Error?e.message:'Submission failed')}
  finally{submissionInFlight.current=false;setBusy(false)}
 }
 function input(field:Field){
  const val=answers[field.key]||'';
  const label=<label htmlFor={field.key}>{field.label}{field.required?' *':''}</label>;
  const common={id:field.key,'aria-label':field.label};
  return <div key={field.key} className="app-field">{label}
   {field.type==='file'?<><input {...common} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>{const f=e.target.files?.[0];if(f)setFiles(prev=>({...prev,[field.key]:f}))}}/>{savedDocuments.includes(field.key)&&<small style={{color:'#07805e'}}>Previously uploaded securely ✓</small>}</>:
    field.type==='select'?<select {...common} value={val} required={field.required} onChange={e=>set(field.key,e.target.value)}><option value="">Select {field.label.toLowerCase()}</option>{field.choices?.map(option=><option key={option}>{option}</option>)}</select>:
    field.type==='textarea'?<textarea {...common} value={val} rows={3} required={field.required} onChange={e=>set(field.key,e.target.value)} placeholder={field.placeholder||'Enter '+field.label.toLowerCase()}/>:
    field.type==='checkbox'?<label className="check"><input type="checkbox" checked={val==='true'} required={field.required} onChange={e=>set(field.key,String(e.target.checked))}/> {field.label}</label>:
    <input {...common} type={field.type||'text'} value={val} onChange={e=>set(field.key,e.target.value)}
       min={field.type==='number'?0:undefined} required={field.required} placeholder={field.placeholder||'Enter '+field.label.toLowerCase()}/>}
  </div>;
 }
 return <main className="application-scene"><div className="application-wrap"><div className="application-sheet">
   <div className="application-head">
    <div className="application-logos"><img src={'/media/brand-'+slug+'.webp'} alt={'Official Landshop and '+definition.brand+' product logo'} style={{maxWidth:'100%',maxHeight:88,objectFit:'contain'}}/></div>
    <h1>{definition.title}</h1><p>All required (*) information must be completed. Product-specific terms are subject to verified offers.</p>
   </div>
   <div className="application-body">
    {loading?<p role="status">Checking for an existing saved application…</p>:null}
    <div className="progress-title"><strong>Step {step+1} of {definition.steps.length}</strong><span>{definition.steps[step].name}</span></div>
    <div className="step-progress">{definition.steps.map((s,i)=><button key={s.name} aria-label={'Open '+s.name} disabled={i>step} className={i===step?'current':''} onClick={()=>setStep(i)}><span>{i+1}</span><small>{s.name}</small></button>)}</div>
    {fields.length?<div className="application-grid">{fields.map(input)}</div>:
     <section className="application-review"><h2>Review your application</h2><p>Check the details below before submission. Government ID and financial evidence remain private and accessible only to authorized reviewers.</p>
       <dl>{Object.entries(answers).filter(([k])=>!k.endsWith('_accepted')&&k!=='form_slug').map(([k,v])=><div key={k}><dt>{k.replaceAll('_',' ')}</dt><dd>{v}</dd></div>)}</dl>
       <p>Only submit once the declaration and required documents are complete.</p>
     </section>}
    <div className="application-actions"><button type="button" className="secondary" disabled={step===0||busy||loading||submitted} onClick={()=>{setStep(x=>x-1);setMessage('')}}>← Previous</button>
     <button type="button" className="secondary" disabled={busy||loading||submitted} onClick={save}>{busy?'Saving…':'Save Draft'}</button>
     {step<definition.steps.length-1?<button type="button" className="action" disabled={busy||loading||submitted} onClick={()=>{if(validateFields())setStep(x=>x+1)}}>Next Step →</button>
       :<button type="button" className="action" disabled={busy||loading||submitted} onClick={submit}>Submit Secure Application →</button>}
    </div><p role="status" aria-live="polite" className="app-message">{message}</p><p role="status" className="app-message">{autosaveStatus}</p>{submitted&&<p><a href="https://app.landshopnigeria.com/dashboard/applications">View My Applications →</a></p>}
   </div>
  </div><aside className="application-sidebar"><h2>Application guidance</h2><p><strong>{definition.brand}</strong> · {definition.title}</p><p>Use Save Draft once to start a secure application; subsequent answer edits are autosaved. Return later to resume. Verification and approval are completed by authorized Landshop staff.</p><Link href="/">Return to customer portal</Link><a href="mailto:care@landshopnigeria.com">Need help? Contact support</a><p className="disclaimer">Mortgage estimates are not offers or approvals. Never pay into unverified accounts.</p></aside>
  </div></main>;
}
