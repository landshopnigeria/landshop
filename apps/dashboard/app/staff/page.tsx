import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {createServerClient} from '@supabase/ssr';
import StaffWorkspace from './StaffWorkspace';
export const dynamic='force-dynamic';
export const metadata={title:'My Staff Dashboard | Landshop'};
export default async function Page(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Staff authentication service is unavailable.</main>;
 const store=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
 cookies:{getAll(){return store.getAll()},setAll(items){try{items.forEach(i=>store.set(i.name,i.value,i.options))}catch{}}}});
 const {data:{user},error}=await db.auth.getUser();if(error||!user)redirect('/staff/sign-in');
 // A registered email or requested role does not establish workforce access.
 // Resolve the authoritative backend work gate before retrieving any task data.
 // A verified owner is authorized by an audited, active organization membership,
 // never by the requested_role or editable signup metadata.
 const {data:ownerMember,error:ownerMembershipError}=await db.from('organization_members')
  .select('organization_id').eq('user_id',user.id).eq('role','owner').eq('status','active')
  .limit(1).maybeSingle();
 if(!ownerMembershipError&&ownerMember){
  const [{data:landshopOrg},{data:verifiedManagement,error:managerError}]=await Promise.all([
   db.from('organizations').select('id').eq('id',ownerMember.organization_id)
    .eq('kind','landshop').maybeSingle(),
   db.rpc('landshop_is_management',{p_user:user.id})
  ]);
  if(landshopOrg&&managerError==null&&verifiedManagement===true)redirect('/admin');
 }
 const [{data:profile},{data:canWork,error:workError}]=await Promise.all([
  db.from('landshop_staff_profiles').select('*').eq('user_id',user.id).maybeSingle(),
  db.rpc('landshop_staff_can_work',{p_user:user.id})
 ]);
 const authorized=workError==null&&canWork===true&&profile?.kyc_state==='approved'&&profile?.employment_state==='active';
 const {data:member}=authorized&&profile?await db.from('organization_members').select('role')
  .eq('user_id',user.id).eq('organization_id',profile.organization_id)
  .eq('status','active').limit(1).maybeSingle():{data:null};
 const verified=Boolean(authorized&&member?.role);
 const {data:tasks}=verified?await db.from('staff_tasks')
  .select('id,title,details,status,starts_at,due_at,planned_minutes,delay_allowance_minutes,viewed_at,started_at,submitted_at,score,review_comment,assigned_by')
  .eq('assignee_id',user.id).order('created_at',{ascending:false}).limit(100):{data:[]};
 return <StaffWorkspace userId={user.id} initialProfile={profile||null} initialTasks={tasks||[]}
  role={member?.role||null} initialVerified={verified}
  metadata={(user.user_metadata||{}) as Record<string,unknown>} userEmail={user.email||''}/>;
}
