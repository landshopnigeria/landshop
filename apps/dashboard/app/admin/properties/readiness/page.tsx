import Link from 'next/link';
import {requireLandshopStaff} from '../../../../lib/admin-access';
export const dynamic='force-dynamic';
export const metadata={title:'Property Publication Readiness | Landshop'};
type Estate={id:string;name:string;status:string;state:string|null;city:string|null;review_requested_by:string|null};
type Property={id:string;title:string;status:string;estate_id:string|null;amount_kobo:number|null;price_is_starting_at:boolean;price_last_confirmed_at:string|null;price_confirmed_by:string|null;source_url:string|null};
type Profile={property_id:string;approved_by:string;location_verified:boolean;payload:Record<string,unknown>};
type Asset={property_id:string;kind:string;status:string};
type Media={property_id:string;kind:string;status:string};
type Check={name:string;ok:boolean;reason:string};
export default async function Readiness(){
 const {db}=await requireLandshopStaff(['owner','admin','operations','sales','legal']);
 const [p,e,profiles,assets,media,edits]=await Promise.all([
  db.from('properties').select('id,title,status,estate_id,amount_kobo,price_is_starting_at,price_last_confirmed_at,price_confirmed_by,source_url').order('created_at',{ascending:false}).limit(200),
  db.from('estates').select('id,name,status,state,city,review_requested_by').limit(250),
  db.from('property_showcase').select('property_id,approved_by,location_verified,payload').limit(250),
  db.from('property_assets').select('property_id,kind,status').limit(500),
  db.from('property_showcase_media').select('property_id,kind,status').limit(500),
  db.from('property_showcase_drafts').select('property_id,edited_by').limit(250)
 ]);
 const bad=[p,e,profiles,assets,media,edits].some(x=>x.error);
 const estates=new Map(((e.data||[]) as Estate[]).map(x=>[x.id,x]));
 const showcases=new Map(((profiles.data||[]) as unknown as Profile[]).map(x=>[x.property_id,x]));
 const draftMap=new Map(((edits.data||[]) as {property_id:string;edited_by:string}[]).map(x=>[x.property_id,x.edited_by]));
 const evidence=(assets.data||[]) as Asset[],gallery=(media.data||[]) as Media[];
 const list=((p.data||[]) as Property[]).map(property=>{
  const estate=estates.get(property.estate_id||''),showcase=showcases.get(property.id);
  const sourceAssets=evidence.filter(x=>x.property_id===property.id&&x.status==='verified');
  const photos=gallery.some(x=>x.property_id===property.id&&x.kind==='photo'&&x.status==='approved');
  const videos=showcase?.payload?.videos;
  const videoApproved=Array.isArray(videos)&&videos.some(x=>x&&typeof x==='object'&&typeof (x as Record<string,unknown>).url==='string');
  const updatedPrice=property.price_last_confirmed_at?new Date(property.price_last_confirmed_at):null;
  const priceCurrent=Boolean(updatedPrice&&updatedPrice.getTime()>Date.now()-30*86400000);
  const checks:Check[]=[
   {name:'Estate independently approved',ok:Boolean(estate?.status==='published'&&estate.review_requested_by),reason:'Submit estate to review and have a second reviewer confirm the real development location'},
   {name:'Positive current price',ok:typeof property.amount_kobo==='number'&&property.amount_kobo>0,reason:'Confirm current owner/developer unit quote, not an old promotional minimum'},
   {name:'Price independently reconfirmed',ok:priceCurrent&&Boolean(property.price_confirmed_by),reason:'Second reviewer must independently confirm the current price within 30 days'},
   {name:'Property description approved',ok:Boolean(showcase?.approved_by),reason:'Save a complete showcase and obtain independent approval'},
   {name:'Exact street/map pin confirmed',ok:Boolean(showcase?.location_verified),reason:'Confirm the exact street address and latitude/longitude; never use an estate-centroid substitute'},
   {name:'Marketing authorization verified',ok:sourceAssets.some(x=>x.kind==='marketing_authority'),reason:'Upload the developer/owner authority document privately and obtain approval'},
   {name:'Title evidence verified',ok:sourceAssets.some(x=>x.kind==='title_document'),reason:'Upload actual title/survey or authority evidence privately and obtain approval'},
   {name:'Approved original property media',ok:photos||videoApproved,reason:'Approve a genuine owner-linked photograph or supported property-specific video'},
   {name:'Property submitted for final review',ok:property.status==='review'||property.status==='published',reason:'Move property from draft to review only after checking its source'}
  ];
  return {property,estate,checks,ready:checks.every(x=>x.ok)};
 });
 const ready=list.filter(x=>x.ready).length;
 return <main style={{minHeight:'100vh',background:'#f1f9f3',fontFamily:'Arial,sans-serif',padding:'clamp(20px,5vw,65px)',color:'#123d2f'}}>
  <div style={{maxWidth:1180,margin:'auto'}}>
   <Link href="/admin/properties" style={{color:'#0c8365'}}>← Property Command Center</Link>
   <p style={{letterSpacing:1.4,color:'#e47419',fontWeight:900,fontSize:12}}>LANDSHOP GOVERNANCE · NOT PUBLIC</p>
   <h1 style={{fontSize:'clamp(27px,4vw,44px)'}}>Publication readiness</h1>
   <p style={{color:'#5c7667',maxWidth:850,lineHeight:1.75}}>A factual checklist for every imported or hand-created property. It checks database evidence, not whether the owner has verbally approved. No unchecked record should appear on the public marketplace.</p>
   <div style={{display:'flex',gap:12,flexWrap:'wrap',margin:'22px 0 28px'}}>
    <div style={{padding:18,borderRadius:14,background:'#fff'}}>Inventory records <strong>{list.length}</strong></div>
    <div style={{padding:18,borderRadius:14,background:'#fff'}}>Ready to review <strong>{ready}</strong></div>
    <div style={{padding:18,borderRadius:14,background:'#fff'}}>Published <strong>{list.filter(x=>x.property.status==='published').length}</strong></div>
   </div>
   {bad&&<p role="alert" style={{padding:14,background:'#fff0e7',color:'#984022'}}>A staff evidence dataset was not accessible. Do not use this page to approve publication until permissions are corrected.</p>}
   <div style={{display:'grid',gap:18}}>{list.map(({property,estate,checks,ready})=><article key={property.id} style={{padding:'clamp(19px,3vw,30px)',background:'#fff',border:'1px solid #dcebe0',borderRadius:19}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:15,flexWrap:'wrap'}}>
     <div><small style={{color:'#de6c13',fontWeight:800}}>{property.status.toUpperCase()} · {estate?.name||'Estate unassigned'}</small>
      <h2 style={{margin:'10px 0',fontSize:'clamp(21px,2.6vw,28px)'}}>{property.title}</h2>
      <p>{property.price_is_starting_at?'From ':''}{property.amount_kobo!=null?'₦'+(property.amount_kobo/100).toLocaleString('en-NG'):'Price not entered'}</p>
     </div>
     <div style={{fontWeight:850,color:ready?'#0c8b62':'#d66a14'}}>{ready?'All evidence checks passed':'Evidence incomplete'}</div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:9,margin:'19px 0'}}>
    {checks.map(c=><div key={c.name} style={{padding:11,borderRadius:10,background:c.ok?'#effaf2':'#fff4e9',border:'1px solid '+(c.ok?'#d6e9d9':'#f6e0c5')}}>
     <strong style={{fontSize:12,color:c.ok?'#127a58':'#a45e18'}}>{c.ok?'✓ ':'○ '}{c.name}</strong>{!c.ok&&<p style={{fontSize:11,lineHeight:1.55,margin:'6px 0 0',color:'#6b6c58'}}>{c.reason}</p>}
    </div>)}
    </div>
    <Link href={'/admin/properties/'+property.id} style={{display:'inline-flex',background:'#2ba47a',color:'white',padding:'12px 16px',borderRadius:10,fontWeight:800,fontSize:13}}>Review source and evidence →</Link>
   </article>)}
   {!list.length&&<p>There are no property records to review. Import authentic owner/developer inventory first.</p>}</div>
  </div>
 </main>;
}
