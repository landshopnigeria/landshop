'use client';
import BrandedSelect from '../../components/BrandedSelect';

import {useEffect,useState,type FormEvent,type ReactNode} from 'react';
import Link from 'next/link';
import StaffAuthShell from './StaffAuthShell';
import StaffFaceCapture from './StaffFaceCapture';
import './staff-dashboard.css';
import {createBrowserClient} from '@supabase/ssr';
type Profile={user_id:string;organization_id:string;username:string;requested_role:string;age_at_registration:number;gender:string;kyc_state:string;employment_state:string;photo_path:string|null;staff_number:string|null;joined_at:string|null};
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
export default function StaffWorkspace({userId,initialProfile,initialTasks,role,initialVerified,selfServiceAccess,ownerAccess,metadata,userEmail,workPanel,reportPanel}:{workPanel?:ReactNode;reportPanel?:ReactNode;userId:string;initialProfile:Profile|null;initialTasks:Task[];role:string|null;initialVerified:boolean;selfServiceAccess:boolean;ownerAccess:boolean;metadata:Record<string,unknown>;userEmail:string}){
 const [profile,setProfile]=useState(initialProfile),[tasks,setTasks]=useState(initialTasks);
 const [now,setNow]=useState<number>(()=>Date.now());
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),60000);return()=>window.clearInterval(timer)},[]);
 const [approvedRole,setApprovedRole]=useState<string|null>(role);
 const [verifiedAccess,setVerifiedAccess]=useState(initialVerified);
 const [ownerActive,setOwnerActive]=useState(ownerAccess);
 const [username,setUsername]=useState(typeof metadata.preferred_username==='string'?metadata.preferred_username:'');
 const [age,setAge]=useState(typeof metadata.age_at_registration==='number'?String(metadata.age_at_registration):'');
 const [gender,setGender]=useState(typeof metadata.gender==='string'?metadata.gender:'prefer_not_to_say');
 const [wanted,setWanted]=useState(typeof metadata.requested_role==='string'?metadata.requested_role:'staff');
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[image,setImage]=useState<string|null>(null);
 const [attendance,setAttendance]=useState<Attendance[]>([]),[report,setReport]=useState<Report|null>(null),[period,setPeriod]=useState('month');
 const [activeTab,setActiveTab]=useState('dashboard'),[collapsed,setCollapsed]=useState(false),[mobileNav,setMobileNav]=useState(false),[search,setSearch]=useState(''),[notifyOpen,setNotifyOpen]=useState(false),[profileOpen,setProfileOpen]=useState(false);
 const [scoreSet,setScoreSet]=useState<Record<string,Report|null>>({day:null,week:null,month:null,year:null});
 const [daily,setDaily]=useState(''),[blockers,setBlockers]=useState(''),[selected,setSelected]=useState(''),[taskNote,setTaskNote]=useState(''),[opened,setOpened]=useState('');
 // Email-confirmed staff can access their personal dashboard immediately.
 // Tasks, attendance and management still require verified employee access.
 const verified=Boolean(verifiedAccess&&approvedRole&&profile?.employment_state==='active'&&profile?.kyc_state==='approved');
 const dashboardActive=ownerActive||verified||(selfServiceAccess&&Boolean(profile));
 const management=ownerActive||(verified&&['ceo','founder','admin','technology_officer','technology_consultant'].includes(approvedRole||''));
 const supervisor=ownerActive||(verified&&(management||['hr_officer','head_finance','social_media_manager','customer_service_manager','department_manager','operations','hr','finance'].includes(approvedRole||'')));
 function notify(err:unknown){setMessage(err instanceof Error?err.message:'Unable to save changes')}
 async function refresh(){
  try{
   const db=browser();
   const [{data:p,error:pError},{data:allowed,error:workError}]=await Promise.all([
    db.from('landshop_staff_profiles').select('*').eq('user_id',userId).maybeSingle(),
    db.rpc('landshop_staff_can_work',{p_user:userId})
   ]);
   if(pError)throw Error(pError.message);
   const latest=(p||null) as Profile|null;
   setProfile(latest);
   const permitted=workError==null&&allowed===true&&latest?.kyc_state==='approved'&&latest?.employment_state==='active';
   const {data:membership}=permitted&&latest?await db.from('organization_members').select('role')
    .eq('organization_id',latest.organization_id).eq('user_id',userId)
    .eq('status','active').limit(1).maybeSingle():{data:null};
   setApprovedRole(membership?.role||null);
   setVerifiedAccess(Boolean(permitted&&membership?.role));
   // Owner membership is separate from employee KYC and must be rechecked.
   const {data:ownerMember}=await db.from('organization_members').select('organization_id')
    .eq('user_id',userId).eq('status','active').eq('role','owner').limit(1).maybeSingle();
   if(ownerMember){
    const [{data:org},{data:manager,error:ownerCheckError}]=await Promise.all([
     db.from('organizations').select('id').eq('id',ownerMember.organization_id).eq('kind','landshop').maybeSingle(),
     db.rpc('landshop_is_management',{p_user:userId})
    ]);
    setOwnerActive(Boolean(org&&ownerCheckError==null&&manager===true));
   }else setOwnerActive(false);
   if(!permitted||!membership?.role){
    setTasks([]);
    setAttendance([]);
    setScoreSet({day:null,week:null,month:null,year:null});
    setReport(null);
   }else{
    const [{data:t},a,...results]=await Promise.all([
     db.from('staff_tasks').select('id,title,details,status,starts_at,due_at,planned_minutes,delay_allowance_minutes,viewed_at,started_at,submitted_at,score,review_comment,assigned_by').eq('assignee_id',userId).order('created_at',{ascending:false}).limit(100),
     db.rpc('landshop_attendance_history',{p_user:userId}),
     ...(['day','week','month','year'] as const).map(p=>db.rpc('landshop_staff_performance',{p_staff:userId,p_period:p}))
    ]);
    setTasks((t||[]) as Task[]);
    if(!a.error&&Array.isArray(a.data))setAttendance(a.data as Attendance[]);
    const nextScores:Record<string,Report|null>={};
    (['day','week','month','year'] as const).forEach((key,i)=>{nextScores[key]=results[i].error?null:(results[i].data as Report|null)});
    setScoreSet(nextScores);setReport(nextScores[period]);
   }
   if(latest?.photo_path){
    const result=await db.storage.from('landshop-staff-private').createSignedUrl(latest.photo_path,600);
    setImage(result.data?.signedUrl||null);
   }else setImage(null);
  }catch(e){notify(e)}
 }
 useEffect(()=>{if(profile)void refresh()},[period]);
 async function onboard(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  try{const {error}=await browser().rpc('landshop_staff_onboard',{p_username:username.trim().toLowerCase(),p_age:Number(age),p_gender:gender,p_requested_role:wanted});
   if(error)throw Error(error.message);window.location.assign('/staff');
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
   setMessage('Your photograph was submitted privately. Your staff dashboard remains active. Identity approval and restricted work privileges require separate verification.');
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
 const view=(item:string)=>activeTab==='dashboard'||activeTab==='overview'||activeTab===item;
 const go=(item:string)=>{setActiveTab(item);setMobileNav(false);setNotifyOpen(false)};
 const unviewed=tasks.filter(t=>!t.viewed_at&&t.status==='assigned').length;
 const filteredTasks=tasks.filter(t=>(t.title+' '+(t.details||'')).toLowerCase().includes(search.toLowerCase()));
 const roleLabel=(ownerActive?'Company Owner':verified?(approvedRole||'staff'):'Staff account · '+(profile?.requested_role||wanted)+' requested').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
 const kycLabel=(profile?.kyc_state||'not_started').replaceAll('_',' ');
 const todayAttendance=attendance.filter(a=>new Date(a.occurred_at).toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'})===new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'}));
 const lastClock=attendance[0];
 const monthlyClockDays=new Set(attendance.filter(a=>a.action==='clock_in'&&new Date(a.occurred_at).toLocaleString('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit'})===new Date(now).toLocaleString('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit'})).map(a=>new Date(a.occurred_at).toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'}))).size;
 // Today's duty time must include the overlap of shifts that started before midnight.
 // Africa/Lagos (WAT) remains UTC+01:00 year-round. Never invent an end time.
 const localNow=new Date(now+3600000);
 const todayStart=Date.UTC(localNow.getUTCFullYear(),localNow.getUTCMonth(),localNow.getUTCDate())-3600000;
 const clockTimeline=[...attendance].sort((a,b)=>new Date(a.occurred_at).getTime()-new Date(b.occurred_at).getTime());
 let sessionStart:number|null=null,dutyMs=0;
 for(const event of clockTimeline){
  const stamp=new Date(event.occurred_at).getTime();
  if(!Number.isFinite(stamp)||stamp>now)continue;
  if(event.action==='clock_in'&&sessionStart===null)sessionStart=stamp;
  if(event.action==='clock_out'&&sessionStart!==null){
   dutyMs+=Math.max(0,stamp-Math.max(sessionStart,todayStart));
   sessionStart=null;
  }
 }
 if(sessionStart!==null)dutyMs+=Math.max(0,now-Math.max(sessionStart,todayStart));
 const dutyHours=Math.floor(dutyMs/3600000)+'h '+String(Math.floor((dutyMs%3600000)/60000)).padStart(2,'0')+'m';


 const nav=[['dashboard','Dashboard','home'],['overview','Overview','bar-chart'],['profile','My Profile','user'],['attendance','Attendance','clock'],['tasks','Tasks','clipboard'],['daily','Reports','file'],['performance','Performance','trending']] as const;
 const circle=(label:string,key:string,color:string)=>{
  const item=scoreSet[key];const valid=typeof item?.score_percent==='number'&&Number.isFinite(item.score_percent);const value=valid?Math.min(100,Math.max(0,Number(item?.score_percent))):0;
  return <div className="ls25-score" key={key} aria-label={valid?label+' '+value.toFixed(0)+' percent':label+' not yet scored'}>
   <span className="ls25-score-label">{label}</span>
   <div className="ls25-score-ring" style={{background:'conic-gradient('+color+' '+value+'%, #e8f2ed '+value+'% 100%)'}}>
    <div className="ls25-score-middle"><strong>{valid?Math.round(value):'—'}</strong><small>/ 100</small></div>
   </div>
   <span className="ls25-score-foot">{item?.reviewed_tasks||0} reviewed tasks</span>
  </div>;
 };
 const profileCard=<section id="staff-profile" className="ls25-card ls25-profile">
  <div className="ls25-card-head"><h2><StaffGlyph name="user" accent/> My Profile</h2><button className="ls25-text-link" type="button" onClick={()=>go('profile')}>View Profile <span aria-hidden>→</span></button></div>
  <div className="ls25-identity">
   <div className="ls25-avatar-large">{image?<img src={image} alt="Your submitted staff portrait"/>:<StaffGlyph name="user" size={58}/>}</div>
   <div className="ls25-identity-text"><strong>{profile?.username||username||'New staff member'}</strong><span>{roleLabel}</span><small><StaffGlyph name="mail" size={16}/> {userEmail}</small>
   <small><StaffGlyph name="pin" size={16}/> {profile?.employment_state==='active'?'Landshop employee':'Location not provided'}</small></div>
  </div>
  <div className="ls25-profile-bottom"><div><span>Staff ID</span><strong>{profile?.staff_number||'—'}</strong></div><div><span>KYC Status</span><b className="ls25-pill">{kycLabel}</b></div></div>
  {!profile&&<form onSubmit={onboard} className="ls25-mini-form"><h3>{wanted==='owner'?'Complete your owner registration':'Complete your staff registration'}</h3>
   <label>Username<input required minLength={3} value={username} onChange={e=>setUsername(e.target.value)}/></label>
   <div className="ls25-dual"><label>Age at registration<input required min={18} max={120} type="number" value={age} onChange={e=>setAge(e.target.value)}/></label>
   <label>Gender<BrandedSelect value={gender} onChange={e=>setGender(e.target.value)}><option value="prefer_not_to_say">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option></BrandedSelect></label></div>
   <label>Requested role<input readOnly value={wanted.replaceAll('_',' ')}/></label><button className="ls25-action" disabled={busy}>Finish staff registration</button></form>}
  {profile&&profile.kyc_state!=='approved'&&<div className="ls25-kyc"><p>Your personal staff workspace is already active. Submit a private portrait through any of the three supported methods. Restricted privileges and an official staff ID require genuine identity verification.</p>
   <StaffFaceCapture busy={busy} status={profile.kyc_state} onSubmit={upload}/></div>}
  {verified&&profile?.staff_number&&<div className="ls25-staff-id"><div className="ls25-id-heading"><img src="/media/logo-transparent.png" alt="Landshop original logo" onError={e=>{e.currentTarget.src='/media/logo.webp'}}/> <strong>Employee ID</strong></div><p>{profile.staff_number}</p><small>{profile.username} · {roleLabel}</small><button type="button" className="ls25-text-link" onClick={()=>window.print()}>Print employee ID <span>↗</span></button></div>}
 </section>;
 const attendanceCard=<section id="staff-attendance" className="ls25-card ls25-attendance">
  <div className="ls25-card-head"><h2><StaffGlyph name="clock" accent/> Clock In / Out</h2><button type="button" className="ls25-text-link" onClick={()=>go('attendance')}>View History <span>→</span></button></div>
  <div className="ls25-info"><StaffGlyph name="info" size={21}/><span>Your GPS is requested only when you clock in or out. The location, device accuracy and server time are saved in your private attendance history.</span></div>
  <div className="ls25-attendance-actions"><button type="button" disabled={busy||!verified} className="ls25-action" onClick={()=>clock('clock_in')}><StaffGlyph name="play" size={19}/> Clock In</button>
  <button type="button" disabled={busy||!verified} className="ls25-action ls25-out" onClick={()=>clock('clock_out')}><StaffGlyph name="stop" size={17}/> Clock Out</button></div>
  <div className="ls26-attendance-summary" aria-live="polite"><div><small>Today's Hours</small><strong>{dutyHours}</strong><span>Recorded duty events</span></div><div><small>Present this month</small><strong>{monthlyClockDays}</strong><span>Days with clock-in</span></div><div><small>Duty status</small><strong>{lastClock?.action==='clock_in'?'On duty':'Off duty'}</strong><span>Server-recorded activity</span></div></div>
  <h3 className="ls25-section-subhead"><StaffGlyph name="calendar" accent size={21}/> Today's Attendance</h3>
  <div className="ls25-attendance-today"><span className="ls25-clock-mark"><StaffGlyph name="clock" size={25}/></span><div><strong>{lastClock?.action==='clock_in'?'Clocked in':lastClock?.action==='clock_out'?'Clocked out':'Not clocked in yet'}</strong><p>{todayAttendance.length?todayAttendance.length+' attendance events recorded today':'Your attendance for today will appear here.'}</p></div></div>
  {activeTab==='attendance'&&<div className="ls25-history">
   <h3>Recent clock events</h3>{attendance.length===0?<p>No attendance records yet.</p>:attendance.map(a=><div className="ls25-event" key={a.id}><strong>{a.action.replace('_',' ').toUpperCase()}</strong><span>{new Date(a.occurred_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'})} WAT</span><small>{a.place} · Accuracy ±{a.accuracy_m}m</small><a target="_blank" rel="noopener noreferrer" href={'https://www.google.com/maps/search/?api=1&query='+a.latitude+','+a.longitude}>View GPS map <span>↗</span></a></div>)}
  </div>}
 </section>;
 const performanceCard=<section id="staff-performance" className="ls25-card ls25-performance">
  <div className="ls25-card-head"><h2><StaffGlyph name="trending" accent/> My Performance</h2><BrandedSelect aria-label="Reporting period" value={period} onChange={e=>setPeriod(e.target.value)}><option value="day">Today</option><option value="week">This week</option><option value="month">This month</option><option value="year">This year</option></BrandedSelect></div>
  <div className="ls25-rings">{circle('Daily Score','day','#12a877')}{circle('Weekly Score','week','#12a877')}{circle('Monthly Score','month','#12a877')}{circle('Yearly Score','year','#f26b10')}</div>
  <p className="ls25-disclaimer">Scores are calculated from actual reviewed tasks. No tasks scored means no score—not zero. Low scores prompt coaching review, never automatic salary deductions.</p>
  {activeTab==='performance'&&<div className="ls25-performance-details"><strong>{(report?.recommendation||'insufficient_reviewed_tasks').replaceAll('_',' ')}</strong><div>Assigned: {report?.assigned_tasks||0} · Reviewed: {report?.reviewed_tasks||0}</div><div>Planned: {report?.planned_minutes||0} min · Tracked: {report?.tracked_work_minutes||0} min</div></div>}
 </section>;
 const taskCard=<section id="staff-tasks" className="ls25-card ls25-tasks">
  <div className="ls25-card-head"><h2><StaffGlyph name="clipboard" accent/> Assigned Tasks</h2><button className="ls25-text-link" type="button" onClick={()=>go('tasks')}>View All <span>→</span></button></div>
  {filteredTasks.length===0?<div className="ls25-empty-tasks"><span className="ls25-empty-icon"><StaffGlyph name="clipboard" size={36}/></span><strong>{search?'No matching assignments':'No assignments yet'}</strong><p>{verified?'Your manager will enter tasks and expected completion times here.':'Task actions become available after staff verification.'}</p></div>:<div className="ls25-task-list">{filteredTasks.slice(0,activeTab==='dashboard'?4:100).map(t=><article className="ls25-task" key={t.id}>
   <div className="ls25-task-title"><strong>{t.title}</strong><span>{t.status.replaceAll('_',' ')}</span></div>
   <button className="ls25-text-link" type="button" disabled={busy} onClick={()=>{setOpened(opened===t.id?'':t.id);if(opened!==t.id&&!t.viewed_at&&verified)void action(t.id,'view')}}>{opened===t.id?'Close details':'Open assignment →'}</button>
   {opened===t.id&&<div className="ls25-task-body"><p>{t.details}</p><p>Due: {new Date(t.due_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'})} WAT · Planned: {t.planned_minutes||0} min · Delay: {t.delay_allowance_minutes||0} min</p>
   <p>First viewed: {t.viewed_at?new Date(t.viewed_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'}):'Not yet'} · Score: {t.score??'Pending'}</p>{t.review_comment&&<p>Manager feedback: {t.review_comment}</p>}
   {verified&&['assigned','in_progress','returned','blocked'].includes(t.status)&&<div className="ls25-small-actions"><button disabled={busy} onClick={()=>action(t.id,'start')}>Start</button><button disabled={busy} onClick={()=>action(t.id,'pause')}>Pause</button><button disabled={busy} onClick={()=>setSelected(selected===t.id?'':t.id)}>Report / Submit</button></div>}
   {selected===t.id&&<div className="ls25-task-submit"><textarea rows={3} value={taskNote} onChange={e=>setTaskNote(e.target.value)} placeholder="Describe completed work or the blocker"/><div className="ls25-small-actions"><button disabled={busy} onClick={()=>action(t.id,'submit',taskNote)}>Submit work</button><button disabled={busy} onClick={()=>action(t.id,'blocked',taskNote)}>Flag blocker</button></div></div>}
   </div>}</article>)}</div>}
 </section>;
 const dailyCard=<section id="staff-daily" className="ls25-card ls25-daily">
  <div className="ls25-card-head"><h2><StaffGlyph name="file" accent/> My Daily Routine</h2><button type="submit" form="landshop-daily-form" className="ls25-save" disabled={busy||!verified||daily.trim().length<20}>Save Update</button></div>
  <form id="landshop-daily-form" onSubmit={sendDaily} className="ls25-daily-form">
  <label><span><StaffGlyph name="sun" size={19} color="#f58a0b"/> Today's work summary</span><textarea required minLength={20} maxLength={6000} value={daily} onChange={e=>setDaily(e.target.value)} placeholder="Describe tasks handled, results delivered and time-sensitive activities..."/><small>{daily.length}/6000</small></label>
  <label><span><StaffGlyph name="clock" size={19} color="#287eea"/> Delays / dependencies</span><textarea maxLength={3000} value={blockers} onChange={e=>setBlockers(e.target.value)} placeholder="Anything that delayed a task, instructions awaited, approvals needed..."/><small>{blockers.length}/3000</small></label></form>
  {!verified&&<p className="ls25-disclaimer">Submitting daily activity reports requires an approved employee identity.</p>}
 </section>;
 const menuName:Record<string,string>={dashboard:'Staff Dashboard',overview:'Work Overview',profile:'My Profile',attendance:'Attendance',tasks:'Assigned Tasks',daily:'Work Reports',performance:'My Performance'};
 // Until both identity verification and an active Landshop membership are present,
 // show only onboarding and approval status—not the employee command dashboard.
 if(!dashboardActive)return <StaffAuthShell><section className="ls25-applicant" aria-labelledby="staff-onboarding-title">
  <div className="ls25-applicant-heading"><p>LANDSHOP STAFF PORTAL</p>
   <h1 id="staff-onboarding-title">{(profile?.requested_role||wanted)==='owner'?'Owner':'Staff'} <span>registration</span></h1>
   <p>{!profile?'Complete your registration to request '+(wanted==='owner'?'company ownership':'staff access')+'.':
      profile.kyc_state==='submitted'&&profile.requested_role==='owner'?'Your owner identity request is submitted. Independent company authorization is required before Command Center access.':
      profile.kyc_state==='submitted'?'Your portrait was submitted. Management verification is pending.':
      profile.kyc_state==='rejected'?'Your identity review needs attention. Submit a new portrait for reassessment.':
      profile.employment_state==='suspended'?'Your staff access is currently suspended. Contact management.':
      'Complete identity verification before your staff access can be approved.'}</p></div>
  {message&&<div role="status" aria-live="polite" className="ls25-applicant-message">{message}</div>}
  {profileCard}
  <div className="ls25-applicant-actions">
   <button type="button" disabled={busy} onClick={()=>void refresh()}>Check approval status</button>
   <button type="button" disabled={busy} onClick={signOut}>Sign Out</button>
  </div>
  <p className="ls25-applicant-footer">No staff ID, attendance, tasks, reports or management privileges are available until approval.</p>
 </section></StaffAuthShell>;
 return <div className={'ls25-shell'+(collapsed?' ls25-collapsed':'')}>
  {mobileNav&&<button className="ls25-screen-overlay" type="button" aria-label="Close staff navigation" onClick={()=>setMobileNav(false)}/>}
  <aside className={'ls25-sidebar'+(mobileNav?' ls25-sidebar-open':'')} aria-label="Staff dashboard navigation">
   <div className="ls25-logo-row"><Link href="/staff" className="ls25-logo" aria-label="Landshop staff dashboard" onClick={()=>go('dashboard')}>
    <img src="/media/logo-transparent.png" alt="Landshop original logo: Develop, Incubate, Grow" onError={e=>{e.currentTarget.src='/media/logo.webp'}}/>
   </Link><button type="button" className="ls25-collapse-button" aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} aria-expanded={!collapsed} onClick={()=>setCollapsed(x=>!x)}><StaffGlyph name="menu"/></button></div>
   <nav className="ls25-nav" aria-label="Staff and owner navigation">{nav.map(([id,label,icon])=><button key={id} className={'ls25-navitem'+(activeTab===id?' active':'')} type="button" title={label} aria-current={activeTab===id?'page':undefined} onClick={()=>go(id)}><StaffGlyph name={icon} size={22}/><span>{label}</span></button>)}{(verified||ownerActive)&&<Link href="/admin/properties/project-media" className="ls25-navitem" title="Submit original project photos" onClick={()=>setMobileNav(false)}><StaffGlyph name="file" size={22}/><span>Project Photo Evidence</span></Link>}{supervisor&&<Link href="/staff/inbox" className="ls25-navitem" title="Review reports routed to your role" onClick={()=>setMobileNav(false)}><StaffGlyph name="file" size={22}/><span>Reports Inbox</span></Link>}{ownerActive&&<Link href="/admin" className="ls25-navitem ls25-owner-nav" title="Open Global Command Center" onClick={()=>setMobileNav(false)}><StaffGlyph name="briefcase" size={22}/><span>Global Command Center</span></Link>}</nav>
   <div className="ls25-sidefooter">{supervisor&&<Link href="/staff/team" title="Manage team tasks"><StaffGlyph name="clipboard"/><span>Manage Team</span></Link>}{management&&<Link href="/admin" title="Global Command Center"><StaffGlyph name="briefcase"/><span>Command Center</span></Link>}
   <button type="button" title="Log Out" onClick={signOut}><StaffGlyph name="log-out"/><span>Log Out</span></button></div>
   <div aria-hidden="true" className="ls25-deco"/>
  </aside>
  <div className="ls25-main">
   <header className="ls25-topbar"><div className="ls25-title-row"><button className="ls25-mobile-toggle" type="button" aria-label="Open staff navigation" onClick={()=>setMobileNav(x=>!x)}><StaffGlyph name="menu"/></button><div><h1>{menuName[activeTab]||'Staff Dashboard'}</h1><p>Welcome back! Here's your work overview at Landshop.</p></div></div>
    <div className="ls25-top-controls"><label className="ls25-search"><StaffGlyph name="search" size={19}/><input type="search" placeholder="Search assignments..." value={search} onChange={e=>{setSearch(e.target.value);if(e.target.value)setActiveTab('tasks')}} aria-label="Search assigned tasks"/></label>
     <div className="ls25-popover-anchor"><button type="button" className="ls25-icon-button" aria-label="Task notifications" aria-expanded={notifyOpen} onClick={()=>setNotifyOpen(x=>!x)}><StaffGlyph name="bell"/>{unviewed>0&&<i className="ls25-notification-dot"/>}</button>
     {notifyOpen&&<div className="ls25-dropdown"><strong>Task notifications</strong><p>{unviewed?unviewed+' unviewed assignments':'No new assignment notifications'}</p><button className="ls25-text-link" onClick={()=>go('tasks')}>Open tasks →</button></div>}</div>
     <div className="ls25-popover-anchor"><button type="button" className="ls25-account" onClick={()=>setProfileOpen(x=>!x)} aria-expanded={profileOpen}><div className="ls25-small-avatar">{image?<img src={image} alt="Your profile"/>:<StaffGlyph name="user"/>}</div><span><strong>{profile?.username||username||'Landshop staff'}</strong><small>{roleLabel}</small></span><StaffGlyph name="chevron-down" size={17}/></button>
     {profileOpen&&<div className="ls25-dropdown ls25-account-menu"><button type="button" onClick={()=>{go('profile');setProfileOpen(false)}}>My Profile</button><button type="button" onClick={signOut}>Log Out</button></div>}</div>
    </div>
   </header>
   <main className="ls25-content">
    {message&&<div role="status" aria-live="polite" className="ls25-toast">{message}<button type="button" aria-label="Dismiss notice" onClick={()=>setMessage('')}>×</button></div>}
    {ownerActive&&<section className="ls25-owner-access" aria-labelledby="owner-command-title"><div className="ls25-owner-access-icon"><StaffGlyph name="briefcase" size={29}/></div><div className="ls25-owner-access-copy"><p>VERIFIED LANDSHOP OWNER</p><h2 id="owner-command-title">Your Global Command Center</h2><span>Manage properties, people, customers, applications, approvals, automation, operations and reports.</span></div><Link href="/admin" className="ls25-owner-access-cta">Open Global Command Center <span aria-hidden="true">↗</span></Link></section>}
    {!verified&&!ownerActive&&<div className="ls25-account-active" role="status"><StaffGlyph name="shield" size={22}/><div><strong>Staff dashboard activated automatically</strong><p>Email confirmation gives immediate dashboard access. Internal task execution, attendance, employee ID and management functions require separate company authorization.</p></div></div>}
    {(activeTab==='dashboard'||activeTab==='overview')&&<section className="ls26-welcome ls26-staff-welcome">
      <div><small>LANDSHOP STAFF PORTAL</small><h2>Good day, {profile?.username||username||'team member'}</h2><p>Manage your work, attendance, reports and performance at a glance.</p><span className="ls26-pill">{verified?'Verified staff access':'Personal dashboard active'}</span></div>
    </section>}
    {(activeTab==='dashboard'||activeTab==='overview')&&<div className="ls25-stats">
     <div className="ls25-stat"><span className="ls25-stat-icon green"><StaffGlyph name="user" size={27}/></span><div><small>Your Role</small><strong>{roleLabel}</strong></div></div>
     <div className="ls25-stat"><span className="ls25-stat-icon orange"><StaffGlyph name="shield" size={27}/></span><div><small>KYC Status</small><strong>{kycLabel}</strong><small>Employment: {profile?.employment_state||'Pending'}</small></div></div>
     <div className="ls25-stat"><span className="ls25-stat-icon blue"><StaffGlyph name="briefcase" size={27}/></span><div><small>Dashboard Access</small><strong>{dashboardActive?'Active':'Unavailable'}</strong><small>Employment: {profile?.employment_state||'Not assigned'}</small></div></div>
     <div className="ls25-stat"><span className="ls25-stat-icon purple"><StaffGlyph name="clipboard" size={27}/></span><div><small>Assigned Tasks</small><strong>{tasks.length}</strong><small>Tasks assigned</small></div></div>
     <div className="ls25-stat"><span className="ls25-stat-icon green"><StaffGlyph name="clock" size={27}/></span><div><small>Attendance Status</small><strong>{lastClock?.action==='clock_in'?'Clocked in':'Not clocked in'}</strong><small>{new Date().toLocaleDateString('en-NG',{timeZone:'Africa/Lagos',dateStyle:'medium'})}</small></div></div>
    </div>}
    {(activeTab==='dashboard'||activeTab==='overview')&&<>
      <div className="ls26-staff-overview-grid">{performanceCard}{attendanceCard}</div>
      <section className="ls26-kpi-strip"><div className="ls26-panel-heading"><h2>KPI Summary</h2><button type="button" onClick={()=>go('performance')}>View performance <span aria-hidden="true">→</span></button></div>
       <div className="ls26-kpis">
        <div><strong>{tasks.filter(t=>['reviewed','completed','accepted'].includes(t.status)).length}</strong><span>Tasks completed</span></div>
        <div><strong>{tasks.filter(t=>['assigned','returned','in_progress'].includes(t.status)).length}</strong><span>Open tasks</span></div>
        <div><strong>{attendance.filter(a=>a.action==='clock_in').length}</strong><span>Recorded clock-ins</span></div>
        <div><strong>{typeof scoreSet.month?.score_percent==='number'?Math.round(scoreSet.month.score_percent)+'%':'—'}</strong><span>Monthly reviewed score</span></div>
       </div>
      </section>
      <div className="ls26-staff-lower">
       <section className="ls26-panel ls26-report-panel"><div className="ls26-panel-heading"><h3>Reports</h3></div>
        <button type="button" onClick={()=>go('daily')}>▤ Daily Report <span aria-hidden="true">→</span></button>
        <button type="button" onClick={()=>go('daily')}>▥ Weekly / Monthly Report <span aria-hidden="true">→</span></button>
        <button type="button" onClick={()=>go('performance')}>◉ Performance Review <span aria-hidden="true">→</span></button>
       </section>
       {taskCard}
       <section className="ls26-panel ls26-activity-panel"><div className="ls26-panel-heading"><h3>Recent Activity</h3><button type="button" onClick={()=>go('attendance')}>View all <span aria-hidden="true">→</span></button></div>
        {attendance.length?attendance.slice(0,5).map(a=><div className="ls26-activity-item" key={a.id}><span aria-hidden="true">●</span><div><strong>{a.action.replace('_',' ')}</strong><small>{new Date(a.occurred_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'})}</small></div></div>):<p>No attendance actions recorded yet. Submitted reports and task reviews will appear in your workspace as they are processed.</p>}
       </section>
      </div>
    </>}
    {activeTab==='profile'&&profileCard}
    {activeTab==='attendance'&&attendanceCard}
    {activeTab==='performance'&&performanceCard}
    {activeTab==='tasks'&&<>{taskCard}{workPanel}</>}
    {activeTab==='daily'&&<>{dailyCard}{workPanel}{reportPanel}</>}
    <footer className="ls25-footer">© {new Date().getFullYear()} Landshop · Staff workspace · Records are private and audit-controlled</footer>
   </main>
  </div>
 </div>;
}
function StaffGlyph({name,size=22,color,accent=false}:{name:string;size?:number;color?:string;accent?:boolean}){
 const paths:Record<string,React.ReactNode>={
 home:<><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></>,
 'bar-chart':<><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></>,
 user:<><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
 clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
 clipboard:<><rect x="5" y="5" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="5" rx="1"/><path d="m9 14 2 2 4-5"/></>,
 file:<><path d="M6 2h8l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v6h6M8 13h8M8 17h7"/></>,
 trending:<><path d="M3 20V10M9 20V4M15 20v-7M21 20V8"/></>,
 menu:<><path d="M4 6h16M4 12h16M4 18h16"/></>,
 'log-out':<><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M13 8l5 4-5 4M9 12h9"/></>,
 search:<><circle cx="10.8" cy="10.8" r="7.2"/><path d="m16 16 5 5"/></>,
 bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9ZM10 21h4"/></>,
 'chevron-down':<><path d="m6 9 6 6 6-6"/></>,
 mail:<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/></>,
 pin:<><path d="M12 22s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12Z"/><circle cx="12" cy="10" r="2"/></>,
 info:<><circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/></>,
 play:<><path d="m7 4 13 8-13 8Z"/></>,
 stop:<><rect x="5" y="5" width="14" height="14" rx="2"/></>,
 calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
 sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
 shield:<><path d="M12 2 20 6v6c0 5-3 8-8 10-5-2-8-5-8-10V6Z"/><path d="m9 12 2 2 4-5"/></>,
 briefcase:<><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18"/></>
 };
 return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color||'currentColor'} strokeWidth={accent?2.5:1.9} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>{paths[name]||paths.home}</svg>;
}
