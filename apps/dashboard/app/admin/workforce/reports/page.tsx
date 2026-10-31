import Link from 'next/link';
import {requireLandshopStaff} from '../../../../lib/admin-access';
import StaffReportHub from '../../../staff/submissions/StaffReportHub';
export const dynamic='force-dynamic';
export const metadata={title:'Department Report Inbox | Landshop Command Center'};
export default async function DepartmentReports(){
 const {db,user}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const r=await db.from('landshop_staff_routed_reports')
  .select('id,staff_id,recipient_role,cadence,period_start,summary,blockers,status,reviewer_note,related_task_id,created_at,reviewed_at')
  .order('created_at',{ascending:false}).limit(200);
 return <main style={{minHeight:'100vh',background:'#f1f8f4',color:'#103e30',padding:'clamp(20px,4vw,58px)'}}>
  <div style={{maxWidth:1220,margin:'auto'}}>
   <Link href="/admin" style={{color:'#08775b',fontWeight:800}}>← Global Command Center</Link>
   <h1 style={{fontSize:'clamp(30px,3.5vw,44px)',margin:'20px 0 8px'}}>Staff Submissions & Department Inbox</h1>
   <p style={{maxWidth:820,lineHeight:1.7,color:'#6a8575'}}>Audit staff reports sent to HR, managers, finance, operations and executive management. Acknowledge or return reports using the backend-controlled review action. Only authorised management can access this page.</p>
   {r.error&&<p role="alert">The reporting dataset could not be loaded with your current permissions.</p>}
   <StaffReportHub userId={user.id} canWork={false} hideSubmission reports={r.data||[]} tasks={[]}/>
  </div>
 </main>;
}
