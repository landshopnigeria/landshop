import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
import WorkforcePanel from './WorkforcePanel';
export const dynamic='force-dynamic';
export const metadata={title:'Staff, Attendance & Performance | Landshop Command Center'};
export default async function Workforce(){
 const {db,user}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const [profiles,tasks,member]=await Promise.all([
  db.from('landshop_staff_profiles').select('user_id,username,requested_role,employment_state,kyc_state,photo_path,staff_number,review_note').order('created_at',{ascending:false}).limit(500),
  db.from('staff_tasks').select('id,assignee_id,assigned_by,title,status,due_at,planned_minutes,delay_allowance_minutes,score,assignee_report,review_comment').order('created_at',{ascending:false}).limit(500),
  db.from('organization_members').select('role').eq('user_id',user.id).eq('status','active').limit(1).maybeSingle()
 ]);
 return <main style={{minHeight:'100vh',background:'#f1f9f3',padding:'clamp(18px,4vw,60px)',fontFamily:'Arial,sans-serif',color:'#194734'}}>
  <style>{`.wcard{border:1px solid #d9e9df;background:white;border-radius:18px;padding:clamp(19px,3vw,29px);display:grid;align-content:start;gap:13px;min-width:0}.wcard h2{font-size:22px;margin:3px 0}.wcard label{display:grid;gap:6px;font-size:13px;font-weight:700}.wcard .subtle{font-size:12px;color:#607d6b;line-height:1.75}.wcard .actions{display:flex;flex-wrap:wrap;gap:10px;align-items:end}.wcard button:disabled{opacity:.5;cursor:not-allowed}`}</style>
  <div style={{maxWidth:1230,margin:'auto'}}>
   <Link href="/admin" style={{color:'#0a8461'}}>← Global Command Center</Link>
   <p style={{fontSize:12,fontWeight:850,color:'#d96d15',letterSpacing:1.1}}>LANDSHOP PEOPLE OPERATIONS</p>
   <h1 style={{fontSize:'clamp(29px,4vw,44px)',margin:'10px 0'}}>Workforce Command Center</h1>
   <p style={{maxWidth:840,color:'#687b6e',lineHeight:1.7}}>Approved users, employment identity, attendance points, manager-assigned tasks, individual performance and annual staff reviews. Operational changes are controlled by signed-in managers and auditable backend procedures.</p>
   {(profiles.error||tasks.error)&&<p role="alert" style={{background:'#fff2e7',padding:15}}>Unable to load one of the staff datasets. Check the verified management role and database permissions before reviewing employees.</p>}
   <WorkforcePanel people={profiles.data||[]} taskRows={tasks.data||[]} actorRole={member.data?.role||''}/>
  </div>
 </main>;
}
