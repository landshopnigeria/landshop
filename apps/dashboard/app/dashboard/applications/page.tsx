import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import Link from 'next/link';
export const dynamic='force-dynamic';
export const metadata={title:'My Applications | Landshop'};
const names:Record<string,string>={
 develop_house:'Develop House',develop_land:'Develop Land',incubate:'Incubate Investment',
 beta_mortgage:'Beta Mortgage',mortgage_xtra:'Mortgage Xtra',inspection:'Property Inspection',thrift:'Thrift'
};
const slugByKind:Record<string,string>={
 develop_house:'develop-house',develop_land:'develop-land',incubate:'incubate-investment',
 beta_mortgage:'beta-mortgage',mortgage_xtra:'mortgage-xtra',inspection:'develop-inspection'
};
type Application={id:string;kind:string;status:string;created_at:string;answers:Record<string,unknown>|null};
export default async function MyApplications(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main style={{padding:35}}>Secure applications service is not configured.</main>;
 const store=await cookies();
 const db=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{getAll(){return store.getAll()},setAll(values){try{values.forEach(x=>store.set(x.name,x.value,x.options))}catch{}}}
 });
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)redirect('https://portal.landshopnigeria.com/');
 const {data,error}=await db.from('applications')
  .select('id,kind,status,created_at,answers')
  .eq('applicant_id',user.id).order('created_at',{ascending:false}).limit(100);
 const records=(data||[]) as Application[];
 return <main style={{minHeight:'100vh',background:'#f3f9f5',padding:'clamp(20px,5vw,68px)',fontFamily:'Arial,sans-serif',color:'#103e33'}}>
  <header style={{maxWidth:1150,margin:'auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:15}}>
   <Link href="/dashboard" style={{fontWeight:800,color:'#00795d'}}>← Landshop Dashboard</Link>
   <a href="https://portal.landshopnigeria.com/applications" style={{padding:'12px 17px',background:'#007d61',color:'white',textDecoration:'none',borderRadius:10}}>New Product Application →</a>
  </header>
  <section style={{maxWidth:1150,margin:'30px auto'}}>
   <span style={{color:'#008766',fontSize:12,fontWeight:800,letterSpacing:2}}>CUSTOMER PORTAL</span>
   <h1 style={{fontSize:'clamp(30px,4vw,48px)',marginBottom:12}}>My Applications</h1>
   <p style={{color:'#486b5a',lineHeight:1.6}}>Track secure Develop, Incubate and Grow subscriptions. Drafts can be resumed; submitted applications are reviewed by Landshop's authorized staff.</p>
   {error?<div role="alert" style={{padding:24,background:'white',borderRadius:18}}>Application records are temporarily unavailable. Please check your account session and try again.</div>:
    !records.length?<div style={{background:'white',border:'1px solid #d6e9de',padding:32,borderRadius:18}}>
     <h2>No applications yet</h2><p>Your product subscription history will appear here once you save or submit a form.</p>
     <a href="https://portal.landshopnigeria.com/applications" style={{color:'#008766'}}>Browse product applications →</a></div>:
    <div style={{display:'grid',gap:14}}>
     {records.map(item=>{
      const rawSlug=typeof item.answers?.form_slug==='string'?item.answers.form_slug:'';
      const slug=/^[a-z0-9-]{1,60}$/.test(rawSlug)?rawSlug:(slugByKind[item.kind]||'develop-house');
      const editable=item.status==='draft';
      return <article key={item.id} style={{display:'flex',gap:16,justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',background:'white',padding:'20px 23px',border:'1px solid #d6e8dd',borderRadius:17}}>
       <div><small style={{color:'#507b68'}}>{new Date(item.created_at).toLocaleDateString('en-NG',{year:'numeric',month:'long',day:'numeric'})}</small>
        <h2 style={{margin:'6px 0',fontSize:19}}>{names[item.kind]||'Product Application'}</h2>
        <small style={{overflowWrap:'anywhere'}}>Reference: {item.id}</small></div>
       <div style={{display:'flex',alignItems:'center',gap:15,flexWrap:'wrap'}}>
        <span style={{padding:'8px 13px',borderRadius:99,background:editable?'#fff1dc':'#e5f8ed',color:editable?'#9b611b':'#08795e',fontWeight:700,fontSize:12,textTransform:'capitalize'}}>{item.status.replaceAll('_',' ')}</span>
        {editable?<a href={'https://portal.landshopnigeria.com/applications/'+slug} style={{color:'#00795d',fontWeight:800}}>Resume Draft →</a>:<span style={{fontSize:12,color:'#5b746c'}}>Under the current Landshop review process</span>}
       </div>
      </article>})}
    </div>}
   <p style={{color:'#5e796c',fontSize:12,marginTop:20}}>Your records are scoped to your authenticated account. Financial approval, property allocation and document verification are separate governed activities.</p>
  </section>
 </main>;
}
