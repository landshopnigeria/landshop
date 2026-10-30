import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {redirect} from 'next/navigation';
import ImportForm from './ImportForm';

export const dynamic='force-dynamic';
export default async function Import(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Import service is not configured.</main>;
 const store=await cookies();
 const db=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}
 });
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:members}=await db.from('organization_members').select('organization_id,role')
  .eq('user_id',user.id).eq('status','active');
 const authorized=(members||[]).filter(m=>['owner','ceo','founder','admin','technology_officer','technology_consultant'].includes(m.role));
 if(!authorized.length)return <main style={{padding:40}}>Access denied.</main>;
 const {data:orgs}=await db.from('organizations').select('id').eq('kind','landshop')
  .in('id',authorized.map(m=>m.organization_id));
 if(!orgs?.length)return <main style={{padding:40}}>Access denied.</main>;
 return <ImportForm/>;
}
