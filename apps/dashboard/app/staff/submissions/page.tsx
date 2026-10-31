import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {createServerClient} from '@supabase/ssr';
import StaffReportHub from './StaffReportHub';

export const dynamic='force-dynamic';
export const metadata={title:'Departmental Reports | Landshop People'};
export default async function ReportsPage(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Staff reporting is temporarily unavailable.</main>;
 const store=await cookies();
 const db=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',path:'/',secure:true},
  cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(c=>store.set(c.name,c.value,c.options))}catch{}}}
 });
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect('/staff/sign-in');
 const [{data:canWork},{data:canManage}]=await Promise.all([
  db.rpc('landshop_staff_can_work',{p_user:user.id}),
  db.rpc('landshop_is_management',{p_user:user.id})
 ]);
 if(canWork!==true&&canManage!==true)redirect('/staff');
 const [r,t]=await Promise.all([
  db.from('landshop_staff_routed_reports')
   .select('id,staff_id,recipient_role,cadence,period_start,summary,blockers,status,reviewer_note,related_task_id,created_at,reviewed_at')
   .order('created_at',{ascending:false}).limit(200),
  db.from('staff_tasks').select('id,title,status').eq('assignee_id',user.id)
   .order('created_at',{ascending:false}).limit(100)
 ]);
 return <main style={{minHeight:'100vh',background:'#f1f8f4',padding:'clamp(18px,3vw,48px)',color:'#103f34'}}>
  <div style={{maxWidth:1220,margin:'auto'}}>
   <Link href="/staff" style={{fontWeight:800,color:'#078d6c'}}>← Staff Dashboard</Link>
   <h1 style={{fontSize:'clamp(27px,3.2vw,42px)',letterSpacing:'-.04em',margin:'17px 0 7px'}}>Landshop Departmental Reports</h1>
   <p style={{lineHeight:1.7,color:'#6b8579',maxWidth:830}}>Send a daily or monthly report to HR, your manager or another department. Submissions enter the authorised team's private inbox and are recorded for management oversight.</p>
   {(r.error||t.error)&&<p role="alert" style={{background:'#fff5e7',borderRadius:10,padding:12}}>Some report data could not be loaded. Please refresh or contact your supervisor.</p>}
   <StaffReportHub userId={user.id} canWork={canWork===true} reports={r.data||[]} tasks={t.data||[]}/>
  </div>
 </main>;
}
