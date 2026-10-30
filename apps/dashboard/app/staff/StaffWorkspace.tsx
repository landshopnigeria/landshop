'use client';
import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '@supabase/ssr';
type Profile={user_id:string;username:string;requested_role:string;age_at_registration:number;gender:string;kyc_state:string;employment_state:string;photo_path:string|null;staff_number:string|null;joined_at:string|null};
type Task={id:string;title:string;details:string|null;status:string;starts_at:string;due_at:string;planned_minutes:number|null;delay_allowance_minutes:number;viewed_at:string|null;started_at:string|null;submitted_at:string|null;score:number|null;review_comment:string|null;assigned_by:string};
type Attendance={id:string;action:string;occurred_at:string;place:string;latitude:number;longitude:number;accuracy_m:number};
type Report={score_percent:number|null;assigned_tasks:number;reviewed_tasks:number;planned_minutes:number;tracked_work_minutes:number;recommendation:string;payroll_action:string;period:string};
const inputStyle={width:'100%',padding:12,borderRadius:10,border:'1px solid #cfe3d5',background:'white',color:'#123f2e',fontSize:14};
const buttonStyle={padding:'11px 15px',background:'#2ba47a',border:0,borderRadius:10,color:'white',fontWeight:800,cursor:'pointer'};
function browser(){
 const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!u||!k)throw Error('Secure employee database unavailable');
 return createBrowserClient(u,k,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
}
export default function StaffWorkspace({userId,initialProfile,initialTasks,role,metadata}:{userId:string;initialProfile:Profile|null;initialTasks:Task[];role:string|null;metadata:Record<string,unknown>}){
 const [profile,setProfile]=useState(initialProfile),[tasks,setTasks]=useState(initialTasks),[username,setUsername]=useState(typeof metadata.preferred_username==='string'?metadata.preferred_username:'');
 const [age,setAge]=useState(typeof metadata.age_at_registration==='number'?String(metadata.age_at_registration):'');
 const [gender,setGender]=useState(typeof metadata.gender==='string'?metadata.gender:'prefer_not_to_say');
 const [wanted,setWanted]=useState(typeof metadata.requested_role==='string'?metadata.requested_role:'staff');
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[image,setImage]=useState<string|null>(null);
 const [attendance,setAttendance]=useState<Attendance[]>([]),[report,setReport]=useState<Report|null>(null),[period,setPeriod]=useState('month');
 const [daily,setDaily]=useState(''),[blockers,setBlockers]=useState(''),[selected,setSelected]=useState(''),[taskNote,setTaskNote]=useState('');
 const verified=Boolean(profile?.employment_state==='active'&&profile?.kyc_state==='approved');
 const management=['owner','ceo','founder','admin','technology_officer','technology_consultant'].includes(role||'');
 function notify(err:unknown){setMessage(err instanceof Error?err.message:'Unable to save changes')}
 async function refresh(){
  try{const db=browser();const [{data:p},{data:t}]=await Promise.all([
    db.from('landshop_staff_profiles').select('*').eq('user_id',userId).maybeSingle(),
    db.from('staff_tasks').select('id,title,details,status,starts_at,due_at,planned_minutes,delay_allowance_minutes,viewed_at,started_at,submitted_at,score,review_comment,assigned_by').eq('assignee_id',userId).order('created_at',{ascending:false}).limit(100)
  ]);
  if(p)setProfile(p as Profile);if(t)setTasks(t as Task[]);
  const [a,s]=await Promise.all([db.rpc('landshop_attendance_history',{p_user:userId}),db.rpc('landshop_staff_performance',{p_staff:userId,p_period:period})]);
  if(!a.error&&Array.isArray(a.data))setAttendance(a.data as Attendance[]);
  if(!s.error&&s.data)setReport(s.data as Report);
  if(p?.photo_path){const x=await db.storage.from('landshop-staff-private').createSignedUrl(p.photo_path,600);if(x.data?.signedUrl)setImage(x.data.signedUrl)}
  }catch(e){notify(e)}
 }
 useEffect(()=>{if(profile)void refresh()},[period]);
 async function onboard(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  try{const {error}=await browser().rpc('landshop_staff_onboard',{p_username:username.trim().toLowerCase(),p_age:Number(age),p_gender:gender,p_requested_role:wanted});
   if(error)throw Error(error.message);setMessage('Employee registration recorded. Upload your portrait for KYC review. Requested job titles do not grant special access.');await refresh();
  }catch(e){notify(e)}finally{setBusy(false)}
 }
 async function upload(f:File|null){
  if(!f)return;setBusy(true);setMessage('');
  try{
   if(f.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(f.type))throw Error('Use a JPEG, PNG or WebP image under 5 MB');
   const ext=f.type==='image/png'?'png':f.type==='image/webp'?'webp':'jpg';
   const path=userId+'/portrait/'+crypto.randomUUID().replaceAll('-','')+'_'+Date.now().toString(36).padEnd(20,'0')+'.'+ext;
   const db=browser();const {error:upError}=await db.storage.from('landshop-staff-private').upload(path,f,{upsert:false,contentType:f.type});
   if(upError)throw Error(upError.message);
   const {error}=await db.rpc('landshop_staff_submit_photo',{p_path:path});
   if(error)throw Error(error.message);
   setMessage('Your photograph was uploaded privately for manual identity verification. This does not automatically approve your staff ID.');
   await refresh();
  }catch(e){notify(e)}finally{setBusy(false)}
 }
 async function clock(action:'clock_in'|'clock_out'){
  if(!verified){setMessage('Verified staff KYC and approved membership are required for attendance');return}
  if(!window.navigator.geolocation){setMessage('This browser does not support GPS.');return}
  setBusy(true);setMessage('Requesting one-time GPS permission for this attendance action…');
  navigator.geolocation.getCurrentPosition(async position=>{
   try{
    const {latitude,longitude,accuracy}=position.coords;
    const {data,error}=await browser().rpc('landshop_staff_clock',{p_action:action,p_lat:latitude,p_lng:longitude,p_accuracy:Math.round(accuracy),p_consent:true});
    if(error)throw Error(error.message);
    setMessage(action.replace('_',' ')+' recorded by the server at '+new Date(data.time).toLocaleString('en-NG',{timeZone:'Africa/Lagos'})+' (WAT). '+data.location_label+'. Accuracy ±'+data.accuracy_m+'m. GPS can be spoofed; management may review exceptions.');
    await refresh();
   }catch(e){notify(e)}finally{setBusy(false)}
  },err=>{setMessage('GPS permission unavailable: '+err.message+'. No attendance record was created.');setBusy(false)},{enableHighAccuracy:true,timeout:14000,maximumAge:0});
 }
 async function action(id:string,operation:string,note=''){
  setBusy(true);setMessage('');
  try{const {error}=await browser().rpc('landshop_staff_task_action',{p_task:id,p_action:operation,p_note:note});
   if(error)throw Error(error.message);setMessage('Task '+operation+' recorded with a server timestamp.');setSelected('');setTaskNote('');await refresh();
  }catch(e){notify(e)}finally{setBusy(false)}
 }
 async function sendDaily(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  try{const {error}=await browser().rpc('landshop_staff_daily_report',{p_summary:daily,p_blockers:blockers});
   if(error)throw Error(error.message);setMessage('Daily work report saved for today (Lagos time).');setDaily('');setBlockers('');
  }catch(e){notify(e)}finally{setBusy(false)}
 }
 async function signOut(){await browser().auth.signOut();window.location.assign('/staff/sign-in')}
 return <main className="ls-work"><style>{`*{box-sizing:border-box}.ls-work{min-height:100vh;font-family:Arial,sans-serif;color:#123c2e;background:#f2faf5;padding:clamp(16px,4vw,49px)}.ls-work-shell{max-width:1200px;margin:auto}.ls-work-card{background:rgba(255,255,255,.96);border:1px solid #dcebe0;border-radius:20px;padding:clamp(17px,2.6vw,28px);min-width:0}.ls-work-layout{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:18px}.ls-work h1{font-size:clamp(25px,4vw,40px);margin:13px 0}.ls-work h2{font-size:23px;margin:4px 0 17px}.ls-work h3{font-size:17px}.ls-work p{line-height:1.62}.ls-work-small{font-size:12px;color:#6a8272}.ls-work-actions{display:flex;gap:9px;flex-wrap:wrap}.ls-work-actions button{flex:1 1 auto}.ls-work header{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:28px}.ls-work .staff-task{border:1px solid #e0ebdf;padding:16px;border-radius:13px;margin-bottom:11px}.ls-work .staff-task p{font-size:13px;color:#637d6c}.ls-work select,.ls-work input,.ls-work textarea{max-width:100%}@media print{.ls-work-no-print{display:none!important}.ls-id-only{max-width:580px;border:2px solid #176b4e}.ls-work-layout>:not(.ls-id-only){display:none}}`}</style>
 <div className="ls-work-shell">
 <header className="ls-work-no-print"><div><Link href="https://www.landshopnigeria.com" style={{color:'#16855f'}}>LANDSHOP</Link><h1>My work dashboard</h1><p style={{color:'#667d6d',fontSize:13}}>Staff identity · Attendance · Tasks · Performance</p></div><div className="ls-work-actions">{management&&<Link href="/admin" style={{...buttonStyle,textDecoration:'none'}}>Global Command Center ↗</Link>}<button type="button" onClick={signOut} style={{...buttonStyle,background:'#265c49'}}>Sign Out</button></div></header>
 {message&&<p role="status" className="ls-work-no-print" style={{padding:14,borderRadius:12,background:'#fff0df',color:'#7c501f',fontSize:13}}>{message}</p>}
 {!profile?<section className="ls-work-card" style={{maxWidth:750}}><h2>Complete your staff registration</h2><p className="ls-work-small">Your email is confirmed. The requested title is reviewed separately; this form cannot grant management access.</p><form onSubmit={onboard} style={{display:'grid',gap:12}}>
  <label>Username<input required value={username} onChange={e=>setUsername(e.target.value)} style={inputStyle}/></label>
  <label>Age at registration<input required type="number" min={18} max={120} value={age} onChange={e=>setAge(e.target.value)} style={inputStyle}/></label>
  <label>Gender<select value={gender} onChange={e=>setGender(e.target.value)} style={inputStyle}><option value="prefer_not_to_say">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option></select></label>
  <label>Requested role<input required readOnly value={wanted.replaceAll('_',' ')} style={inputStyle}/></label>
  <button type="submit" disabled={busy} style={buttonStyle}>Create my staff profile</button></form>
 </section>:<>
 <div className="ls-work-layout">
 <section className="ls-work-card ls-id-only"><p style={{fontWeight:900,color:'#db7015',fontSize:12}}>LANDSHOP · STAFF IDENTITY</p>
  <h2>{profile.username}</h2><p style={{fontSize:13}}>Role: <strong>{(role||profile.requested_role).replaceAll('_',' ')}</strong></p>
  <p style={{fontSize:13}}>KYC: <strong>{profile.kyc_state.toUpperCase()}</strong> · Employment: {profile.employment_state}</p>
  {image&&<img src={image} width={120} height={138} alt="Private, time-limited staff portrait" style={{objectFit:'cover',borderRadius:12}}/>}
  {verified&&profile.staff_number?<div style={{marginTop:12,padding:17,border:'1px solid #bedcc8',borderRadius:12,background:'#effaf3'}}><strong>LANDSHOP EMPLOYEE ID CARD</strong><p style={{fontSize:22,fontWeight:800}}>{profile.staff_number}</p><p>Staff: {profile.username}</p><p>Authorized role: {(role||'staff').replaceAll('_',' ')}</p><small>Digitally issued after manual identity review. Verify current employment status with management.</small><button type="button" className="ls-work-no-print" onClick={()=>window.print()} style={{...buttonStyle,display:'block',marginTop:15}}>Print staff ID</button></div>:<p className="ls-work-small">A printable staff ID is issued only after photo KYC and management approval.</p>}
  {profile.kyc_state!=='approved'&&<label style={{display:'grid',gap:8,marginTop:18,fontSize:13}}>Upload your passport-style portrait (private, maximum 5MB)<input aria-label="Upload staff KYC portrait" accept="image/jpeg,image/png,image/webp" type="file" onChange={e=>void upload(e.target.files?.[0]||null)} disabled={busy}/></label>}
 </section>
 <section className="ls-work-card"><h2>Clock in / out</h2><p className="ls-work-small">Your browser asks for location only when you press Clock In or Clock Out. Your coordinates, accuracy, server time and verified office match are saved to your private attendance history.</p>
  <div className="ls-work-actions"><button type="button" disabled={busy||!verified} onClick={()=>clock('clock_in')} style={buttonStyle}>Clock In</button><button type="button" disabled={busy||!verified} onClick={()=>clock('clock_out')} style={{...buttonStyle,background:'#245946'}}>Clock Out</button></div>
  <h3 style={{marginTop:22}}>Recent attendance</h3>
  {attendance.slice(0,8).map(a=><div key={a.id} style={{padding:'9px 0',borderBottom:'1px solid #e2eee6',fontSize:12}}>
   <strong>{a.action==='clock_in'?'IN':'OUT'} · {new Date(a.occurred_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'})} WAT</strong>
   <p style={{margin:'5px 0'}}>{a.place} · GPS accuracy ±{a.accuracy_m}m</p>
   {a.latitude!=null&&<a href={'https://www.google.com/maps/search/?api=1&query='+a.latitude+','+a.longitude} target="_blank" rel="noopener noreferrer" style={{color:'#0a8260'}}>View recorded GPS pin on Maps ↗</a>}
  </div>)}
  {!attendance.length&&<p className="ls-work-small">No attendance records for this staff account yet.</p>}
 </section>
 <section className="ls-work-card"><h2>My performance</h2><label className="ls-work-small">Reporting period <select style={inputStyle} value={period} onChange={e=>setPeriod(e.target.value)}><option value="day">Today</option><option value="week">This week</option><option value="month">This month</option><option value="year">This year</option></select></label>
  <p style={{fontSize:42,fontWeight:900,margin:'20px 0 2px',color:'#267f5a'}}>{report?.score_percent==null?'—':report.score_percent+'%'}</p>
  <p className="ls-work-small">Weighted quality score on independently reviewed tasks</p>
  <p>Assigned: <strong>{report?.assigned_tasks??0}</strong> · Scored: <strong>{report?.reviewed_tasks??0}</strong></p>
  <p>Planned: <strong>{report?.planned_minutes??0} min</strong> · Tracked work: <strong>{report?.tracked_work_minutes??0} min</strong></p>
  <p style={{fontSize:13,fontWeight:800,color:'#ce701b'}}>{(report?.recommendation||'Not yet scored').replaceAll('_',' ')}</p>
  <p className="ls-work-small">Scores are advisory. A result below 70% prompts coaching and human review, never an automatic salary deduction. Promotion recommendations also require management approval.</p>
 </section>
 </div>
 <div className="ls-work-layout" style={{marginTop:20}}>
 <section className="ls-work-card"><h2>Assigned tasks</h2>{!verified&&<p className="ls-work-small">Task actions become available after staff verification.</p>}
 {tasks.map(t=><article className="staff-task" key={t.id}>
  <small style={{color:'#cb741c',fontWeight:850}}>{t.status.toUpperCase()}</small><h3>{t.title}</h3><p>{t.details}</p>
  <p>Deadline: {new Date(t.due_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'})} WAT</p>
  <p>Manager estimate: {t.planned_minutes||'—'} min · Allowance: {t.delay_allowance_minutes||0} min</p>
  <p>Viewed: {t.viewed_at?new Date(t.viewed_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'}):'Not opened'} · Score: {t.score??'Pending review'}</p>
  {t.review_comment&&<p>Manager feedback: {t.review_comment}</p>}
  {verified&&<div className="ls-work-actions">
   {!t.viewed_at&&<button disabled={busy} style={buttonStyle} onClick={()=>action(t.id,'view')}>Mark Viewed</button>}
   {['assigned','returned','blocked','in_progress'].includes(t.status)&&<><button disabled={busy} style={buttonStyle} onClick={()=>action(t.id,'start')}>Start Timer</button><button disabled={busy} style={{...buttonStyle,background:'#526857'}} onClick={()=>action(t.id,'pause')}>Pause</button><button disabled={busy} style={{...buttonStyle,background:'#d57819'}} onClick={()=>setSelected(t.id===selected?'':t.id)}>Report / Submit</button></>}
  </div>}
  {selected===t.id&&<div style={{display:'grid',gap:9,marginTop:12}}><textarea rows={3} placeholder="Work completed, any blockers, and reason for delays" style={inputStyle} value={taskNote} onChange={e=>setTaskNote(e.target.value)}/><div className="ls-work-actions"><button style={buttonStyle} disabled={busy} onClick={()=>action(t.id,'submit',taskNote)}>Submit work</button><button style={{...buttonStyle,background:'#c78122'}} disabled={busy} onClick={()=>action(t.id,'blocked',taskNote)}>Flag blocker</button></div></div>}
 </article>)}
 {!tasks.length&&<p className="ls-work-small">No assignments yet. Your manager will enter tasks and expected completion times here.</p>}
 </section>
 <section className="ls-work-card"><h2>My daily routine</h2><p className="ls-work-small">Report actual activity and blockers. The date uses Lagos local time, and changes are audit logged.</p>
  <form onSubmit={sendDaily} style={{display:'grid',gap:13}}>
  <label>Today's work summary<textarea required minLength={20} rows={7} value={daily} onChange={e=>setDaily(e.target.value)} style={inputStyle} placeholder="Describe tasks handled, results delivered and time-sensitive activities"/></label>
  <label>Delays / dependencies<textarea rows={4} value={blockers} onChange={e=>setBlockers(e.target.value)} style={inputStyle} placeholder="Anything that delayed a task, instructions awaited, approvals needed"/></label>
  <button disabled={busy||!verified} style={buttonStyle}>Submit daily report</button>
  </form>
 </section>
 </div></>}
 </div></main>;
}
