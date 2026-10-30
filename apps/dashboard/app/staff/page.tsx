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
 const [{data:profile},{data:member},{data:tasks}]=await Promise.all([
 db.from('landshop_staff_profiles').select('*').eq('user_id',user.id).maybeSingle(),
 db.from('organization_members').select('role').eq('user_id',user.id).eq('status','active').limit(1).maybeSingle(),
 db.from('staff_tasks').select('id,title,details,status,starts_at,due_at,planned_minutes,delay_allowance_minutes,viewed_at,started_at,submitted_at,score,review_comment,assigned_by').eq('assignee_id',user.id).order('created_at',{ascending:false}).limit(100)
 ]);
 return <StaffWorkspace userId={user.id} initialProfile={profile||null} initialTasks={tasks||[]} role={member?.role||null} metadata={(user.user_metadata||{}) as Record<string,unknown>}/>;
}
