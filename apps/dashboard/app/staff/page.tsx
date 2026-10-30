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
 // The owner remains on their personal dashboard and can explicitly enter the
 // Global Command Center; only verified active owner membership grants that link.
 let verifiedOwner=false;
 if(!ownerMembershipError&&ownerMember){
  const [{data:landshopOrg},{data:verifiedManagement,error:managerError}]=await Promise.all([
   db.from('organizations').select('id').eq('id',ownerMember.organization_id)
    .eq('kind','landshop').maybeSingle(),
   db.rpc('landshop_is_management',{p_user:user.id})
  ]);
  verifiedOwner=Boolean(landshopOrg&&managerError==null&&verifiedManagement===true);
 }
 // Confirmed staff signup creates only a personal profile, never membership.
 const confirmedStaffSignup=Boolean(user.email_confirmed_at&&user.user_metadata?.staff_signup===true);
 let {data:profile}=await db.from('landshop_staff_profiles').select('*').eq('user_id',user.id).maybeSingle();
 if(confirmedStaffSignup&&!profile){
  const fields=user.user_metadata||{},age=fields.age_at_registration;
  if(typeof fields.preferred_username==='string'&&typeof age==='number'&&
     Number.isInteger(age)&&age>=18&&age<=120&&typeof fields.gender==='string'&&
     typeof fields.requested_role==='string'){
   const {error:provisionError}=await db.rpc('landshop_staff_onboard',{
    p_username:fields.preferred_username,p_age:age,
    p_gender:fields.gender,p_requested_role:fields.requested_role
   });
   if(!provisionError){
    const next=await db.from('landshop_staff_profiles').select('*').eq('user_id',user.id).maybeSingle();
    profile=next.data;
   }
  }
 }
 const {data:canWork,error:workError}=await db.rpc('landshop_staff_can_work',{p_user:user.id});
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
  selfServiceAccess={confirmedStaffSignup&&Boolean(profile)}
  ownerAccess={verifiedOwner}
  metadata={(user.user_metadata||{}) as Record<string,unknown>} userEmail={user.email||''}/>;
}
