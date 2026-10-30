'use client';
import BrandedSelect from '../../../../components/BrandedSelect';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type Kind='develop_land'|'develop_house'|'beta_mortgage'|'mortgage_xtra'|'inspection'|'incubate'|'thrift';
type Field='product'|'firstName'|'lastName'|'phone'|'state'|'city'|'budget'|'property'|'notes'|'confirm';
type Answers=Record<Field,string|boolean>;
const initial:Answers={product:'develop_land',firstName:'',lastName:'',phone:'',state:'',city:'',budget:'',property:'',notes:'',confirm:false};
const sections=['Your interest','Personal information','Property preferences','Review & save'] as const;
function client(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Supabase is not configured');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'}});
}
export default function ApplicationWizard(){
 const [step,setStep]=useState(0),[data,setData]=useState<Answers>(initial);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const set=(key:Field,value:string|boolean)=>setData(previous=>({...previous,[key]:value}));
 const fieldStyle={width:'100%',padding:14,borderRadius:12,border:'1px solid #ccddd3',background:'#fff'};
 function next(){
  if(step===1&&(!String(data.firstName).trim()||!String(data.lastName).trim()||!String(data.phone).trim())){setMessage('Complete your name and phone number.');return}
  if(step===2&&!String(data.state).trim()){setMessage('Enter the property state.');return}
  setMessage('');setStep(current=>Math.min(3,current+1));
 }
 async function save(){
  if(!data.confirm){setMessage('Confirm the details before saving.');return}
  setBusy(true);setMessage('');
  try{
   const supabase=client();
   const {data:{user},error:authError}=await supabase.auth.getUser();
   if(authError||!user)throw Error('Your session has expired. Please sign in again.');
   const kind=data.product as Kind;
   const answers={
    full_name:(data.firstName+' '+data.lastName).trim(),
    phone:String(data.phone),state:String(data.state),city:String(data.city),
    budget:String(data.budget),property:String(data.property),notes:String(data.notes)
   };
   const {error}=await supabase.from('applications').insert({
    applicant_id:user.id,kind,status:'draft',answers
   });
   if(error)throw Error('Unable to save draft. Confirm your account and try again.');
   setMessage('Draft saved to your account. Submission and management review are not yet activated.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to save draft.')}
  finally{setBusy(false)}
 }
 const input=(label:string,key:Field,type='text')=><label style={{display:'grid',gap:9}}>{label}
   <input style={fieldStyle} value={String(data[key])} type={type} onChange={e=>set(key,e.target.value)} placeholder={'Enter '+label.toLowerCase()}/></label>;
 return <main style={{minHeight:'100vh',background:'#edf7f0',fontFamily:'Arial,sans-serif',padding:'clamp(16px,4vw,56px)',color:'#064d3b'}}>
  <a href="/dashboard" style={{color:'#068065'}}>Landshop / My Dashboard</a>
  <div style={{maxWidth:840,margin:'36px auto',padding:'clamp(22px,4vw,42px)',borderRadius:26,background:'#fffffff0',border:'1px solid #d9e7df',boxShadow:'0 22px 65px #05472f1a'}}>
   <p style={{textTransform:'uppercase',letterSpacing:3,fontSize:12}}>Landshop application</p>
   <h1 style={{fontSize:'clamp(29px,4vw,44px)',marginBottom:8}}>Start your property journey</h1>
   <p>Step {step+1} of {sections.length} — {sections[step]}</p>
   <div aria-label="Application progress" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:28}}>
    {sections.map((_,i)=><div key={i} style={{height:6,background:i<=step?'#078968':'#dde8df',borderRadius:8}}/>)}
   </div>
   {step===0&&<section style={{display:'grid',gap:14}}>
    <label>What would you like to apply for?
    <BrandedSelect style={fieldStyle} value={String(data.product)} onChange={e=>set('product',e.target.value)}>
     <option value="develop_land">Develop — Land</option>
     <option value="develop_house">Develop — House</option>
     <option value="beta_mortgage">Grow — Beta Mortgage</option>
     <option value="mortgage_xtra">Grow — Mortgage Xtra</option>
     <option value="incubate">Incubate — Investment</option>
     <option value="thrift">Thrift — Cooperative</option>
     <option value="inspection">Property inspection</option>
    </BrandedSelect></label>
    <p>Applications are subject to product availability, current lender terms, eligibility and KYC approval.</p>
   </section>}
   {step===1&&<section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:15}}>
    {input('First name','firstName')}{input('Last name','lastName')}{input('Phone / WhatsApp','phone','tel')}
   </section>}
   {step===2&&<section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:15}}>
    {input('State','state')}{input('City or town','city')}{input('Budget (NGN)','budget','number')}
    {input('Estate or property of interest','property')}
    <label style={{gridColumn:'1 / -1',display:'grid',gap:8}}>Additional information
     <textarea style={{...fieldStyle,minHeight:100}} value={String(data.notes)} onChange={e=>set('notes',e.target.value)} placeholder="Tell us about the property and your goals"/></label>
   </section>}
   {step===3&&<section style={{display:'grid',gap:13}}>
    <h2>Review your draft</h2>
    <dl style={{display:'grid',gap:12}}>
     {Object.entries(data).filter(([key])=>key!=='confirm').map(([key,value])=><div key={key} style={{display:'flex',gap:15,borderBottom:'1px solid #e7eee9',paddingBottom:10}}>
      <dt style={{flex:'0 0 35%',textTransform:'capitalize'}}>{key.replace(/([A-Z])/g,' $1')}</dt>
      <dd style={{margin:0}}>{String(value||'—')}</dd>
     </div>)}
    </dl>
    <label><input type="checkbox" checked={Boolean(data.confirm)} onChange={e=>set('confirm',e.target.checked)}/> I confirm the information is accurate and may be stored as a draft.</label>
   </section>}
   <p role="status" aria-live="polite">{message}</p>
   <div style={{display:'flex',justifyContent:'space-between',gap:12,marginTop:26}}>
    <button type="button" disabled={step===0||busy} onClick={()=>{setStep(i=>Math.max(0,i-1));setMessage('')}} style={{padding:'13px 25px',borderRadius:12,border:'1px solid #c0d6c8',background:'white'}}>Back</button>
    {step<3?<button type="button" onClick={next} style={{padding:'13px 32px',background:'#04896b',color:'white',border:0,borderRadius:12}}>Continue</button>:
    <button disabled={busy} type="button" onClick={save} style={{padding:'13px 32px',background:'#04896b',color:'white',border:0,borderRadius:12}}>{busy?'Saving…':'Save Draft'}</button>}
   </div>
  </div>
 </main>;
}
