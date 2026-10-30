import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import ImportReview from './ImportReview';
export const dynamic='force-dynamic';
export default async function Review(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Property import database not configured.</main>;
 const jar=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'},
  cookies:{getAll(){return jar.getAll()},setAll(c){try{c.forEach(x=>jar.set(x.name,x.value,x.options))}catch{}}}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:members}=await db.from('organization_members').select('organization_id,role').eq('user_id',user.id).eq('status','active');
 const managers=(members||[]).filter(m=>['owner','ceo','founder','admin','technology_officer','technology_consultant'].includes(m.role));
 if(!managers.length)return <main>Access denied. Independent import reviewers only.</main>;
 const {data:orgs}=await db.from('organizations').select('id').eq('kind','landshop').in('id',managers.map(m=>m.organization_id));
 if(!orgs?.length)return <main>Access denied.</main>;
 const {data:batches,error:batchError}=await db.from('property_import_batches')
  .select('id,source_filename,status,created_by,approved_by,created_at')
  .in('status',['validated','approved','imported','rejected'])
  .order('created_at',{ascending:false}).limit(60);
 return <main style={{fontFamily:'Arial,sans-serif',padding:'clamp(18px,5vw,60px)',background:'#f1f8f4',minHeight:'100vh',color:'#093e35'}}>
  <a href="/admin/properties">← Property Command Center</a>
  <h1>Import Approval Queue</h1><p>Validate → independent approval → separate operator promotes accepted rows into draft listings.</p>
  {batchError?<p role="alert">Import review records unavailable.</p>:<ImportReview initial={batches||[]} currentUser={user.id}/>}
 </main>;
}
