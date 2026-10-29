import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import SiteIcon,{IconChip} from '../../../components/SiteIcon';
import PropertyMediaCarousel from '../../../components/PropertyMediaCarousel';
import MortgageEstimator from '../../../components/MortgageEstimator';
import PropertyInspectionForm from '../../../components/PropertyInspectionForm';
import {MarketFooter} from '../../../components/MarketChrome';
import {money,publicDb,propertyHref,type Listing} from '../../../lib/marketplace';
import {loadShowcase,loadPropertyMedia,propertyAddress,type FeatureRow,type PriceRow,type PublicMedia} from '../../../lib/property-showcase';
import {getApprovedPublicPropertyImages} from '../../../lib/public-property-media';
import '../property-market.css';
import './property-details.css';
export const dynamic='force-dynamic';
const isUuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const display=(n:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(n);
export async function generateMetadata({params}:{params:Promise<{id:string}>}){
 const {id}=await params,db=publicDb();
 if(!db||(!isUuid(id)&&!/^[a-z0-9][a-z0-9-]{2,120}$/.test(id)))return {title:'Landshop Properties'};
 const {data}=await db.from('properties').select('id,slug,title,status,property_type').eq(isUuid(id)?'id':'slug',id).eq('status','published').maybeSingle();
 return {title:data?data.title+' | Landshop Properties':'Landshop Properties',
  description:data?'Explore the official published details, gallery and pricing for this Landshop '+data.property_type+'.':'Verified property opportunities at Landshop.',
  alternates:data?{canonical:'https://www.landshopnigeria.com'+propertyHref(data)}:undefined,
  openGraph:data?{title:data.title,description:'Verified Landshop '+data.property_type+' listing — view official media, features and prices.',url:'https://www.landshopnigeria.com'+propertyHref(data),type:'website' as const}:undefined};
}
export default async function PropertyDetails({params}:{params:Promise<{id:string}>}){
 const {id:routeId}=await params;
 if(!isUuid(routeId)&&!/^[a-z0-9][a-z0-9-]{2,120}$/.test(routeId))notFound();
 const db=publicDb();if(!db)return <main className="mk-layout"><div className="mk-wrap"><h1>Property service unavailable</h1><Link href="/properties">Explore properties</Link></div></main>;
 const {data,error}=await db.from('properties')
 .select('id,slug,title,property_type,amount_kobo,status,estate_id,sale_mode,bedrooms,bathrooms,floor_area_sqm,land_area_sqm,availability,estates(name,state,city,lga,area)')
 .eq(isUuid(routeId)?'id':'slug',routeId).eq('status','published').maybeSingle();
 if(error||!data)notFound();
 const property=data as unknown as Listing,id=property.id;
 if(isUuid(routeId)&&property.slug)redirect(propertyHref(property));
 const [profile,mediaById,similarResult]=await Promise.all([
  loadShowcase(property.id),loadPropertyMedia([property.id]),
  db.from('properties').select('id,title,slug,property_type,amount_kobo').eq('status','published')
    .eq('property_type',property.property_type).neq('id',property.id).limit(3)
 ]);
 const media=mediaById[property.id]||[];
 const photos=media.filter(x=>x.kind==='photo');
 const fallback:PublicMedia[]=getApprovedPublicPropertyImages(id).map((src,i)=>({id:'approved-'+i,property_id:id,kind:'photo',title:'Original verified property photo '+(i+1),src,position:i}));
 const gallery=photos.length?photos:fallback,plans=media.filter(x=>x.kind==='floorplan');
 const locationShort=[property.estates?.area,property.estates?.city,property.estates?.state].filter(Boolean).join(', ')||'Location available on enquiry';
 const address=profile.location_verified?propertyAddress(profile):'Exact property address is available once independently confirmed.';
 const q=new URLSearchParams({subject:'Landshop property enquiry — '+property.title+' / '+id.slice(0,8).toUpperCase(),body:'Hello Landshop,\n\nPlease confirm the availability, property details, inspection options and current pricing for '+property.title+'.\n\nProperty reference: '+id+'\n\nThank you.'});
 const mail='mailto:care@landshopnigeria.com?'+q.toString();
 const spec:FeatureRow[]=[
  {label:'Property type',value:property.property_type[0].toUpperCase()+property.property_type.slice(1)},
  {label:'Estate / Development',value:property.estates?.name||'On request'},
  ...(property.bedrooms!=null?[{label:'Bedrooms',value:String(property.bedrooms)}]:[]),
  ...(property.bathrooms!=null?[{label:'Bathrooms',value:String(property.bathrooms)}]:[]),
  ...(property.floor_area_sqm!=null?[{label:'Floor area',value:property.floor_area_sqm+' m²'}]:[]),
  ...(property.land_area_sqm!=null?[{label:'Land area',value:property.land_area_sqm+' m²'}]:[]),
  ...(property.availability?[{label:'Availability',value:property.availability.replaceAll('_',' ')}]:[]),
  ...profile.features
 ];
 const price:PriceRow[]=profile.pricing.length?profile.pricing:[{name:'Published asking price',amount_ngn:typeof property.amount_kobo==='number'?property.amount_kobo/100:null,details:'Request an updated quotation and full payment terms'}];
 const canMap=profile.location_verified&&profile.latitude!==null&&profile.longitude!==null;
 const latitude=profile.latitude??0,longitude=profile.longitude??0;
 const coordinates=latitude+','+longitude;
 const mapUrl='https://www.google.com/maps?q='+encodeURIComponent(coordinates)+'&z=17&output=embed';
 const mapLink='https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query:coordinates}).toString();
 const mapDirections='https://www.google.com/maps/dir/?'+new URLSearchParams({api:'1',destination:coordinates}).toString();
 return <main className="mk-layout ld-page">
  <div className="ld-shell">
   <nav className="ld-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><SiteIcon name="chevron" size={16}/><Link href="/properties">Properties</Link><SiteIcon name="chevron" size={16}/><span>{property.title}</span></nav>
   <div className="ld-heading"><div><span className="ld-eyebrow">LANDSHOP VERIFIED INVENTORY <span className="ld-dot">·</span> {property.property_type.toUpperCase()}</span><h1>{property.title}</h1><p className="ld-location"><SiteIcon name="pin" size={20}/>{locationShort}<span>Reference: {id.slice(0,8).toUpperCase()}</span></p></div><div className="ld-heading-price"><small>Published price</small><strong>{money(property.amount_kobo)}</strong><span>Confirm current terms before payment</span></div></div>
   <PropertyMediaCarousel title={property.title} images={gallery} videos={profile.videos}/>
   <nav className="ld-section-nav" aria-label="Property sections"><a href="#overview">Overview</a><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#inspection">Inspection</a><a href="#videos">Videos</a><a href="#layout">Layout</a><a href="#map">Map</a></nav>
   <div className="ld-main-grid">
    <div className="ld-main-content">
     <section className="ld-panel" id="overview"><span className="ld-overline">PROPERTY OVERVIEW</span><h2>About this property</h2><p className="ld-description">{profile.description||'This is an approved Landshop property listing. Request its current official brochure, unit specifications and estate information before committing to a purchase or rental agreement.'}</p><div className="ld-stats"><div><SiteIcon name="home" size={23}/><span>Property type</span><strong>{property.property_type}</strong></div><div><SiteIcon name="pin" size={23}/><span>Location</span><strong>{property.estates?.city||'On enquiry'}</strong></div><div><SiteIcon name="shield" size={23}/><span>Listing status</span><strong>Published</strong></div></div></section>
     <section className="ld-panel" id="features"><span className="ld-overline">SPECIFICATIONS</span><h2>Property details &amp; features</h2><p>View the specifications published for this particular property, including any verified developer-supplied details.</p><div className="ld-table-scroll"><table className="ld-data-table"><thead><tr><th scope="col">Feature / Detail</th><th scope="col">Specification</th></tr></thead><tbody>{spec.map((r,i)=><tr key={r.label+'-'+i}><th scope="row">{r.label}</th><td>{r.value}</td></tr>)}</tbody></table></div>{profile.amenities.length>0&&<><h3 className="ld-subtitle">Amenities &amp; facilities</h3><div className="ld-amenities">{profile.amenities.map(v=><span key={v}><SiteIcon name="check" size={17}/>{v}</span>)}</div></>}</section>
     <section className="ld-panel" id="pricing"><span className="ld-overline">PRICE &amp; AVAILABILITY</span><h2>Property pricing</h2><p>Unit types, official prices and accompanying terms are displayed below when approved. These are not payment instructions.</p><div className="ld-table-scroll"><table className="ld-data-table ld-price-table"><thead><tr><th scope="col">Unit / Option</th><th scope="col">Price (NGN)</th><th scope="col">Terms / Notes</th></tr></thead><tbody>{price.map((r,i)=><tr key={r.name+'-'+i}><th scope="row">{r.name}</th><td className="ld-money">{r.amount_ngn===null?'On request':display(r.amount_ngn)}</td><td>{r.details||'Confirm with Landshop'}</td></tr>)}</tbody></table></div><p className="ld-disclaimer">All availability, title claims, charges, instalments, mortgage terms and prices must be independently confirmed through Landshop before payment.</p></section>
     <section className="ld-panel" id="documents"><span className="ld-overline">OWNERSHIP CHECKS</span><h2>Documents &amp; verification</h2><p>Property title records, surveys, approvals and marketing-authority evidence are not publicly exposed. Request authorized documents for independent professional review.</p><Link className="ld-inline-link" href={mail}>Request property documents <SiteIcon name="external" size={17}/></Link></section>
     <section className="ld-panel" id="inspection"><span className="ld-overline">SITE INSPECTION</span><h2>Schedule a Property Inspection</h2><p>Select your preferred date and time. Landshop will review and confirm availability.</p><PropertyInspectionForm propertyId={property.id} title={property.title}/></section>
     <section className="ld-panel" id="related"><span className="ld-overline">MORE OPPORTUNITIES</span><h2>Similar properties</h2>{!similarResult.data?.length?<p>No similar published properties are currently available.</p>:<div className="ld-related">{similarResult.data.map(p=><Link key={p.id} href={propertyHref(p)}><strong>{p.title}</strong><small>{p.property_type} · {money(p.amount_kobo)}</small><SiteIcon name="arrow" size={20}/></Link>)}</div>}</section>
    </div>
    <aside className="ld-sidebars" aria-label="Property enquiries and tools">
     <section className="ld-sidebar ld-sidebar-primary"><span className="ld-overline">ENQUIRE ABOUT THIS PROPERTY</span><h2>Ready to explore further?</h2><p>Speak to Landshop about authentic photos, inspection availability, verified documents and current pricing.</p><a className="ld-side-cta" href={mail}><SiteIcon name="mail" size={20}/> Send an enquiry <SiteIcon name="external" size={18}/></a><a className="ld-side-outline" href="#inspection"><SiteIcon name="calendar" size={20}/> Request inspection</a><a className="ld-side-outline" href="tel:+2349169973359"><SiteIcon name="phone" size={20}/> Call customer care</a><small>Quote reference {id.slice(0,8).toUpperCase()}</small></section>
     <section className="ld-sidebar"><span className="ld-overline">YOUR FINANCING</span><h2>Mortgage estimator</h2><MortgageEstimator priceKobo={property.amount_kobo}/><p className="ld-disclaimer">Estimates are illustrative, not loan approvals.</p></section>
     <section className="ld-sidebar ld-sidebar-help"><IconChip name="shield"/><h2>Buy with clarity</h2><p>Check title, survey, precise location, occupancy and written contract terms. Never transfer funds based only on a property webpage.</p><Link href="/insights">Property buying guides <SiteIcon name="arrow" size={18}/></Link></section>
    </aside>
   </div>
   <section className="ld-bottom-section" id="videos"><div className="ld-section-heading"><span className="ld-overline">WATCH THE PROPERTY</span><h2>Property videos &amp; tours</h2><p>Approved walkthroughs and project footage from YouTube, Instagram, TikTok or Vimeo.</p></div>{profile.videos.length?<div className="ld-video-grid">{profile.videos.map(v=><article className="ld-video-card" key={v.url}><div className="ld-video-frame"><iframe src={v.embed} title={v.title} loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div><div><strong>{v.title}</strong><a href={v.url} target="_blank" rel="noopener noreferrer">Watch on {v.platform} <SiteIcon name="external" size={16}/></a></div></article>)}</div>:<div className="ld-section-empty"><IconChip name="camera"/><p>No approved walkthrough has been attached yet. Ask Landshop for available property footage.</p></div>}</section>
   <section className="ld-bottom-section" id="layout"><div className="ld-section-heading"><span className="ld-overline">SITE &amp; FLOOR PLANS</span><h2>Property layout &amp; floor plans</h2><p>Approved floor plans, plot arrangements and layout documents supplied for this property.</p></div>{plans.length?<div className="ld-floorplans">{plans.map(m=><article className="ld-plan" key={m.id}>{m.src.toLowerCase().endsWith('.pdf')?<div className="ld-pdf-preview"><IconChip name="document"/><span>Approved floor plan PDF</span></div>:<img src={m.src} loading="lazy" alt={m.title} decoding="async"/>}<div><strong>{m.title}</strong><a href={m.src} target="_blank" rel="noopener noreferrer">View full layout <SiteIcon name="external" size={17}/></a></div></article>)}</div>:<div className="ld-section-empty"><IconChip name="document"/><p>Approved floor plans have not been provided for this property.</p></div>}</section>
   <section className="ld-bottom-section ld-map-section" id="map"><div className="ld-section-heading"><span className="ld-overline">VISIT THE PROPERTY</span><h2>Property Location &amp; Google Maps</h2><p>{canMap?'The address and map marker were checked together during Landshop review. Confirm the location again before traveling.':'A map marker is displayed only after the property address and coordinates are independently checked.'}</p></div>{canMap?<><div className="ld-address"><SiteIcon name="pin" size={23}/><div><strong>Property address</strong><p>{address}</p></div><div className="ld-map-actions"><a href={mapLink} target="_blank" rel="noopener noreferrer">Open in Google Maps <SiteIcon name="external" size={17}/></a><a href={mapDirections} target="_blank" rel="noopener noreferrer">Get Directions <SiteIcon name="compass" size={17}/></a></div></div><iframe className="ld-map-iframe" title={'Google Maps location of '+property.title+' at '+address} src={mapUrl} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/></>:<div className="ld-section-empty ld-map-pending"><IconChip name="pin"/><strong>Exact map pin awaiting address verification</strong><p>{locationShort}. Contact Landshop to confirm the site address and arrange an inspection.</p><a href={mail}>Confirm location with Landshop <SiteIcon name="external" size={17}/></a></div>}</section>
  </div>
  <div className="ld-footer-wrap"><MarketFooter/></div>
 </main>;
}
