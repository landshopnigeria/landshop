import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {redirect,notFound} from 'next/navigation';
import PropertyAssets from './PropertyAssets';
import ShowcaseEditor from './ShowcaseEditor';
import DraftBasicsEditor from './DraftBasicsEditor';
export const dynamic='force-dynamic';

export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Property service configuration pending.</main>;
 const jar=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{getAll(){return jar.getAll()},setAll(changes){try{changes.forEach(x=>jar.set(x.name,x.value,x.options))}catch{}}}});
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:members,error:merr}=await db.from('organization_members')
  .select('organization_id,role').eq('user_id',user.id).eq('status','active');
 if(merr||!members?.length)return <main>Access denied.</main>;
 const qualified=members.filter(m=>['owner','admin','operations','legal','sales'].includes(m.role));
 if(!qualified.length)return <main>Access denied.</main>;
 const {data:orgs,error:orgError}=await db.from('organizations').select('id').eq('kind','landshop')
  .in('id',qualified.map(m=>m.organization_id));
 if(orgError||!orgs?.length)return <main>Access denied.</main>;
 const {data:property,error}=await db.from('properties').select('id,title,status,property_type,estate_id,amount_kobo,sale_mode,bedrooms,bathrooms,land_area_sqm,floor_area_sqm,source_url,source_price_note,price_last_confirmed_at,price_is_starting_at')
  .eq('id',id).maybeSingle();
 if(error||!property)notFound();
 const {data:estates}=await db.from('estates').select('id,name,state,city,status').order('name',{ascending:true}).limit(300);
 const {data:assets}=await db.from('property_assets').select('id,kind,status,object_path,uploaded_by')
  .eq('property_id',id).order('created_at',{ascending:false}).limit(100);
 const [{data:draft},{data:published},{data:media}]=await Promise.all([
  db.from('property_showcase_drafts').select('payload').eq('property_id',id).maybeSingle(),
  db.from('property_showcase').select('payload').eq('property_id',id).maybeSingle(),
  db.from('property_showcase_media').select('id,kind,status,object_path,title,submitted_by,created_at').eq('property_id',id).order('created_at',{ascending:false}).limit(100)
 ]);
 return <main style={{fontFamily:'Arial,sans-serif',padding:'clamp(20px,5vw,60px)',background:'#f1f8f5',minHeight:'100vh',color:'#073f34'}}>
  <a href="/admin/properties">← Property Management</a>
  <h1>{property.title}</h1><p>{property.property_type} · {property.status}</p>
  <DraftBasicsEditor property={property} estates={estates||[]} canApprove={qualified.some(m=>['owner','admin','legal','operations'].includes(m.role))}/>
  <ShowcaseEditor propertyId={id} propertyStatus={property.status} initial={(draft?.payload||published?.payload||{}) as Record<string,unknown>} approved={Boolean(published)} currentUserId={user.id} canApprove={qualified.some(m=>['owner','admin','legal','operations'].includes(m.role))} assets={assets||[]} initialMedia={media||[]}/>
  <PropertyAssets propertyId={id} propertyStatus={property.status} items={assets||[]}
   allowReview={qualified.some(m=>['owner','admin','legal','operations'].includes(m.role))}/>
 </main>;
}
