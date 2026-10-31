import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {createServerClient} from '@supabase/ssr';
import Link from 'next/link';
import StaffReportReviews from '../../admin/reports/staff/StaffReportReviews';
export const dynamic='force-dynamic';
export const metadata={title:'Reports Routed to Me | Landshop Staff'};
const recipientRoles=['hr','hr_officer','department_manager','operations','admin','owner','ceo','head_finance','customer_service_manager','social_media_manager'];
export default async function StaffInbox(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Staff reporting configuration is unavailable.</main>;
 const jar=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'},cookies:{
  getAll(){return jar.getAll()},
  setAll(items){try{items.forEach(({name,value,options})=>jar.set(name,value,options))}catch{}}
 }});
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)redirect('/staff/sign-in');
 const {data:canWork,error:workError}=await db.rpc('landshop_staff_can_work',{p_user:user.id});
 const {data:members,error:membershipError}=await db.from('organization_members').select('organization_id,role')
  .eq('user_id',user.id).eq('status','active');
 const eligible=(members||[]).filter(m=>recipientRoles.includes(m.role));
 if(workError||canWork!==true||membershipError||!eligible.length){
  return <main style={{padding:36}}><h1>Staff reports</h1><p>Your current role does not have a staff report inbox.</p><Link href="/staff">Return to staff dashboard</Link></main>;
 }
 const {data,error}=await db.from('landshop_staff_submissions')
  .select('id,staff_id,recipient_role,period,report_date,title,details,status,created_at')
  .in('organization_id',eligible.map(m=>m.organization_id))
  .in('recipient_role',eligible.map(m=>m.role))
  .order('created_at',{ascending:false}).limit(250);
 return <main style={{minHeight:'100vh',background:'#f5faf6',padding:'clamp(18px,5vw,64px)',color:'#123f30'}}>
  <div style={{maxWidth:1000,margin:'auto'}}>
   <Link href="/staff" style={{color:'#13865b'}}>← Staff dashboard</Link>
   <p style={{letterSpacing:1,color:'#f26b10',fontSize:12,fontWeight:700}}>LANDSHOP PEOPLE & MANAGEMENT</p>
   <h1>Reports Routed to My Role</h1>
   <p>Review daily and monthly reports sent to your authorized department role. Every decision is verified and recorded by the server.</p>
   {error?<p role="alert">Unable to load your reporting queue: {error.message}</p>:
    <StaffReportReviews initial={data||[]}/>}
   <p style={{fontSize:12,color:'#587867'}}>Only the latest 250 authorized reports are shown. Contact an administrator for older reports.</p>
  </div>
 </main>;
}