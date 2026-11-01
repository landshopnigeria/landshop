import Link from 'next/link';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {createServerClient} from '@supabase/ssr';
import ProjectPhotoEvidence from './ProjectPhotoEvidence';

export const dynamic='force-dynamic';
export const metadata={title:'Historical Project Photo Evidence | Landshop Staff'};

export default async function Page(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main style={{padding:36}}>Landshop photo service is not configured.</main>;
 const store=await cookies();
 const db=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'},
  cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}
 });
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect('/staff/sign-in');
 const [{data:staff,error:staffError},{data:manager,error:managerError}]=await Promise.all([
  db.rpc('landshop_staff_can_work',{p_user:user.id}),
  db.rpc('landshop_is_management',{p_user:user.id})
 ]);
 const canUpload=Boolean((!staffError&&staff===true)||(!managerError&&manager===true));
 const canReview=Boolean(!managerError&&manager===true);
 if(!canUpload)return <main style={{padding:36}}><h1>Project Photo Evidence</h1><p>Verified active Landshop staff or management access is required.</p><Link href="/staff">Return to Staff Dashboard</Link></main>;
 const {data:items,error:listError}=await db.from('landshop_project_photo_evidence')
  .select('id,project_slug,photographer,captured_on,location_note,provenance_note,rights_basis,rights_reference,object_path,status,uploaded_by,uploaded_at,review_note')
  .order('uploaded_at',{ascending:false}).limit(150);
 return <main style={{minHeight:'100vh',background:'#f2f8f5',padding:'clamp(16px,3vw,44px)',color:'#073f34',fontFamily:'Arial, sans-serif'}}>
  <nav style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:20,marginBottom:24,fontSize:14}}>
   <Link href="/staff">Staff Dashboard</Link>
   {canReview&&<Link href="/admin">Global Command Center</Link>}
   {canReview&&<Link href="/admin/properties">Property Management</Link>}
  </nav>
  <h1 style={{fontSize:28,margin:'0 0 10px'}}>Historical Project Photo Evidence</h1>
  <p style={{maxWidth:840,color:'#567467',lineHeight:1.7,marginBottom:24}}>
   Submit original photographs for Green Island, Merit Park, Famous Gardens or Maiyegun.
   Private originals require an independent evidence review before any separate editorial publication decision.
   Verification does not change estate status, prove ownership or publish a property for sale.
  </p>
  {listError?<p role="alert">Evidence register could not be loaded. Verify the database migration and permissions.</p>:
   <ProjectPhotoEvidence userId={user.id} canReview={canReview} initial={items||[]}/>}
 </main>;
}
