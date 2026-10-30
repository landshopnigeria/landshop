'use client';
import BrandedSelect from '../../../components/BrandedSelect';

import {useEffect,useState,type FormEvent} from 'react';
import {createBrowserClient} from '@supabase/ssr';
type Member={user_id:string;username:string;requested_role:string;employment_state:string;kyc_state:string;photo_path:string|null;staff_number:string|null;review_note:string|null};
type Task={id:string;assignee_id:string;assigned_by:string;title:string;status:string;due_at:string;planned_minutes:number|null;delay_allowance_minutes:number;score:number|null;assignee_report:string|null;review_comment:string|null};
type History={id:string;action:string;occurred_at:string;place:string;latitude:number;longitude:number;accuracy_m:number};
type Daily={id:string;staff_id:string;report_date:string;summary:string;blockers:string|null;updated_at:string};
type Rank={staff_id:string;username:string;staff_number:string|null;tasks_scored:number;score_percent:number|null;rank_position:number;recommendation:string};
const field={width:'100%',padding:'12px 13px',border:'1px solid #d2e5d9',borderRadius:10,background:'#fff',color:'#184c35',fontSize:13};
const btn={padding:'12px 17px',border:0,borderRadius:10,background:'#2ba47a',color:'#fff',fontWeight:800,cursor:'pointer'};
const titles=['ceo','founder','admin','executive','operations','finance','head_finance','hr','hr_officer','technology_officer','technology_consultant','social_media_manager','customer_service_manager','department_manager','sales','legal','surveyor','marketing','staff','security','youth_corps','intern'];
function db(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!u||!k)throw Error('Secure database missing');return createBrowserClient(u,k,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',secure:true,sameSite:'lax'}})}
export default function WorkforcePanel({people,taskRows,dailyRows,actorRole}:{people:Member[];taskRows:Task[];dailyRows:Daily[];actorRole:string}){
 const [staff,setStaff]=useState(people),[tasks,setTasks]=useState(taskRows),[selected,setSelected]=useState(''),[role,setRole]=useState('staff'),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
 const [photo,setPhoto]=useState<Record<string,string>>({});
 const [assignee,setAssignee]=useState(''),[taskTitle,setTaskTitle]=useState(''),[details,setDetails]=useState(''),[minutes,setMinutes]=useState('120'),[delay,setDelay]=useState('0'),[due,setDue]=useState('');
 const [reviewTask,setReviewTask]=useState(''),[score,setScore]=useState('85'),[feedback,setFeedback]=useState('');
 const [rank,setRank]=useState<Rank[]>([]),[year,setYear]=useState(new Date().getFullYear());
 const [historyStaff,setHistoryStaff]=useState(''),[history,setHistory]=useState<History[]>([]);
 const [officeName,setOfficeName]=useState('Landshop Office'),[officeAddress,setOfficeAddress]=useState("King's Deck, Alternative Route, off Chevron Drive, Lekki, Lagos, Nigeria"),[lat,setLat]=useState(''),[lng,setLng]=useState(''),[radius,setRadius]=useState('150');
 const [officeReason,setOfficeReason]=useState('');
 const isOwner=actorRole==='owner';
 const managementOnly=['ceo','founder','admin','technology_officer','technology_consultant'];
 const managerRoles=isOwner?titles:titles.filter(x=>!managementOnly.includes(x));
 const active=staff.filter(x=>x.employment_state==='active'&&x.kyc_state==='approved');
 useEffect(()=>{for(const p of staff){if(p.photo_path&&!photo[p.user_id]){db().storage.from('landshop-staff-private').createSignedUrl(p.photo_path,600).then(r=>{if(r.data?.signedUrl)setPhoto(z=>({...z,[p.user_id]:r.data!.signedUrl}))}).catch(()=>{})}}},[staff]);
 async function call(fn:string,args:Record<string,unknown>,success:string){
  setBusy(true);setMsg('');
  try{const {error,data}=await db().rpc(fn,args);if(error)throw Error(error.message);setMsg(success);return data}
  catch(e){setMsg(e instanceof Error?e.message:'Request failed');return null}finally{setBusy(false)}
 }
 async function review(approve:boolean){if(!selected)return;
  const ok=await call('landshop_staff_review',{p_user:selected,p_approve:approve,p_role:role,p_reason:reason},approve?'Identity verified, membership approved and staff ID issued.':'Identity review rejected with an audit note.');
  if(ok)setStaff(p=>p.map(x=>x.user_id===selected?{...x,employment_state:approve?'active':'pending',kyc_state:approve?'approved':'rejected',staff_number:approve?x.staff_number||'Issued by server':x.staff_number}:x));
 }
 async function revoke(){if(!selected)return;const ok=await call('landshop_staff_revoke',{p_user:selected,p_reason:reason},'Staff access suspended. This is a reversible governance action, not hard deletion.');if(ok)setStaff(x=>x.map(p=>p.user_id===selected?{...p,employment_state:'suspended'}:p))}
 async function assign(e:FormEvent<HTMLFormElement>){e.preventDefault();
  const parsed=new Date(due);if(!Number.isFinite(parsed.getTime())){setMsg('Choose a valid date/time');return}
  const data=await call('landshop_staff_task_assign',{p_assignee:assignee,p_title:taskTitle,p_details:details,p_minutes:Number(minutes),p_delay:Number(delay),p_due:parsed.toISOString()},'Task assigned with server time, clear expected duration, delay allowance and accountable manager.');
  if(data){setTasks(p=>[{id:String(data),assignee_id:assignee,assigned_by:'management',title:taskTitle,status:'assigned',due_at:parsed.toISOString(),planned_minutes:Number(minutes),delay_allowance_minutes:Number(delay),score:null,assignee_report:null,review_comment:null},...p]);setTaskTitle('');setDetails('')}
 }
 async function taskReview(approved:boolean){
  const ok=await call('landshop_staff_task_review',{p_task:reviewTask,p_approve:approved,p_score:Number(score),p_comment:feedback},'Manager feedback and '+(approved?'accepted score':'return for revisions')+' recorded.');
  if(ok)setTasks(p=>p.map(t=>t.id===reviewTask?{...t,status:approved?'accepted':'returned',score:approved?Number(score):null,review_comment:feedback}:t));
 }
 async function getRank(){setBusy(true);setMsg('');const {data,error}=await db().rpc('landshop_staff_annual_ranking',{p_year:year});setBusy(false);if(error)setMsg(error.message);else setRank(data as Rank[]||[])}
 async function attendance(user:string){setHistoryStaff(user);const {data,error}=await db().rpc('landshop_attendance_history',{p_user:user});if(error)setMsg(error.message);else setHistory(data||[])}
 async function office(e:FormEvent<HTMLFormElement>){e.preventDefault();await call('landshop_office_register',{p_name:officeName,p_address:officeAddress,p_lat:Number(lat),p_lng:Number(lng),p_radius:Number(radius),p_reason:officeReason},'Verified office geofence saved. Future GPS attendance within the radius can be labeled '+officeName+'. Coordinates are not independently verified by the software.')}
 const chosen=staff.find(p=>p.user_id===selected);
 return <div style={{display:'grid',gap:21}}>
  {msg&&<p role="status" style={{padding:16,borderRadius:11,background:'#fff0e0',color:'#86511e',fontSize:13}}>{msg}</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))',gap:18}}>
  <section className="wcard"><h2>Staff identity & access review</h2>
  <p className="subtle">Every role starts as a request. Photo and employee status require an independent management decision. Only the owner can approve Command Center roles.</p>
  <label>Choose registered staff<BrandedSelect value={selected} onChange={e=>{setSelected(e.target.value);setRole(staff.find(x=>x.user_id===e.target.value)?.requested_role||'staff')}} style={field}><option value="">Choose applicant</option>{staff.map(s=><option value={s.user_id} key={s.user_id}>{s.username} · {s.kyc_state} / {s.employment_state}</option>)}</BrandedSelect></label>
  {chosen&&<div style={{display:'grid',gap:8,marginTop:15}}>
   <strong>{chosen.username}</strong><small>Requested: {chosen.requested_role.replaceAll('_',' ')}</small><small>Current ID: {chosen.staff_number||'Not assigned'}</small>
   {photo[chosen.user_id]?<img src={photo[chosen.user_id]} width={125} height={155} alt="Privately submitted staff KYC portrait" style={{borderRadius:12,objectFit:'cover'}}/>:<p className="subtle">No accessible original portrait for verification.</p>}
   <label>Approved role<BrandedSelect value={role} style={field} onChange={e=>setRole(e.target.value)}>{managerRoles.map(r=><option key={r} value={r}>{r.replaceAll('_',' ')}</option>)}</BrandedSelect></label>
   <label>Reason and identity-verification evidence<textarea style={field} rows={3} minLength={20} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Describe the reviewed face photo, employment authorization, and assigned department"/></label>
   <div className="actions"><button disabled={busy||reason.trim().length<20||!photo[chosen.user_id]} style={btn} onClick={()=>review(true)}>Approve identity + role</button><button disabled={busy||reason.trim().length<20} style={{...btn,background:'#b96b22'}} onClick={()=>review(false)}>Reject KYC</button><button disabled={busy||reason.trim().length<20} style={{...btn,background:'#9a3737'}} onClick={revoke}>Suspend access</button></div>
  </div>}
  </section>
  <section className="wcard"><h2>Manager-assigned task</h2><p className="subtle">Provide the exact estimated time, deadline, delay allowance and expected outcome. The employee receives a timestamped assignment.</p>
   <form onSubmit={assign} style={{display:'grid',gap:12}}>
    <label>Assignee<BrandedSelect required style={field} value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">Choose active staff</option>{active.map(p=><option key={p.user_id} value={p.user_id}>{p.username}</option>)}</BrandedSelect></label>
    <label>Task title<input required minLength={5} maxLength={180} style={field} value={taskTitle} onChange={e=>setTaskTitle(e.target.value)}/></label>
    <label>Instructions / deliverables<textarea style={field} rows={4} value={details} onChange={e=>setDetails(e.target.value)} placeholder="Expected evidence, task goals, dependencies"/></label>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(135px,1fr))',gap:10}}>
     <label>Minutes expected<input type="number" required min={5} max={20160} style={field} value={minutes} onChange={e=>setMinutes(e.target.value)}/></label>
     <label>Delay allowance (minutes)<input type="number" required min={0} max={10080} style={field} value={delay} onChange={e=>setDelay(e.target.value)}/></label>
    </div>
    <label>Due date and time (local)<input required type="datetime-local" style={field} value={due} onChange={e=>setDue(e.target.value)}/></label>
    <button disabled={busy||!assignee} style={btn}>Assign timed task</button>
   </form>
  </section>
  <section className="wcard"><h2>Manager task scorecard</h2><label>Submitted work<BrandedSelect style={field} value={reviewTask} onChange={e=>setReviewTask(e.target.value)}><option value="">Select submitted task</option>{tasks.filter(x=>x.status==='submitted').map(t=><option key={t.id} value={t.id}>{t.title} · {staff.find(p=>p.user_id===t.assignee_id)?.username||t.assignee_id.slice(0,8)}</option>)}</BrandedSelect></label>
   {tasks.find(x=>x.id===reviewTask)&&<p className="subtle">Staff report: {tasks.find(x=>x.id===reviewTask)?.assignee_report||'Not recorded'}</p>}
   <label>Quality score (0–100)<input type="number" min={0} max={100} style={field} value={score} onChange={e=>setScore(e.target.value)}/></label>
   <label>Evidence and feedback<textarea rows={4} style={field} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Document acceptance criteria, actual result, delay context, blockers and any scoring rationale"/></label>
   <div className="actions"><button disabled={busy||!reviewTask||feedback.trim().length<20} onClick={()=>taskReview(true)} style={btn}>Accept + Score</button><button disabled={busy||!reviewTask||feedback.trim().length<20} onClick={()=>taskReview(false)} style={{...btn,background:'#b77317'}}>Return for correction</button></div>
   <p className="subtle">Scoring requires evidence and cannot directly change payroll.</p>
  </section>
  <section className="wcard"><h2>Office geofence setup</h2>
   <p className="subtle">Register the real office coordinates from a verified on-site GPS point. “Landshop Office” will be shown only within this approved radius, accounting for GPS accuracy.</p>
   <form onSubmit={office} style={{display:'grid',gap:10}}>
    <label>Office label<input style={field} required value={officeName} onChange={e=>setOfficeName(e.target.value)}/></label>
    <label>Verified street address<textarea style={field} required rows={2} value={officeAddress} onChange={e=>setOfficeAddress(e.target.value)}/></label>
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:9}}>
     <label>GPS latitude<input required type="number" step="any" style={field} value={lat} onChange={e=>setLat(e.target.value)}/></label>
     <label>GPS longitude<input required type="number" step="any" style={field} value={lng} onChange={e=>setLng(e.target.value)}/></label>
    </div>
    <label>Geofence radius (meters)<input style={field} type="number" min={30} max={1000} value={radius} onChange={e=>setRadius(e.target.value)}/></label>
    <label>Verification reason<textarea required minLength={20} rows={3} style={field} value={officeReason} onChange={e=>setOfficeReason(e.target.value)} placeholder="Who confirmed the entrance GPS pin and address, and when?"/></label>
    <button style={btn} disabled={busy||!lat||!lng||officeReason.trim().length<20}>Register verified office</button>
   </form>
  </section>
  </div>
  <section className="wcard"><h2>Annual workforce performance</h2><p className="subtle">Annual task-quality ranking is limited to human-reviewed work. Unscored tasks and approved delays are not silently treated as failures. Minimum five scored tasks before promotion consideration.</p>
  <div className="actions"><label>Year <input type="number" style={{...field,width:140}} value={year} min={2020} max={2100} onChange={e=>setYear(+e.target.value)}/></label><button onClick={getRank} style={btn}>Load annual ranking</button></div>
  <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',marginTop:15,fontSize:13}}><thead><tr>{['Rank','Staff','Tasks scored','Weighted score','Review status'].map(x=><th style={{textAlign:'left',padding:10,borderBottom:'1px solid #ddd'}} key={x}>{x}</th>)}</tr></thead><tbody>{rank.map(x=><tr key={x.staff_id}>{[x.rank_position,x.username,x.tasks_scored,x.score_percent==null?'—':x.score_percent+'%',x.recommendation.replaceAll('_',' ')].map((a,i)=><td key={i} style={{padding:10,borderBottom:'1px solid #e7eee9'}}>{a}</td>)}</tr>)}</tbody></table></div>
  <p className="subtle">Below 70% prompts supportive management review; 100% may recommend a promotion assessment. No salary deduction or promotion is automated.</p>
  </section>
  <section className="wcard"><h2>Daily work journal</h2><p className="subtle">Every employee's daily written update and reported dependencies. These reports supplement independently verified work-time logs rather than automatically changing performance scores.</p>
   <div style={{maxHeight:420,overflowY:'auto',display:'grid',gap:12}}>
   {dailyRows.map(r=><article key={r.id} style={{border:'1px solid #e2eee6',borderRadius:11,padding:14}}>
    <strong style={{fontSize:13}}>{people.find(x=>x.user_id===r.staff_id)?.username||r.staff_id.slice(0,8)} · {r.report_date}</strong>
    <p style={{fontSize:13,lineHeight:1.65}}>{r.summary}</p>
    {r.blockers&&<p style={{fontSize:12,color:'#9e6319'}}>Blockers: {r.blockers}</p>}
    <small>Updated: {new Date(r.updated_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'})} WAT</small>
   </article>)}
   {!dailyRows.length&&<p className="subtle">No daily work reports have been submitted.</p>}
   </div>
  </section>
  <section className="wcard"><h2>Attendance oversight</h2><div className="actions"><BrandedSelect style={{...field,maxWidth:340}} value={historyStaff} onChange={e=>{setHistoryStaff(e.target.value);setHistory([])}}><option value="">Choose staff</option>{staff.map(x=><option key={x.user_id} value={x.user_id}>{x.username}</option>)}</BrandedSelect><button disabled={!historyStaff} style={btn} onClick={()=>attendance(historyStaff)}>View GPS history</button></div>
   {history.map(h=><p key={h.id} style={{fontSize:12,borderBottom:'1px solid #ecf1ed',padding:8}}><strong>{h.action==='clock_in'?'Clock IN':'Clock OUT'}</strong> · {new Date(h.occurred_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'})} WAT · {h.place} · GPS ±{h.accuracy_m}m · <a style={{color:'#087a58'}} target="_blank" rel="noopener noreferrer" href={'https://www.google.com/maps/search/?api=1&query='+h.latitude+','+h.longitude}>Map pin ↗</a></p>)}
   <p className="subtle">Location is captured only at explicit clock events. Location history is sensitive employee information; management access is audited and subject to applicable privacy policies.</p>
  </section>
 </div>;
}
