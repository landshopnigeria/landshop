import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {redirect} from 'next/navigation';
import AdvancedImport from './AdvancedImport';
export const dynamic='force-dynamic';
export default async function Page(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Bulk processing is not configured.</main>;
 const jar=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'},
  cookies:{getAll(){return jar.getAll()},setAll(changes){try{changes.forEach(x=>jar.set(x.name,x.value,x.options))}catch{}}}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:members}=await db.from('organization_members').select('organization_id,role').eq('user_id',user.id).eq('status','active');
 const qualified=(members||[]).filter(m=>['owner','admin','legal','operations','sales'].includes(m.role));
 if(!qualified.length)return <main>Access denied.</main>;
 const {data:orgs}=await db.from('organizations').select('id').eq('kind','landshop').in('id',qualified.map(m=>m.organization_id));
 if(!orgs?.length)return <main>Access denied.</main>;
 return <AdvancedImport userId={user.id}/>;
}
