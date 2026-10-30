'use client';
import BrandedSelect from '../../../../components/BrandedSelect';

import {useState} from 'react';

export default function DecisionForm({submissionId,status}:{submissionId:string;status:string}){
 const [decision,setDecision]=useState<'approved'|'rejected'>('rejected');
 const [reason,setReason]=useState('');
 const [attested,setAttested]=useState(false);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const allowed=['submitted','review'].includes(status);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/admin/kyc/decision',{
    method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({submissionId,decision,reason})
   });
   const body=await response.json();
   if(!response.ok)throw Error(body.error||'Unable to record decision');
   setMessage('Decision recorded. Refresh to view updated status.');
  }catch(error){setMessage(error instanceof Error?error.message:'Decision failed')}
  finally{setBusy(false)}
 }
 return <form onSubmit={submit} style={{border:'1px solid #d3e6da',borderRadius:20,padding:26,display:'grid',gap:15}}>
  <h2>Record a KYC decision</h2>
  <p>Review all documents and verify the applicant's identity manually. This action updates customer status and writes an audit record.</p>
  <label>Decision
   <BrandedSelect disabled={!allowed||busy} value={decision} onChange={e=>{setDecision(e.target.value as 'approved'|'rejected');setAttested(false)}} style={{display:'block',padding:12,width:'100%'}}>
    <option value="rejected">Reject application</option><option value="approved">Approve identity verification</option>
   </BrandedSelect>
  </label>
  <label>Decision reason and verification notes
   <textarea value={reason} onChange={e=>setReason(e.target.value)} disabled={!allowed||busy}
    minLength={15} maxLength={1500} required rows={5} placeholder="Describe the evidence checked and why this decision is appropriate"
    style={{display:'block',padding:12,width:'100%',border:'1px solid #abcfc2',borderRadius:12}}/>
  </label>
  <label><input type="checkbox" checked={attested} onChange={e=>setAttested(e.target.checked)} disabled={!allowed||busy}/>
   I have completed the required manual document and identity checks, and understand my decision is recorded.</label>
  <button type="submit" disabled={!allowed||busy||!attested||reason.trim().length<15}
   style={{background:'#07896a',color:'white',border:0,borderRadius:12,padding:14}}>
   {busy?'Recording…':'Record decision'}
  </button>
  {!allowed&&<p>This application is no longer awaiting a decision.</p>}
  <p aria-live="polite" role="status">{message}</p>
 </form>
}
