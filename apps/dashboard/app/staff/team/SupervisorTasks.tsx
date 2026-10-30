'use client';
import BrandedSelect from '../../../components/BrandedSelect';

import {useState,type FormEvent} from 'react';
import {createBrowserClient} from '@supabase/ssr';
type Person={staff_id:string;username:string;role:string};
type Task={id:string;title:string;status:string;assignee_id:string;due_at:string;planned_minutes:number|null;delay_allowance_minutes:number;score:number|null;assignee_report:string|null};
const field={width:'100%',padding:13,border:'1px solid #d4e5d9',borderRadius:11,background:'#fff'};
const btn={background:'#2ba47a',border:0,color:'#fff',borderRadius:10,padding:'13px 18px',fontWeight:800,cursor:'pointer'};
function db(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!u||!k)throw Error('Supabase configuration missing');return createBrowserClient(u,k,{cookieOptions:{domain:'.landshopnigeria.com',secure:true,path:'/',sameSite:'lax'}})}
export default function SupervisorTasks({people,tasks:initial}:{people:Person[];tasks:Task[]}){
 const [tasks,setTasks]=useState(initial),[staff,setStaff]=useState(''),[title,setTitle]=useState(''),[desc,setDesc]=useState(''),[due,setDue]=useState(''),[minutes,setMinutes]=useState('120'),[delay,setDelay]=useState('0');
 const [chosen,setChosen]=useState(''),[score,setScore]=useState('85'),[feedback,setFeedback]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function assign(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  try{const date=new Date(due);if(!Number.isFinite(date.getTime()))throw Error('Choose a valid deadline');
   const {data,error}=await db().rpc('landshop_staff_task_assign',{p_assignee:staff,p_title:title,p_details:desc,p_minutes:Number(minutes),p_delay:Number(delay),p_due:date.toISOString()});
   if(error)throw Error(error.message);
   setTasks(v=>[{id:String(data),assignee_id:staff,title,status:'assigned',planned_minutes:Number(minutes),delay_allowance_minutes:Number(delay),due_at:date.toISOString(),score:null,assignee_report:null},...v]);setMessage('Task assigned. The staff member will see the required time, deadline and task instructions.');setTitle('');setDesc('');
  }catch(e){setMessage(e instanceof Error?e.message:'Assignment failed')}finally{setBusy(false)}
 }
 async function review(approve:boolean){
  setBusy(true);setMessage('');
  try{const {error}=await db().rpc('landshop_staff_task_review',{p_task:chosen,p_approve:approve,p_score:Number(score),p_comment:feedback});
   if(error)throw Error(error.message);
   setTasks(v=>v.map(x=>x.id===chosen?{...x,status:approve?'accepted':'returned',score:approve?Number(score):null}:x));
   setMessage('Independent task review recorded. Only accepted work contributes to performance scores.');setFeedback('');setChosen('');
  }catch(e){setMessage(e instanceof Error?e.message:'Review failed')}finally{setBusy(false)}
 }
 return <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,340px),1fr))',gap:19}}>
 <section style={{background:'white',padding:26,borderRadius:18,border:'1px solid #dbe9de'}}><h2>Assign timed work</h2><p style={{fontSize:13,color:'#607869'}}>The task is server-timestamped and the assigned employee will automatically record their first view when opening it.</p>
 <form onSubmit={assign} style={{display:'grid',gap:13}}>
  <label>Verified employee<BrandedSelect required style={field} value={staff} onChange={e=>setStaff(e.target.value)}><option value="">Select team member</option>{people.map(x=><option key={x.staff_id} value={x.staff_id}>{x.username} · {x.role.replaceAll('_',' ')}</option>)}</BrandedSelect></label>
  <label>Task<input required minLength={5} maxLength={180} style={field} value={title} onChange={e=>setTitle(e.target.value)}/></label>
  <label>Instructions and expected result<textarea rows={4} style={field} value={desc} onChange={e=>setDesc(e.target.value)}/></label>
  <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:9}}>
  <label>Estimated minutes<input required type="number" min={5} max={20160} style={field} value={minutes} onChange={e=>setMinutes(e.target.value)}/></label>
  <label>Delay allowance<input required type="number" min={0} max={10080} style={field} value={delay} onChange={e=>setDelay(e.target.value)}/></label></div>
  <label>Due date and time<input required type="datetime-local" style={field} value={due} onChange={e=>setDue(e.target.value)}/></label>
  <button disabled={busy||!staff} style={btn}>Assign task</button>
 </form></section>
 <section style={{background:'white',padding:26,borderRadius:18,border:'1px solid #dbe9de'}}><h2>Review completed assignments</h2><p style={{fontSize:13,color:'#607869'}}>Review only tasks your role authorized you to assign. A staff member cannot score their own submissions.</p>
 <label>Submitted tasks<BrandedSelect style={field} value={chosen} onChange={e=>setChosen(e.target.value)}><option value="">Select submitted work</option>{tasks.filter(x=>x.status==='submitted').map(x=><option key={x.id} value={x.id}>{x.title} · {people.find(p=>p.staff_id===x.assignee_id)?.username||'Staff'}</option>)}</BrandedSelect></label>
 {tasks.find(x=>x.id===chosen)&&<p style={{fontSize:12,color:'#476b55',padding:12,background:'#f2faf4'}}>Report: {tasks.find(x=>x.id===chosen)?.assignee_report||'Not supplied'}</p>}
 <label>Quality score<input type="number" min={0} max={100} style={field} value={score} onChange={e=>setScore(e.target.value)}/></label>
 <label>Documented feedback<textarea rows={4} minLength={20} maxLength={2000} style={field} value={feedback} onChange={e=>setFeedback(e.target.value)}/></label>
 <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:10}}><button disabled={busy||!chosen||feedback.trim().length<20} onClick={()=>review(true)} style={btn}>Accept and score</button><button disabled={busy||!chosen||feedback.trim().length<20} onClick={()=>review(false)} style={{...btn,background:'#c47725'}}>Return for correction</button></div>
 <h3 style={{marginTop:24}}>Your assigned task history</h3>
 <div style={{maxHeight:360,overflowY:'auto'}}>{tasks.map(x=><p key={x.id} style={{fontSize:12,padding:10,borderBottom:'1px solid #edf1ed'}}><b>{x.title}</b><br/>{x.status} · {x.planned_minutes||'—'} expected min · Due {new Date(x.due_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'})} WAT · Score {x.score??'Pending'}</p>)}</div>
 </section>
 {message&&<p role="status" style={{gridColumn:'1/-1',background:'#f0f9ef',padding:15,borderRadius:12,color:'#106641'}}>{message}</p>}
 </div>;
}
