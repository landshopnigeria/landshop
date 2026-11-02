import Link from 'next/link';
import SiteIcon from './SiteIcon';
import PropertyMediaCarousel from './PropertyMediaCarousel';
import {MarketFooter} from './MarketChrome';
import {parsePropertyVideo} from '../lib/property-video';
import type {PortfolioEstate} from '../lib/estate-portfolio';
import type {PublicMedia} from '../lib/property-showcase';
import '../app/properties/property-market.css';
import '../app/properties/[id]/property-details.css';

/** Informational property archive. Reuses the approved property page structure without
 * bypassing the inventory, title and price publication approval workflow. */
export default function EditorialEstatePropertyDetails({estate:e}:{estate:PortfolioEstate}){
 const photos:PublicMedia[]=e.images.filter(x=>x.kind!=='layout').map((v,i)=>({
  id:e.slug+'-'+i,property_id:e.slug,kind:'photo',title:v.caption,src:v.src,position:i
 }));
 const plans=e.images.filter(x=>x.kind==='layout');
 const videos=e.videos.map(x=>parsePropertyVideo(x.url,x.title)).filter((x):x is NonNullable<typeof x>=>x!==null);
 const inspection='/visit?project='+encodeURIComponent(e.slug);
 const enquiry='/contact?project='+encodeURIComponent(e.slug);
 const related=[
  {href:'/projects/'+e.slug,text:'Explore project history'},
  {href:'/estates',text:'Browse other estates'},
  {href:'/properties',text:'Explore verified property listings'}
 ];
 return <main className="mk-layout ld-page">
  <div className="ld-shell">
   <nav className="ld-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><SiteIcon name="chevron" size={16}/><Link href="/properties">Properties</Link><SiteIcon name="chevron" size={16}/><span>{e.name}</span></nav>
   <div className="ld-heading"><div><span className="ld-eyebrow">LANDSHOP ESTATE SHOWCASE <span className="ld-dot">·</span> {e.category.toUpperCase()}</span><h1>{e.name}</h1><p className="ld-location"><SiteIcon name="pin" size={20}/>{e.location}</p></div><div className="ld-heading-price"><small>Official current price</small><strong>On request</strong><span>No verified inventory or current selling price represented</span></div></div>
   <PropertyMediaCarousel title={e.name} images={photos} videos={videos}/>
   <nav className="ld-section-nav" aria-label="Estate sections"><a href="#overview">Overview</a><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#inspection">Inspection</a><a href="#videos">Videos</a><a href="#layout">Layout</a><a href="#map">Map</a></nav>
   <div className="ld-main-grid"><div className="ld-main-content">
    <section className="ld-panel" id="overview"><span className="ld-overline">ESTATE OVERVIEW</span><h2>{e.strapline}</h2><p className="ld-description">{e.overview}</p><div className="ld-stats"><div><SiteIcon name="home" size={23}/><span>Property category</span><strong>{e.propertyType}</strong></div><div><SiteIcon name="pin" size={23}/><span>Location</span><strong>{e.location}</strong></div><div><SiteIcon name="shield" size={23}/><span>Portfolio status</span><strong>Estate showcase</strong></div></div></section>
    <section className="ld-panel" id="features"><span className="ld-overline">PROPERTY INFORMATION</span><h2>Estate details &amp; features</h2><p>{e.summary}</p><div className="ld-table-scroll"><table className="ld-data-table"><thead><tr><th scope="col">Item</th><th scope="col">Information</th></tr></thead><tbody>{[...e.facts,['Developer',e.developer],['Landshop role',e.role],['Access',e.access],['Plot sizes',e.plotSizes],['Title claim',e.titleInformation]].map(([k,v],i)=><tr key={k+'-'+i}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody></table></div><h3 className="ld-subtitle">Planned and advertised amenities</h3><div className="ld-amenities">{e.amenities.map(x=><span key={x}><SiteIcon name="check" size={17}/>{x}</span>)}</div></section>
    <section className="ld-panel" id="pricing"><span className="ld-overline">MARKET PRICE REFERENCES</span><h2>Pricing &amp; availability</h2><p>Historical and external asking prices are shown for research only. These are not current Landshop sales offers.</p><div className="ld-table-scroll"><table className="ld-data-table ld-price-table"><thead><tr><th scope="col">Reference</th><th scope="col">Indicative amount</th><th scope="col">Status</th></tr></thead><tbody>{e.pricing.map(([label,amount,note])=><tr key={label}><th scope="row">{label}</th><td className="ld-money">{amount}</td><td>{note}</td></tr>)}</tbody></table></div><p className="ld-disclaimer">{e.disclaimer}</p></section>
    <section className="ld-panel" id="documents"><span className="ld-overline">LEGAL DUE DILIGENCE</span><h2>Documents and title verification</h2><p>{e.titleInformation} Landshop will provide verified documents and authorized marketing or allocation information where available. Independent legal review is recommended.</p><Link className="ld-inline-link" href={enquiry}>Request documents <SiteIcon name="external" size={17}/></Link></section>
    <section className="ld-panel" id="inspection"><span className="ld-overline">BOOK AN INSPECTION</span><h2>Schedule an estate inspection</h2><p>Select an appointment through the existing Landshop booking process. Your request is not a confirmed booking until our team responds.</p><Link className="ld-side-cta" href={inspection}><SiteIcon name="calendar" size={20}/> Request an inspection <SiteIcon name="external" size={17}/></Link></section>
    <section className="ld-panel" id="related"><span className="ld-overline">CONTINUE EXPLORING</span><h2>Related pages</h2><div className="ld-related">{related.map(x=><Link href={x.href} key={x.href}><strong>{x.text}</strong><SiteIcon name="arrow" size={18}/></Link>)}</div></section>
   </div><aside className="ld-sidebars" aria-label="Estate information and enquiry">
    <section className="ld-sidebar ld-sidebar-primary"><span className="ld-overline">ESTATE ENQUIRIES</span><h2>Explore with confidence</h2><p>Request a current Landshop quotation, title records, physical site status, inspection and authorized acquisition terms.</p><Link className="ld-side-cta" href={enquiry}><SiteIcon name="mail" size={18}/> Enquire about this estate</Link><Link className="ld-side-outline" href={inspection}><SiteIcon name="calendar" size={18}/> Book inspection</Link><a className="ld-side-outline" href="tel:+2349169973359"><SiteIcon name="phone" size={18}/> Call Landshop</a></section>
    <section className="ld-sidebar"><span className="ld-overline">ESTATE STATUS</span><h2>Portfolio record</h2><p>{e.status}</p><p className="ld-disclaimer">Design visuals show concepts; archive photographs do not confirm today's condition.</p></section>
    <section className="ld-sidebar ld-sidebar-categories"><span className="ld-overline">PROPERTY TAGS</span><h2>Estate characteristics</h2><div className="ld-property-tags">{e.highlights.map(x=><span key={x}>{x}</span>)}</div></section>
   </aside></div>
   <section className="ld-bottom-section" id="videos"><div className="ld-section-heading"><span className="ld-overline">ESTATE VIDEO</span><h2>Project videos &amp; virtual tours</h2><p>Owner-supplied YouTube footage, where its estate association has been confirmed.</p></div>{videos.length?<div className="ld-video-grid">{videos.map(v=><article key={v.url} className="ld-video-card"><div className="ld-video-frame"><iframe src={v.embed} title={v.title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div><div><strong>{v.title}</strong><a href={v.url} rel="noopener noreferrer" target="_blank">Watch on YouTube</a></div></article>)}</div>:<p>No estate-specific video has been positively matched. Request a verified walkthrough from Landshop.</p>}</section>
   <section className="ld-bottom-section" id="layout"><div className="ld-section-heading"><span className="ld-overline">ESTATE PLANS</span><h2>Layouts &amp; planning documents</h2><p>Illustrative plans are not approved cadastral surveys or proof of planning consent.</p></div>{plans.length?<div className="ld-floorplans">{plans.map(p=><article className="ld-plan" key={p.src}><img src={p.src} alt={p.caption} loading="lazy"/><div><strong>{p.caption}</strong><a href={p.src} target="_blank" rel="noopener noreferrer">View layout</a></div></article>)}</div>:<p>Request the current approved survey or estate layout directly from Landshop.</p>}</section>
   <section className="ld-bottom-section ld-map-section" id="map"><div className="ld-section-heading"><span className="ld-overline">ESTATE LOCATION</span><h2>Location &amp; Google Maps</h2><p>{e.location}. A precise property map pin will be available after verification of an official address and coordinates.</p></div><div className="ld-section-empty ld-map-pending"><SiteIcon name="pin" size={24}/><strong>Exact estate map pin awaiting verification</strong><p>{e.access}</p><Link href={enquiry}>Request confirmed directions <SiteIcon name="external" size={17}/></Link></div></section>
  </div><div className="ld-footer-wrap"><MarketFooter includeUpdates={false}/></div>
 </main>;
}
