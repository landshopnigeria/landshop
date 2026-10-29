
import Link from 'next/link';
import SiteIcon,{IconChip} from '../../../components/SiteIcon';
import {notFound} from 'next/navigation';
import {MarketHeader,MarketFooter} from '../../../components/MarketChrome';
import MortgageEstimator from '../../../components/MortgageEstimator';
import {money,publicDb,type Listing} from '../../../lib/marketplace';
import '../property-market.css';
export const dynamic='force-dynamic';
function uuid(s:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)}
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!uuid(id))return {title:'Property | Landshop Nigeria'};const db=publicDb();if(!db)return {title:'Property | Landshop Nigeria'};const {data}=await db.from('properties').select('title,property_type,status').eq('id',id).eq('status','published').maybeSingle();return {title:data?data.title+' | Landshop Properties':'Property | Landshop Nigeria',description:data?'Published '+data.property_type+' listing in the Landshop property marketplace.':'Explore documented property opportunities.'}}
export default async function PropertyDetails({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!uuid(id))notFound();
 const db=publicDb();if(!db)return <main className="mk-layout"><MarketHeader/><div className="mk-wrap"><h1>Property service temporarily unavailable</h1><Link href="/properties">Back to property marketplace</Link></div></main>;
 const {data,error}=await db.from('properties').select('id,title,property_type,amount_kobo,status,estate_id,estates(name,state,city)').eq('id',id).eq('status','published').maybeSingle();
 if(error||!data)notFound();
 const prop=data as unknown as Listing,loc=[prop.estates?.city,prop.estates?.state].filter(Boolean).join(', ');
 const {data:similar}=await db.from('properties').select('id,title,property_type,amount_kobo,status').eq('status','published').eq('property_type',prop.property_type).neq('id',id).order('created_at',{ascending:false}).limit(3);
 const q=new URLSearchParams({subject:'Enquiry about '+prop.title+' ('+prop.id.slice(0,8)+')',body:'Hello Landshop,\n\nPlease send current verified details, viewing options and approved payment terms for '+prop.title+'.\n\nReference: '+prop.id+'\n\nThank you.'});
 return <main className="mk-layout"><MarketHeader/>
 <section className="mk-hero" style={{minHeight:150}}><div><small><Link href="/">HOME</Link> / <Link href="/properties">PROPERTIES</Link> / {prop.title}</small><h1>Find your next <em>opportunity.</em></h1></div></section>
 <div className="mk-wrap">
  <div className="mk-detail-head"><div><span style={{color:'#007e64',fontSize:12,fontWeight:800}}>PUBLISHED PROPERTY · {prop.property_type.toUpperCase()}</span><h1>{prop.title}</h1><p className="mk-location"><SiteIcon name="pin" size={18}/>{loc||'Location details available on enquiry'} · Ref: {prop.id.slice(0,8).toUpperCase()}</p></div><div><small>Current published price</small><br/><strong>{money(prop.amount_kobo)}</strong></div></div>
  <div className="mk-detail-grid"><div>
   <div className="mk-gallery"><div className="mk-gallery-main"><div className="mk-gallery-pending"><IconChip name="camera"/><strong>Property media pending approval</strong><p>Original developer / property owner photographs only</p></div></div><div className="mk-gallery-side"><div>Approved property gallery will appear here</div><div>Virtual tours only when independently supplied and verified</div></div></div>
   <nav className="mk-details-nav" aria-label="Property sections">{['Overview','Specifications','Payment','Documents','Location','FAQ','Similar'].map(x=><a href={'#'+x.toLowerCase()} key={x}>{x}</a>)}</nav>
   <section className="mk-card-panel" id="overview"><h2>About {prop.title}</h2><p>This published {prop.property_type} belongs to the Landshop property inventory. Request the current property brochure, available units and viewing information before committing any payment.</p></section>
   <section className="mk-card-panel" id="specifications"><h2>Key specifications</h2><div className="mk-specs"><div><span>Property type</span>{prop.property_type}</div><div><span>Estate</span>{prop.estates?.name||'On enquiry'}</div><div><span>State</span>{prop.estates?.state||'On enquiry'}</div><div><span>City</span>{prop.estates?.city||'On enquiry'}</div><div><span>Reference</span>{prop.id.slice(0,8).toUpperCase()}</div><div><span>Publication status</span>Published</div></div><p className="mk-legal-note">Bedrooms, area, title, utilities and amenities appear only when supporting verified records are available.</p></section>
   <section className="mk-card-panel" id="payment"><h2>Payment plan</h2><p>Ask Landshop for current price, deposit requirements, charges and written terms. Mortgages and payment plans require separate approved agreements. No payment or return is guaranteed here.</p></section>
   <section className="mk-card-panel" id="documents"><h2>Property documents</h2><p>Private title and survey evidence is not publicly downloadable. Request authorized copies for independent legal review. Publication does not imply independent verification of every title claim.</p><a href={'mailto:care@landshopnigeria.com?'+q.toString()}>Request authorized documentation →</a></section>
   <section className="mk-card-panel" id="location"><h2>Property location</h2><p>{loc||'Please contact Landshop for location information.'}</p><p>A property pin will only appear once accurate, approved coordinates are available.</p></section>
   <section className="mk-card-panel" id="faq"><h2>Frequently asked questions</h2><details><summary>Can I arrange an inspection?</summary><p>Request an inspection. A booking is confirmed only after a Landshop staff member accepts the proposed visit.</p></details><details><summary>Which documents should I review?</summary><p>Ask about the latest title, survey, approvals and property-specific terms, and arrange independent legal advice.</p></details><details><summary>Is financing guaranteed?</summary><p>No. An affordability estimate is not a lender offer or an approved loan.</p></details></section>
   <section className="mk-card-panel" id="similar"><h2>Similar published properties</h2>{!similar?.length?<p>No similar approved listings are available right now.</p>:<div className="mk-property-grid">{similar.map(x=><div key={x.id}><strong>{x.title}</strong><p>{money(x.amount_kobo)}</p><Link href={'/properties/'+x.id}>View listing ↗</Link></div>)}</div>}</section>
  </div>
  <aside className="mk-aside"><h2>Enquire about this property</h2><p>Ask about availability, documentation or inspection. Do not send passwords or sensitive documents by ordinary email.</p><a className="mk-btn" href={'mailto:care@landshopnigeria.com?'+q.toString()}>Enquire now ↗</a><a className="outline-link" href="https://portal.landshopnigeria.com/applications/develop-inspection">Request property inspection</a><hr style={{border:0,borderTop:'1px solid #e2ebe6',margin:'22px 0'}}/><h2>Mortgage calculator</h2><MortgageEstimator priceKobo={prop.amount_kobo}/></aside>
  </div><MarketFooter/></div></main>;
}
