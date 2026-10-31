'use client';
import {useState,type FormEvent} from 'react';
import {createBrowserClient} from '@supabase/ssr';

type Task={id:string;title:string;status:string;due_at:string;details:string|null};
const roles=[['hr_officer','HR Officer'],['hr','Human Resources'],['department_manager','Department Manager'],['operations','Operations'],['head_finance','Head of Finance'],['customer_service_manager','Customer Service Manager'],['social_media_manager','Social Media Manager'],['admin','Administrator'],['ceo','CEO'],['owner','Owner']];
const field:React.CSSProperties={padding:'12px',width:'100%',borderRadius:9,border:'1px solid #bdd8cc',background:'#fff',color:'#173f33'};
function client(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Staff database is unavailable');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
}
export default function StaffWorkActions({active,initialTasks}:{active:boolean;initialTasks:Task[]}){
 const [tasks,setTasks]=useState(initialTasks),[recipient,setRecipient]=useState('hr_officer'),[period,setPeriod]=useState('daily');
 const [title,setTitle]=useState(''),[details,setDetails]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [notes,setNotes]=useState<Record<string,string>>({});
 async function refresh(){
  const db=client();const {data:{user}}=await db.auth.getUser();if(!user)throw Error('Please sign in again');
  const {data,error}=await db.from('staff_tasks').select('id,title,status,due_at,details').eq('assignee_id',user.id).order('created_at',{ascending:false}).limit(100);
  if(error)throw error;setTasks(data||[]);
 }
 async function task(id:string,action:string){
  if(busy)return;setBusy(true);setNotice('');
  try{
   const {error}=await client().rpc('landshop_staff_task_action',{p_task:id,p_action:action,p_note:notes[id]||''});
   if(error)throw error;await refresh();setNotice('Task '+action+' recorded successfully.');
  }catch(e){setNotice(e instanceof Error?e.message:'Unable to update task')}
  finally{setBusy(false)}
 }
 async function submit(e:FormEvent){
  e.preventDefault();if(busy)return;setBusy(true);setNotice('');
  try{
   const {error}=await client().rpc('landshop_staff_submit_report',{p_recipient_role:recipient,p_period:period,p_title:title.trim(),p_details:details.trim()});
   if(error)throw error;setTitle('');setDetails('');setNotice('Your '+period+' report was submitted to '+roles.find(x=>x[0]===recipient)?.[1]+'.');
  }catch(e){setNotice(e instanceof Error?e.message:'Unable to send report')}
  finally{setBusy(false)}
 }
 if(!active)return null;
 return <section aria-label="Staff task acceptance and reporting" style={{margin:'16px 22px',padding:22,border:'1px solid #d5e9df',borderRadius:18,background:'#f7fcf9',color:'#123d30'}}>
  <h2 style={{margin:'0 0 8px'}}>My Work & Reports</h2>
  <p style={{margin:'0 0 14px'}}>Accept assignments and submit daily or monthly work directly to the designated management role.</p>
  {notice&&<p role="status" aria-live="polite" style={{padding:12,background:'#e5f3ec',borderRadius:9}}>{notice}</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:18}}>
   <div><h3>Assigned tasks</h3>
    {tasks.length===0?<p>No assigned tasks yet.</p>:tasks.map(t=><article key={t.id} style={{padding:14,background:'white',borderRadius:12,marginBottom:10,border:'1px solid #d7e8df'}}>
     <strong>{t.title}</strong><p>{t.details}</p><small>{t.status.replaceAll('_',' ')} · Due {new Date(t.due_at).toLocaleDateString('en-NG')}</small>
     <div style={{display:'flex',flexWrap:'wrap',gap:7,marginTop:10}}>
      {['assigned','returned'].includes(t.status)&&<button type="button" disabled={busy} onClick={()=>task(t.id,'accept')}>Accept Task</button>}
      {['assigned','returned','blocked'].includes(t.status)&&<button type="button" disabled={busy} onClick={()=>task(t.id,'start')}>Start</button>}
      {['assigned','returned','in_progress','blocked'].includes(t.status)&&<button type="button" disabled={busy} onClick={()=>task(t.id,'submit')}>Submit Work</button>}
     </div>
     {['assigned','returned','in_progress','blocked'].includes(t.status)&&<textarea aria-label={'Work summary for '+t.title} placeholder="Write at least 15 characters before submitting work" style={{...field,marginTop:10}} value={notes[t.id]||''} onChange={e=>setNotes(n=>({...n,[t.id]:e.target.value}))}/>}
    </article>)}
    <button type="button" disabled={busy} onClick={()=>void refresh().catch(e=>setNotice(e.message))}>Refresh assignments</button>
   </div>
   <form onSubmit={submit} style={{display:'grid',gap:11,alignContent:'start'}}><h3 style={{margin:0}}>Submit a work report</h3>
    <label>Reporting period<select style={field} value={period} onChange={e=>setPeriod(e.target.value)}><option value="daily">Daily</option><option value="monthly">Monthly</option></select></label>
    <label>Send to<select style={field} value={recipient} onChange={e=>setRecipient(e.target.value)}>{roles.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
    <label>Report title<input style={field} required minLength={5} maxLength={180} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label>Achievements and tasks completed<textarea style={{...field,minHeight:145}} required minLength={15} maxLength={6000} value={details} onChange={e=>setDetails(e.target.value)}/></label>
    <button type="submit" disabled={busy} style={{padding:14,border:0,borderRadius:10,background:'#2ba47a',color:'white',fontWeight:700}}>Submit to management</button>
   </form>
  </div>
 </section>;
}
