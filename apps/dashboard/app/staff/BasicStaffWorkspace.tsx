'use client';
import {useState} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '@supabase/ssr';
import StaffWorkActions from './StaffWorkActions';
import StaffReportHistory from './StaffReportHistory';
import './basic-staff-dashboard.css';
type Task={id:string;title:string;status:string;due_at:string;details:string|null};
type Profile={username:string;kyc_state:string;staff_number:string|null;employment_state:string};
export default function BasicStaffWorkspace({profile,tasks,email,userId}:{profile:Profile;tasks:Task[];email:string;userId:string}){
 const [notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [section,setSection]=useState<'overview'|'kyc'|'tasks'|'reports'|'attendance'>('overview');
 const [sidebarOpen,setSidebarOpen]=useState(false);
 const menu=[['overview','Overview'],['kyc','My Profile & KYC'],['tasks','Tasks'],['reports','Work Reports'],['attendance','Attendance']] as const;
 const navigate=(next:typeof section)=>{setSection(next);setSidebarOpen(false)};
 function client(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw Error('Staff database configuration is missing');
  return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
 }
 async function photo(file:File|null){
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setNotice('Upload a JPEG, PNG or WebP portrait smaller than 5MB.');return}
  setBusy(true);setNotice('');
  try{
   const extension=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
   const path=userId+'/portrait/'+crypto.randomUUID().replaceAll('-','')+'_'+Date.now().toString(36).padEnd(20,'0')+'.'+extension;
   const db=client();
   const {error:uploadError}=await db.storage.from('landshop-staff-private').upload(path,file,{upsert:false,contentType:file.type});
   if(uploadError)throw uploadError;
   const {error}=await db.rpc('landshop_staff_submit_photo',{p_path:path});
   if(error)throw error;
   setNotice('Portrait submitted securely. Management will verify identity separately. Your basic work access remains active.');
  }catch(e){setNotice(e instanceof Error?e.message:'Unable to upload portrait')}finally{setBusy(false)}
 }
 async function signOut(){
  setBusy(true);try{await client().auth.signOut();window.location.replace('/staff/sign-in')}catch(e){setNotice(e instanceof Error?e.message:'Unable to sign out');setBusy(false)}
 }
 return <div className="ls-basic-shell">
  <aside className={'ls-basic-side '+(sidebarOpen?'is-open':'')} aria-label="Staff dashboard sections">
   <div className="ls-basic-brand"><img src="/media/logo.webp" alt="Landshop" /><strong>People & Management</strong><button type="button" aria-label="Close navigation" onClick={()=>setSidebarOpen(false)} className="ls-basic-close">×</button></div>
   <nav>{menu.map(([key,title])=><button type="button" key={key} className={section===key?'active':''} aria-current={section===key?'page':undefined} onClick={()=>navigate(key)}><span className="ls-basic-marker" aria-hidden="true">{key==='overview'?'⌂':key==='kyc'?'♙':key==='tasks'?'☑':key==='reports'?'▤':'◷'}</span>{title}<span aria-hidden="true" className="ls-basic-chevron">›</span></button>)}</nav>
   <p className="ls-basic-side-note">Your personal dashboard is available after email verification. Sensitive operations require their own approvals.</p>
  </aside>
  {sidebarOpen&&<button type="button" className="ls-basic-backdrop" aria-label="Close navigation" onClick={()=>setSidebarOpen(false)}/>}
  <div className="ls-basic-main">
   <header className="ls-basic-top"><button className="ls-basic-menu" type="button" aria-label="Open dashboard navigation" aria-expanded={sidebarOpen} onClick={()=>setSidebarOpen(!sidebarOpen)}>☰</button><div><small>LANDSHOP PEOPLE & MANAGEMENT</small><h1>My Staff Dashboard</h1></div><button className="ls-basic-logout" type="button" disabled={busy} onClick={signOut}>Log Out</button></header>
   <div className="ls-basic-content">
    <div className="ls-basic-section-heading"><div><small>MY WORKSPACE</small><h2>{menu.find(([key])=>key===section)?.[1]}</h2></div><span>Staff access · {profile.employment_state}</span></div>
    {notice&&<p role="status" aria-live="polite" className="ls-basic-message">{notice}</p>}
    {section==='overview'&&<section className="ls26-welcome ls26-staff-welcome"><div><small>MY LANDSHOP WORKSPACE</small><h2>Good day, {profile.username}</h2><p>Your people, performance, attendance and reporting workspace in one place.</p></div></section>}
    {section==='overview'&&<div className="ls26-staff-overview">
      <section className="ls26-panel ls26-score-panel" aria-label="Staff performance scores">
       <div className="ls26-panel-heading"><h3>Performance Scores</h3><span>Manager-reviewed tasks</span></div>
       <div className="ls26-score-grid">{(['Daily','Weekly','Monthly','Yearly'] as const).map(label=><div key={label} className="ls26-score">
        <strong>{label} Score</strong><div className="ls26-ring" role="img" aria-label={label+' score not yet reviewed'}><span>—<small>Not scored</small></span></div>
       </div>)}</div>
       <p className="ls26-note">Scores appear when management reviews your completed tasks. No score is displayed as zero.</p>
      </section>
      <section className="ls26-panel ls26-attendance-panel"><div className="ls26-panel-heading"><h3>Today's Attendance</h3><span className="ls26-pill">Verification required</span></div>
       <div className="ls26-clock-buttons"><button type="button" disabled title="Identity approval required before clock-in">↳ Clock In</button><button type="button" disabled title="Identity approval required before clock-out">↗ Clock Out</button></div>
       <p>Clock-in, clock-out, location consent and attendance history activate when identity verification is approved.</p>
       <button type="button" className="ls26-inline-action" onClick={()=>navigate('kyc')}>Complete identity verification <span aria-hidden="true">→</span></button>
      </section>
      <section className="ls26-panel ls26-kpi-panel"><div className="ls26-panel-heading"><h3>My KPI Summary</h3><span>Live operational records</span></div>
       <div className="ls26-kpis"><div><strong>{tasks.filter(t=>['reviewed','completed','accepted'].includes(t.status)).length}</strong><span>Tasks completed</span></div><div><strong>{tasks.filter(t=>['assigned','returned','in_progress'].includes(t.status)).length}</strong><span>Open tasks</span></div><div><strong>—</strong><span>Attendance rate</span></div><div><strong>—</strong><span>Performance</span></div></div>
      </section>
      <section className="ls26-panel ls26-report-panel"><div className="ls26-panel-heading"><h3>Reports & Activity</h3></div>
       <button type="button" onClick={()=>navigate('reports')}>▤ Daily Report <span aria-hidden="true">→</span></button>
       <button type="button" onClick={()=>navigate('reports')}>▥ Weekly / Monthly Report <span aria-hidden="true">→</span></button>
       <button type="button" onClick={()=>navigate('tasks')}>☑ Assigned Tasks ({tasks.length}) <span aria-hidden="true">→</span></button>
      </section>
    </div>}
    {section==='overview'&&<div className="ls-basic-cards">
      <section className="ls-basic-card"><h3>Welcome, {profile.username}</h3><p>{email}</p><p>Start with your identity profile, then use the sidebar to manage assignments and reports. Only one workspace section stays open at a time.</p><div className="ls-basic-actions"><button onClick={()=>navigate('kyc')}>Complete My KYC <span aria-hidden="true">→</span></button><button onClick={()=>navigate('tasks')}>My Tasks <span aria-hidden="true">→</span></button></div></section>
      <section className="ls-basic-card"><h3>Account status</h3><dl><dt>Email verification</dt><dd>Confirmed</dd><dt>Employment</dt><dd>{profile.employment_state}</dd><dt>Identity review</dt><dd>{profile.kyc_state.replaceAll('_',' ')}</dd><dt>Staff number</dt><dd>{profile.staff_number||'Pending issuance'}</dd></dl></section>
    </div>}
    {section==='kyc'&&<section className="ls-basic-card"><h3>My Profile & Identity Verification</h3><p>Upload your identity portrait securely from your dashboard. Identity approval is completed by authorized reviewers, not automatically by uploading a photograph.</p><div className="ls-basic-cards"><div><strong>{profile.username}</strong><p>{email}</p><p>Staff ID: {profile.staff_number||'Pending'}</p></div><div><label className="ls-basic-file">Identity portrait <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>void photo(e.target.files?.[0]||null)}/></label><p>KYC status: <strong>{profile.kyc_state.replaceAll('_',' ')}</strong></p></div></div></section>}
    {section==='tasks'&&<StaffWorkActions active initialTasks={tasks}/>}
    {section==='reports'&&<><StaffWorkActions active initialTasks={tasks}/><StaffReportHistory userId={userId}/></>}
    {section==='attendance'&&<section className="ls-basic-card"><h3>Staff Attendance</h3><p>Your personal dashboard is active, but GPS-based clock-in and clock-out require verified employee identity and authorized attendance access.</p><p><strong>Identity review:</strong> {profile.kyc_state.replaceAll('_',' ')}</p><button type="button" onClick={()=>navigate('kyc')}>View verification requirements <span aria-hidden="true">→</span></button><p>Once your identity is approved, attendance, history and performance controls become available in your full staff workspace.</p></section>}
    <footer className="ls-basic-footer"><Link href="https://www.landshopnigeria.com">Landshop website <span aria-hidden="true">↗</span></Link><span>© {new Date().getFullYear()} Landshop</span></footer>
   </div>
  </div>
 </div>;
}
