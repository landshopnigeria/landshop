import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export const dynamic='force-dynamic';
export const metadata={title:'Properties | Landshop Nigeria',description:'Browse verified, published Landshop property inventory.'};

type Property={id:string,title:string,property_type:string,amount_kobo:number|null,status:string};
type Search={type?:string;query?:string};
export default async function Properties({searchParams}:{searchParams:Promise<Search>}){
 const args=await searchParams;
 const type=(args.type||'').trim().toLowerCase().slice(0,60);
 const query=(args.query||'').trim().slice(0,80);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 let properties:Property[]=[];
 let unavailable=false;
 if(url&&key){
  const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  let req=supabase.from('properties').select('id,title,property_type,amount_kobo,status')
    .eq('status','published').order('created_at',{ascending:false}).limit(24);
  if(type && /^[a-z_ -]+$/.test(type))req=req.eq('property_type',type);
  if(query)req=req.ilike('title',`%${query.replace(/[%_\\]/g,'')}%`);
  const {data,error}=await req;
  if(error)unavailable=true;
  else properties=(data||[]) as Property[];
 }else unavailable=true;
 return <main style={{fontFamily:'Arial,Helvetica,sans-serif',color:'#073e34',minHeight:'100vh'}}>
 <header style={{padding:'23px 6%',borderBottom:'1px solid #d8e6df',display:'flex',justifyContent:'space-between',gap:20}}>
  <Link href="/" style={{fontSize:26,color:'#078d70',fontWeight:800,textDecoration:'none'}}>Landshop</Link>
  <Link href="https://portal.landshopnigeria.com" style={{color:'#078d70'}}>Account / Get Started</Link>
 </header>
 <section style={{background:'linear-gradient(115deg,#063e37,#088e75)',color:'white',padding:'56px 6%'}}>
  <nav aria-label="Breadcrumb"><Link href="/" style={{color:'white'}}>Home</Link> / Properties</nav>
  <h1 style={{fontSize:'clamp(40px,5vw,62px)',marginBottom:10}}>Discover Landshop Properties</h1>
  <p>Explore company-published land and housing opportunities across Nigeria.</p>
 </section>
 <section style={{padding:'36px 6%'}}>
  <form style={{display:'flex',flexWrap:'wrap',gap:12,marginBottom:32}}>
   <input aria-label="Search properties" name="query" defaultValue={query} placeholder="Estate, property or project name" style={{padding:15,border:'1px solid #b7d7cb',borderRadius:12,flex:'1 1 230px'}}/>
   <select aria-label="Property type" name="type" defaultValue={type} style={{padding:15,border:'1px solid #b7d7cb',borderRadius:12}}>
    <option value="">All properties</option>
    <option value="land">Land</option><option value="house">House</option>
    <option value="apartment">Apartment</option><option value="commercial">Commercial</option>
    <option value="shortlet">Shortlet</option>
   </select>
   <button type="submit" style={{background:'#087f68',color:'white',border:0,borderRadius:12,padding:'15px 28px'}}>Search</button>
  </form>
  {unavailable?<p role="status">The live property catalog is not available yet. Please contact Landshop for verified inventory.</p>:
   properties.length===0?<p role="status">No published properties match your filters. Contact Landshop for current availability.</p>:
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:20}}>
    {properties.map(item=><article key={item.id} style={{border:'1px solid #d4e5db',borderRadius:18,overflow:'hidden',background:'white'}}>
     <div style={{height:170,display:'grid',placeItems:'center',background:'linear-gradient(130deg,#e8f3ee,#d5e5df)',color:'#316457'}}>Verified imagery pending</div>
     <div style={{padding:20}}><p style={{textTransform:'capitalize',fontSize:13}}>{item.property_type}</p><h2 style={{fontSize:21}}>{item.title}</h2>
     <strong>{typeof item.amount_kobo==='number'?(item.amount_kobo/100).toLocaleString('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}):'Price on request'}</strong>
     <p><Link href="https://portal.landshopnigeria.com">Enquire through Landshop</Link></p></div>
    </article>)}
   </div>}
  <p style={{marginTop:50}}>Only Landshop's authorized management team can publish properties. There is no public property-upload form.</p>
 </section></main>;
}
