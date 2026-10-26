import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import ReviewResult from './ReviewResult';
export const dynamic='force-dynamic';
export default async function Page(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Import review service is not configured.</main>;
 const store=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(x=>store.set(x.name,x.value,x.options))}catch{}}}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:members}=await db.from('organization_members').select('organization_id,role')
  .eq('user_id',user.id).eq('status','active');
 const reviewers=(members||[]).filter(m=>['owner','admin','operations','legal'].includes(m.role));
 if(!reviewers.length)return <main>Only an authorized reviewer can inspect import results.</main>;
 const {data:orgs}=await db.from('organizations').select('id').eq('kind','landshop')
  .in('id',reviewers.map(m=>m.organization_id));
 if(!orgs?.length)return <main>Access denied.</main>;
 return <ReviewResult/>;
}
