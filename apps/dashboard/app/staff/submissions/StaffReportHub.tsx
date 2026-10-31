'use client';
import {useState,type FormEvent} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import BrandedSelect from '../../../components/BrandedSelect';

type Report={
 id:string;staff_id:string;recipient_role:string;cadence:string;period_start:string;
 summary:string;blockers:string;status:string;reviewer_note:string|null;
 related_task_id:string|null;created_at:string;reviewed_at:string|null
};
type Task={id:string;title:string;status:string};
const recipients=[
 ['hr','Human Resources (HR)'],
 ['manager','Department Manager'],
 ['operations','Operations'],
 ['finance','Finance'],
 ['sales','Sales'],
 ['legal','Legal / Compliance'],
 ['management','Global Management']
];
function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Staff reporting service is not configured.');
 return createBrowserClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',path:'/',secure:true}
 });
}
const label:React.CSSProperties={display:'grid',gap:7,fontWeight:750,fontSize:13,color:'#225d47'};
const input:React.CSSProperties={padding:'12px 13px',borderRadius:11,border:'1px solid #cfe4d8',width:'100%',background:'#fff',color:'#143c2b',fontSize:14};
const btn:React.CSSProperties={background:'#0c906b',color:'#fff',padding:'12px 19px',border:0,borderRadius:10,fontWeight:800,cursor:'pointer'};
const card:React.CSSProperties={background:'#fff',border:'1px solid #dbeadf',padding:'clamp(18px,2vw,27px)',borderRadius:18,display:'grid',gap:14};
function human(s:string){return s.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
export default function StaffReportHub({userId,canWork,reports,tasks,hideSubmission=false}:{userId:string;canWork:boolean;reports:Report[];tasks:Task[];hideSubmission?:boolean}){
 const [rows,setRows]=useState(reports),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [recipient,setRecipient]=useState('manager'),[cadence,setCadence]=useState('daily');
 const [summary,setSummary]=useState(''),[blockers,setBlockers]=useState(''),[task,setTask]=useState('');
 const [filter,setFilter]=useState<'own'|'inbox'>('own'),[review,setReview]=useState<string|null>(null);
 const [reviewAction,setReviewAction]=useState('acknowledged'),[reviewNote,setReviewNote]=useState('');
 async function refresh(){
  const {data,error}=await db().from('landshop_staff_routed_reports')
   .select('id,staff_id,recipient_role,cadence,period_start,summary,blockers,status,reviewer_note,related_task_id,created_at,reviewed_at')
   .order('created_at',{ascending:false}).limit(200);
  if(error)throw Error(error.message);
  setRows(data||[]);
 }
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setMessage('');
  try{
   if(summary.trim().length<20)throw Error('Provide a work summary of at least 20 characters.');
   const {data,error}=await db().rpc('landshop_staff_submit_routed_report',{
    p_recipient_role:recipient,p_cadence:cadence,p_summary:summary,p_blockers:blockers,p_task:task||null
   });
   if(error||!data)throw Error(error?.message||'The submission could not be recorded.');
   await refresh();setSummary('');setBlockers('');setTask('');
   setMessage('Your '+cadence+' report was submitted to the '+human(recipient)+' inbox, with a server timestamp.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to submit report.')}
  finally{setBusy(false)}
 }
 async function decide(id:string){
  if(reviewNote.trim().length<10){setMessage('Write a review reason of at least 10 characters.');return;}
  setBusy(true);setMessage('');
  try{
   const {error}=await db().rpc('landshop_staff_review_routed_report',{
    p_report:id,p_action:reviewAction,p_note:reviewNote
   });
   if(error)throw Error(error.message);
   await refresh();setReview(null);setReviewNote('');
   setMessage('Review decision saved and sent to the staff reporting history.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to review report.')}
  finally{setBusy(false)}
 }
 const visible=rows.filter(r=>filter==='own'?r.staff_id===userId:r.staff_id!==userId);
 return <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,410px),1fr))',gap:17,alignItems:'start',marginTop:25}}>
  {!hideSubmission&&<section style={card}>
   <h2 style={{margin:0,fontSize:23,letterSpacing:'-.03em'}}>Submit a Work Report</h2>
   <p style={{margin:0,color:'#6a8679',fontSize:12,lineHeight:1.65}}>Reports start from your account's verified activation date. Each submission is time-stamped and visible to the authorised recipient and Global Command Center.</p>
   {canWork?<form onSubmit={submit} style={{display:'grid',gap:14}}>
    <label style={label}>Submit to
     <BrandedSelect value={recipient} onChange={e=>setRecipient(e.target.value)}>
      {recipients.map(([id,name])=><option key={id} value={id}>{name}</option>)}
     </BrandedSelect>
    </label>
    <label style={label}>Reporting cycle
     <BrandedSelect value={cadence} onChange={e=>setCadence(e.target.value)}>
      <option value="daily">Daily report</option><option value="monthly">Monthly report</option>
     </BrandedSelect>
    </label>
    <label style={label}>Related assigned task (optional)
     <BrandedSelect value={task} onChange={e=>setTask(e.target.value)}>
      <option value="">General work report</option>
      {tasks.map(t=><option key={t.id} value={t.id}>{t.title} · {human(t.status)}</option>)}
     </BrandedSelect>
    </label>
    <label style={label}>Summary of work and outcomes
     <textarea style={{...input,minHeight:135}} value={summary} onChange={e=>setSummary(e.target.value)}
      minLength={20} maxLength={6000} required placeholder="Describe work completed, objectives, deliverables, numbers and next actions."/>
     <small style={{color:'#6e8b7d'}}>{summary.length} / 6000 characters</small>
    </label>
    <label style={label}>Delays, risks and support required
     <textarea style={{...input,minHeight:90}} value={blockers} maxLength={3000}
      onChange={e=>setBlockers(e.target.value)} placeholder="Approvals needed, dependencies, blockers or handover notes."/>
    </label>
    <button style={btn} disabled={busy||summary.trim().length<20}>{busy?'Saving securely…':'Submit to '+human(recipient)}</button>
   </form>:<p role="alert">Active staff membership is needed to submit reports. Complete your email verification and staff registration.</p>}
  </section>}
  <section style={card}>
   <h2 style={{margin:0,fontSize:23}}>Reporting History & Inbox</h2>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    <button type="button" onClick={()=>setFilter('own')} style={{...btn,background:filter==='own'?'#0c906b':'#eaf6ee',color:filter==='own'?'#fff':'#0c785f'}}>My Reports</button>
    <button type="button" onClick={()=>setFilter('inbox')} style={{...btn,background:filter==='inbox'?'#0c906b':'#eaf6ee',color:filter==='inbox'?'#fff':'#0c785f'}}>Department Inbox</button>
    <button type="button" disabled={busy} onClick={()=>{void refresh().catch(e=>setMessage(String(e)))}} style={{...btn,background:'#eaf6ee',color:'#087558'}}>Refresh</button>
   </div>
   {!visible.length?<p style={{color:'#779181',fontSize:13,lineHeight:1.65}}>{filter==='own'?'You have not submitted any reports yet.':'No departmental reports are visible to your authorised role.'}</p>:
    <div style={{display:'grid',gap:12}}>{visible.map(r=><article key={r.id} style={{padding:15,borderRadius:14,background:'#f8fcf8',border:'1px solid #dfebdf'}}>
     <div style={{display:'flex',justifyContent:'space-between',gap:9,flexWrap:'wrap',alignItems:'center'}}>
      <strong style={{fontSize:14}}>{human(r.cadence)} to {human(r.recipient_role)}</strong>
      <small style={{textTransform:'capitalize',color:r.status==='returned'?'#bd6627':'#0b876a',fontWeight:800}}>{r.status}</small>
     </div>
     <small style={{color:'#7f9488'}}>{new Date(r.created_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'})} WAT · Period {r.period_start}</small>
     <p style={{whiteSpace:'pre-wrap',lineHeight:1.65,fontSize:13,marginBottom:7}}>{r.summary}</p>
     {r.blockers&&<p style={{whiteSpace:'pre-wrap',fontSize:12,color:'#6d7e74'}}>Risks / Blockers: {r.blockers}</p>}
     {r.reviewer_note&&<p style={{fontSize:12,color:'#087659'}}>Reviewer feedback: {r.reviewer_note}</p>}
     {filter==='inbox'&&r.status==='submitted'&&<div style={{display:'grid',gap:9,marginTop:14}}>
      <button type="button" onClick={()=>setReview(review===r.id?null:r.id)} style={{...btn,padding:9}}>Review report</button>
      {review===r.id&&<>
       <label style={label}>Review decision
        <BrandedSelect value={reviewAction} onChange={e=>setReviewAction(e.target.value)}>
         <option value="acknowledged">Acknowledge received</option><option value="returned">Return for clarification</option>
        </BrandedSelect>
       </label>
       <textarea style={input} value={reviewNote} minLength={10} maxLength={2000}
        onChange={e=>setReviewNote(e.target.value)} placeholder="Explain the decision and next action (10+ characters)"/>
       <button disabled={busy||reviewNote.trim().length<10} type="button" onClick={()=>{void decide(r.id)}} style={btn}>Save review</button>
      </>}
     </div>}
    </article>)}</div>}
  </section>
  {message&&<p aria-live="polite" role="status" style={{gridColumn:'1/-1',padding:14,borderRadius:12,background:'#e8f5eb',color:'#0b755e',fontWeight:650,fontSize:13}}>{message}</p>}
 </div>;
}
