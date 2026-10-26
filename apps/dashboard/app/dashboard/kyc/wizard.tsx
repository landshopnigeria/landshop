'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';

type Kind='individual'|'company'|'realtor'|'employee';
type Existing={id:string;kind:string;status:string;metadata:unknown;created_at:string};
type DocType='portrait'|'government_id'|'utility_bill'|'cac_certificate'|'bank_evidence';
const docTypes: {key:DocType;label:string;required:(kind:Kind)=>boolean}[]=[
 {key:'portrait',label:'Passport photograph / selfie',required:()=>true},
 {key:'government_id',label:'Government-issued identity document',required:()=>true},
 {key:'utility_bill',label:'Recent utility bill / proof of address',required:()=>true},
 {key:'cac_certificate',label:'CAC incorporation certificate',required:k=>k==='company'},
 {key:'bank_evidence',label:'Bank account evidence (redact sensitive numbers)',required:()=>false}
];
function supabase(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Landshop identity service is not configured');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
}
const inputStyle={width:'100%',padding:13,border:'1px solid #bfd7cd',borderRadius:12,background:'#fff'};
export default function KycWizard({userId,existing}:{userId:string;existing:Existing|null}){
 const current=existing?.metadata&&typeof existing.metadata==='object' ? existing.metadata as Record<string,unknown> : {};
 const [step,setStep]=useState(0);
 const [kind,setKind]=useState<Kind>(existing?.kind as Kind||'individual');
 const [name,setName]=useState(String(current.fullName||''));
 const [phone,setPhone]=useState(String(current.phone||''));
 const [address,setAddress]=useState(String(current.address||''));
 const [state,setState]=useState(String(current.state||''));
 const [city,setCity]=useState(String(current.city||''));
 const [company,setCompany]=useState(String(current.companyName||''));
 const [rc,setRc]=useState(String(current.rcNumber||''));
 const [consent,setConsent]=useState(false);
 const [docs,setDocs]=useState<Partial<Record<DocType,File>>>({});
 const [status,setStatus]=useState(existing?.status||'draft');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const pending=status!=='draft';
 const update=(key:DocType,file:File|undefined)=>{
  setDocs(previous=>({...previous,[key]:file}));
 };
 async function save(){
  setBusy(true);setMessage('');
  const db=supabase();
  const metadata={fullName:name.trim(),phone:phone.trim(),address:address.trim(),state:state.trim(),city:city.trim(),companyName:company.trim(),rcNumber:rc.trim()};
  try{
   const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||user?.id!==userId)throw Error('Your session has expired. Sign in again.');
   if(!name.trim()||!phone.trim()||!address.trim()||!state.trim()||!city.trim())
    throw Error('Complete all personal and residential-address fields.');
   if(kind==='company'&&(!company.trim()||!rc.trim()))
    throw Error('Company name and CAC registration number are required.');
   let submissionId=existing?.id;
   if(!submissionId){
    const {data,error}=await db.from('kyc_submissions').insert({
     applicant_id:userId,kind,metadata
    }).select('id').single();
    if(error||!data)throw Error('Unable to create KYC draft. Your database may not be configured.');
    submissionId=data.id;
   }else{
    const {error}=await db.from('kyc_submissions').update({metadata}).eq('id',submissionId).eq('applicant_id',userId).eq('status','draft');
    if(error)throw Error('Unable to update your KYC draft.');
   }
   const required=docTypes.filter(item=>item.required(kind));
   const {data:existingDocs,error:readError}=await db.from('kyc_documents').select('document_type').eq('submission_id',submissionId);
   if(readError)throw Error('Unable to verify existing document records.');
   const done=new Set((existingDocs||[]).map(x=>x.document_type));
   for(const item of docTypes){
    const file=docs[item.key];
    if(!file)continue;
    if(done.has(item.key))throw Error('A '+item.label+' was already uploaded. Contact support to replace it.');
    if(file.size>10*1024*1024)throw Error(item.label+' exceeds the 10MB limit.');
    if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type))throw Error(item.label+' must be JPG, PNG, WebP or PDF.');
    const extension=file.type==='application/pdf'?'pdf':file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const path=userId+'/'+submissionId+'/'+item.key+'-'+crypto.randomUUID()+'.'+extension;
    const upload=await db.storage.from('landshop-kyc').upload(path,file,{upsert:false,contentType:file.type});
    if(upload.error)throw Error('Document upload failed: '+item.label);
    const record=await db.from('kyc_documents').insert({
      submission_id:submissionId,applicant_id:userId,document_type:item.key,object_path:path
    });
    if(record.error)throw Error('Document metadata could not be saved. Contact support before retrying.');
    done.add(item.key);
   }
   const missing=required.filter(item=>!done.has(item.key)).map(item=>item.label);
   if(missing.length)throw Error('Saved draft. Required uploads remaining: '+missing.join(', '));
   if(!consent)throw Error('Saved draft. Please consent to KYC verification before submitting.');
   const {error:submitError}=await db.from('kyc_submissions')
    .update({status:'submitted'}).eq('id',submissionId).eq('applicant_id',userId).eq('status','draft');
   if(submitError)throw Error('Draft saved, but submission failed. Please contact support.');
   setStatus('submitted');setMessage('KYC submitted for review. No approval or identity verification is implied.');
  }catch(e){setMessage(e instanceof Error?e.message:'KYC submission was unsuccessful.')}
  finally{setBusy(false)}
 }
 if(pending)return <main style={{padding:'8vw',fontFamily:'Arial,sans-serif',background:'#eef8f2',minHeight:'100vh'}}>
  <a href="/dashboard">← Dashboard</a><h1>Landshop KYC</h1>
  <p>Your latest KYC status: <strong>{status}</strong>.</p>
  <p>Restricted financial and realtor services remain unavailable until approval.</p>
  <a href="mailto:support@landshopnigeria.com">Contact Support</a>
 </main>;
 return <main style={{padding:'clamp(16px,5vw,65px)',background:'#edf7f2',minHeight:'100vh',fontFamily:'Arial,sans-serif',color:'#074637'}}>
  <a href="/dashboard">← Back to Dashboard</a>
  <section style={{maxWidth:840,margin:'35px auto',padding:'clamp(24px,4vw,44px)',borderRadius:26,boxShadow:'0 25px 70px #064a301c',background:'#ffffffef',border:'1px solid #d0e5d8'}}>
   <small style={{color:'#16806a',letterSpacing:2}}>LANDSHOP · IDENTITY VERIFICATION</small><h1>Complete your KYC</h1>
   <p>Step {step+1} of 4: {['Account type','Personal details','Secure documents','Review & submit'][step]}</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,margin:'22px 0 32px'}}>
    {[0,1,2,3].map(n=><div key={n} style={{height:6,borderRadius:4,background:n<=step?'#00896c':'#e4ede8'}}/>)}
   </div>
   {step===0&&<label style={{display:'grid',gap:9}}>Which account are you verifying?
    <select value={kind} onChange={e=>setKind(e.target.value as Kind)} style={inputStyle}>
     <option value="individual">Individual customer</option><option value="realtor">Realtor</option>
     <option value="company">Registered company or cooperative</option><option value="employee">Landshop staff</option>
    </select>
    <p>Choosing staff or company does not grant administrative privileges or organization membership.</p>
   </label>}
   {step===1&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(225px,1fr))',gap:15}}>
    {([
      ['Full legal name',name,setName],['Phone / WhatsApp',phone,setPhone],
      ['Residential address',address,setAddress],['State',state,setState],
      ['City / Town',city,setCity]
    ] as const).map(([label,value,fn])=><label key={label} style={{display:'grid',gap:7}}>{label}<input required value={value} onChange={e=>fn(e.target.value)} style={inputStyle} placeholder={'Enter '+label.toLowerCase()}/></label>)}
    {kind==='company'&&<><label style={{display:'grid',gap:7}}>Company name<input value={company} onChange={e=>setCompany(e.target.value)} style={inputStyle}/></label><label style={{display:'grid',gap:7}}>CAC registration number<input value={rc} onChange={e=>setRc(e.target.value)} style={inputStyle}/></label></>}
   </div>}
   {step===2&&<div style={{display:'grid',gap:15}}>
    {docTypes.filter(d=>d.required(kind)||d.key==='bank_evidence').map(doc=><label key={doc.key} style={{display:'grid',gap:7}}>
      {doc.label} {doc.required(kind)?'*':'(optional)'}
      <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e=>update(doc.key,e.target.files?.[0])} style={inputStyle}/>
     </label>)}
    <p style={{fontSize:13}}>Uploads are held in a private bucket; maximum 10MB per file. Do not upload bank PINs, passwords or full card numbers.</p>
   </div>}
   {step===3&&<div style={{display:'grid',gap:15}}>
    <p><strong>Account type:</strong> {kind}</p><p><strong>Legal name:</strong> {name||'Not provided'}</p>
    <p><strong>Location:</strong> {city}, {state}</p>
    <p><strong>Documents selected:</strong> {Object.values(docs).filter(Boolean).length}. Existing documents may also be present in an earlier draft.</p>
    <label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I consent to Landshop processing my submitted identity documents for the stated verification purpose and acknowledge the privacy notice.</label>
    <p>Submitting KYC does not automatically activate investment or financial transactions. Review is required.</p>
   </div>}
   <p aria-live="polite" role="status" style={{color:'#a3491a'}}>{message}</p>
   <div style={{display:'flex',justifyContent:'space-between',gap:13,marginTop:25}}>
    <button type="button" disabled={step===0||busy} onClick={()=>setStep(s=>Math.max(0,s-1))} style={{padding:'14px 27px',borderRadius:12,background:'#fff',border:'1px solid #d1e3d6'}}>Back</button>
    {step<3?<button type="button" onClick={()=>setStep(s=>Math.min(3,s+1))} style={{padding:'14px 27px',borderRadius:12,background:'#078c70',color:'#fff',border:0}}>Continue</button>:
    <button type="button" disabled={busy||!consent} onClick={save} style={{padding:'14px 27px',borderRadius:12,background:'#078c70',color:'#fff',border:0}}>{busy?'Submitting…':'Submit for Review'}</button>}
   </div>
  </section>
 </main>;
}
