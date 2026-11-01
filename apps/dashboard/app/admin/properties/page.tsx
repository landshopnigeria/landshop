import Link from 'next/link';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import PropertyManagement from './PropertyManagement';
import EstateManagement from './EstateManagement';

export const dynamic='force-dynamic';
export const metadata={title:'Property Management | Landshop Command Center'};
export default async function Page(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Landshop property service is not configured.</main>;
 const store=await cookies();
 const db=createServerClient(url,key,{
   cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'},
   cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}
 });
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:members,error:membersError}=await db.from('organization_members')
  .select('organization_id,role').eq('user_id',user.id).eq('status','active');
 if(membersError||!members?.length)return <main style={{padding:40}}>Access denied.</main>;
 const allowed=members.filter(x=>['owner','ceo','founder','admin','technology_officer','technology_consultant'].includes(x.role));
 if(!allowed.length)return <main style={{padding:40}}>Property management requires Landshop staff access.</main>;
 const {data:organizations,error:orgError}=await db.from('organizations').select('id')
  .eq('kind','landshop').in('id',allowed.map(x=>x.organization_id));
 if(orgError||!organizations?.length)return <main style={{padding:40}}>Access denied.</main>;
 const {data:estates,error:estateError}=await db.from('estates').select('id,name,state,city,lga,area,status,created_by,source_note').order('name',{ascending:true}).limit(300);
 const {data:properties,error:listingError}=await db.from('properties')
  .select('id,title,property_type,status,amount_kobo,created_by,estate_id,source_url,source_price_note,price_last_confirmed_at')
  .order('created_at',{ascending:false}).limit(100);
 return <main style={{minHeight:'100vh',background:'#f1f8f4',padding:'clamp(18px,4vw,55px)',fontFamily:'Arial, sans-serif',color:'#073e35'}}>
  <nav style={{display:'flex',gap:20,marginBottom:25}}><Link href="/dashboard">Dashboard</Link>
   <Link href="/admin/kyc">KYC</Link><Link href="/admin/properties">Properties</Link><Link href="/admin/properties/project-media">Project Photo Evidence</Link><Link href="/admin/properties/import">Bulk Import</Link><Link href="/admin/properties/readiness">Readiness</Link>{allowed.some(m=>m.role==='owner')&&<Link href="/admin/properties/team">Review Team</Link>}<Link href="/admin/properties/inspections">Inspection Requests</Link><Link href="/admin/contact">Contact Enquiries</Link><Link href="/admin/properties/import/review">Import Reviews</Link></nav>
  <h1>Landshop Property Command Center</h1>
  <p style={{color:'#bc5d12',fontSize:13,fontWeight:700}}>Draft listings are staff-only and do not appear in the public marketplace until title, price, location, marketing authority and media have been reviewed.</p>
  <p>Staff-only inventory management. No customer or realtor self-publication.</p>
  {estateError?<p role="alert">Estate catalog could not be loaded. Check authorization and permissions.</p>:<EstateManagement initial={estates||[]} canApprove={allowed.some(m=>['owner','ceo','founder','admin','technology_officer','technology_consultant'].includes(m.role))}/>}
  {listingError?<p role="alert">Property data is unavailable; database migration and privileges must be verified.</p>:
   <PropertyManagement initial={properties||[]} estates={estates||[]} currentUserId={user.id} canApprove={allowed.some(m=>['owner','ceo','founder','admin','technology_officer','technology_consultant'].includes(m.role))}/>}
 </main>;
}
