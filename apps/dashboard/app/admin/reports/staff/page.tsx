import Link from 'next/link';
import {requireLandshopStaff} from '../../../../lib/admin-access';
import ExportRecords from '../ExportRecords';
import StaffReportReviews from './StaffReportReviews';
export const dynamic='force-dynamic';
export const metadata={title:'Staff Reports & Management Review | Landshop'};
export default async function StaffReports(){
 const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const {data,error}=await db.from('landshop_staff_submissions').select('id,staff_id,recipient_role,period,report_date,title,details,status,created_at').order('created_at',{ascending:false}).limit(500);
 const records=data||[];
 return <main style={{minHeight:'100vh',background:'#f4f9f5',padding:'clamp(18px,5vw,60px)',color:'#194b36'}}>
  <div style={{maxWidth:1100,margin:'auto'}}>
   <Link href="/admin/reports">← Operational Reports</Link>
   <h1>Staff Daily & Monthly Reports</h1>
   <p>Role-restricted management review of employee submissions, with server-side audit events for decisions.</p>
   {error?<p role="alert">Reports could not be loaded: {error.message}</p>:<>
    <p><strong>{records.length}</strong> authorized reports loaded. New submissions are stored from their original submission date.</p>
    <ExportRecords basename="landshop-staff-reports" rows={records.map(r=>({id:r.id,staff_id:r.staff_id,recipient_role:r.recipient_role,period:r.period,report_date:r.report_date,title:r.title,details:r.details,status:r.status,created_at:r.created_at}))}/>
    <StaffReportReviews initial={records}/>
    <p style={{fontSize:12,color:'#698074'}}>Reports are limited to the latest 500 returned records. Use paginated exports for larger archives.</p>
   </>}
  </div>
 </main>;
}
