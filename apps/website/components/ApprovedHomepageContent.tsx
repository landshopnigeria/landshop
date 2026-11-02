'use client';
import Link from 'next/link';
import {useRef,useState} from 'react';
import ApprovedArrow from './ApprovedArrow';
import SiteIcon from './SiteIcon';
import LandshopVideo from './LandshopVideo';
import {useCarouselPlayback} from './useCarouselPlayback';
import {landshopProductCards,landshopAboutImages} from '../lib/landshop-brand-media';
import {guides} from '../lib/guides';
import type {FeaturedProperty} from './LandshopHome';

/** Approved reference homepage body. The existing global header, hero slider,
 * property filter, newsletter and global footer are rendered elsewhere untouched. */
const archiveHomes=[
 {title:'Famous Gardens',kind:'ESTATE ARCHIVE',note:'Completed residences and documented estate photography from the Famous Gardens archive.',image:'/owner/2026/famous-completed-homes.webp',url:'/projects/famous-gardens'},
 {title:'Explore the Residences',kind:'RESIDENTIAL DESIGN',note:'See original exterior photographs of homes from our estate archive.',image:'/owner/2026/famous-exterior.webp',url:'/projects/famous-gardens'},
 {title:'Inside the Homes',kind:'INTERIOR GALLERY',note:'Explore authentic residential interiors from the Famous Gardens photo collection.',image:'/owner/2026/famous-living.webp',url:'/projects/famous-gardens'}
];
const projects=[
 {name:'Famous Gardens',status:'CURRENT PROJECT',sub:'Iberekodo, Ibeju-Lekki',image:'/owner/2026/famous-exterior.webp',slug:'famous-gardens',verified:true},
 {name:'Merit Park',status:'ARCHIVED PROJECT',sub:'Past Landshop project',image:'/owner/2026/merit-park-archival-signage.jpg',slug:'merit-park',verified:true},
 {name:'Green Island',status:'PROJECT ARCHIVE',sub:'Historical project information',image:'/owner/2026/garden-entrance-progress.webp',slug:'green-island',verified:false},
 {name:'Maiyegun Beach Estate',status:'ARCHIVED PROJECT',sub:'Past Landshop project',image:'/media/maiyegun0.webp',slug:'maiyegun-beach-estate',verified:true}
];
const locations=[
 {name:'Lagos',slug:'lagos',summary:'Explore estate opportunities and property guidance across Lagos.'},
 {name:'Ogun',slug:'ogun',summary:'Find a thoughtful place for your next home or property plan.'},
 {name:'Edo',slug:'edo',summary:'Explore locations, estates and responsible purchase steps.'},
 {name:'Abuja (FCT)',slug:'abuja',summary:'Understand estate choices and property requirements in the capital.'}
];
const steps=[
 ['01','Explore','Discover the property or product that suits your goal.'],
 ['02','Verify','Review current information, documents, eligibility and risks.'],
 ['03','Inspect','Arrange a confirmed property visit where appropriate.'],
 ['04','Proceed','Begin your secure application with clarity about the next steps.']
];
const reasons=[
 ['Trusted Brand','Property decisions supported by years of company experience.','shield'],
 ['Accessible Options','Different pathways for different ownership goals.','home'],
 ['Experienced Support','A team ready to explain the steps that matter.','users'],
 ['Quality of Choice','Prime and Luxury options with clearly identified terms.','building'],
 ['Flexible Planning','Understand the costs and conditions before you commit.','calendar'],
 ['Growing Communities','Explore estates and opportunities suited to your plans.','compass']
] as const;
const reviews=[
 {quote:'Landshop is authentic and experienced. And your customer service is 100%. From social media to follow-up calls. I was just informed by my account officer that my property has appreciated in price. Great.',name:'Emmanuel Sanusi',region:'Ikotun, Lagos'},
 {quote:'I have confidence in Landshop because I’m always contacted while I’m far away. Of course, I will recommend Landshop to friends and family. I am also excited about the value appreciation. That was indeed fast.',name:'Precious Oluwapelumi Adeleye',region:'Maryland, Lagos'},
 {quote:'You guys are any property investor’s top option. You’ve made land purchase very easy and affordable for everyone, including me. Hearing about the growth of my property is awesome, and knowing I can still continue my payment is wonderful.',name:'Ojo Victor Oluwatimilehin',region:'Surulere, Lagos'}
];
const photos:Record<string,string>={
 develop:'/owner/2026/product-develop.webp',incubate:'/owner/2026/product-incubate.webp',grow:'/owner/2026/product-grow.webp',
 devpro:'/owner/2026/garden-construction.webp',estatepro:'/owner/2026/garden-building-workers.webp'
};
const articleFeed=guides.slice(0,12);
function SectionHead({kicker,title,accent,href,linkLabel}:{kicker:string;title:string;accent?:string;href?:string;linkLabel?:string}){
 return <div className="lsap-head"><div><p className="lsap-kicker">{kicker}</p><h2>{title}<span>{accent||'.'}</span></h2></div>{href&&<Link className="lsap-view" href={href}>{linkLabel||'Explore More'} <ApprovedArrow/></Link>}</div>;
}
export default function ApprovedHomepageContent({featured}:{featured:FeaturedProperty[]}){
 const [guideStart,setGuideStart]=useState(0),[reviewIndex,setReviewIndex]=useState(0),[locationIndex,setLocationIndex]=useState(0);
 const locTrack=useRef<HTMLDivElement>(null);
 const changeLocation=(index:number)=>{
  const track=locTrack.current;
  const cards=track?.querySelectorAll<HTMLElement>('.lsap-location');
  const next=(index+locations.length)%locations.length;
  setLocationIndex(next);
  if(track&&cards?.length){track.scrollTo({left:cards[next].offsetLeft-cards[0].offsetLeft,behavior:'smooth'})}
 };
 const articlePlayback=useCarouselPlayback({count:articleFeed.length,delay:6600,onAdvance:()=>setGuideStart(v=>(v+1)%articleFeed.length)});
 const reviewPlayback=useCarouselPlayback({count:reviews.length,delay:7200,onAdvance:()=>setReviewIndex(v=>(v+1)%reviews.length)});
 const locationPlayback=useCarouselPlayback({count:locations.length,delay:7000,onAdvance:()=>changeLocation(locationIndex+1)});
 return <div className="lsap-home" data-approved-homepage="reference-2026">
  <section className="lsap-section lsap-about" id="about"><div className="lsap-container lsap-about-grid">
   <div className="lsap-about-copy"><p className="lsap-kicker">WHO WE ARE</p><h2>About <span>Us</span><em>.</em></h2>
    <p className="lsap-lead">Landshop is a co-investment real estate brand focused on simplifying property acquisition and making ownership more accessible to Nigerians.</p>
    <p>Through property acquisition, shared ownership interest, mortgage guidance and estate development support, we help people take clearer steps toward ownership.</p>
    <Link className="lsap-button" href="/about">Discover Landshop <ApprovedArrow/></Link>
   </div><div className="lsap-about-images" aria-label="Authentic Landshop construction and estate photographs">
    {landshopAboutImages.map((img,i)=><figure className={'lsap-about-image '+(i===0?'lsap-tall':'')} key={img.src}><img src={img.src} alt={img.alt} loading="lazy" decoding="async"/></figure>)}
   </div></div></section>

  <section className="lsap-section lsap-products" id="products"><div className="lsap-container">
   <SectionHead kicker="OUR PRODUCTS" title="Products"/>
   <div className="lsap-product-grid" role="region" aria-roledescription="carousel" aria-label="Landshop products. Continuously scrolling; hover or focus to pause." tabIndex={0}>
    <div className="lsap-product-track">
     {[0,1].map(copy=><div className="lsap-product-set" aria-hidden={copy===1} key={copy}>
      {landshopProductCards.map((item,index)=><article className="lsap-product" key={item.slug}>
       <div className="lsap-product-image"><img src={photos[item.slug]} alt={item.photoAlt||'Landshop owner-provided construction photography, editorial reference'} loading="lazy" decoding="async"/><small>{String(index+1).padStart(2,'0')} / 05</small></div>
       <div className="lsap-product-text">
        <Link className="lsap-product-logo-link" href={item.href} aria-label={'Explore '+item.name} tabIndex={copy===1?-1:undefined}><img src={item.logo} className="lsap-product-logo" alt={item.name+' product identity'} loading="lazy"/></Link>
        <p className="lsap-product-tag">{item.category}</p><h3><Link href={item.href} tabIndex={copy===1?-1:undefined}>{item.name}</Link></h3><p>{item.description}</p>
       </div>
      </article>)}
     </div>)}
    </div>
   </div>
  </div></section>

  <section className="lsap-promise"><div className="lsap-container lsap-promise-grid"><div><p className="lsap-kicker">THE LANDSHOP PROMISE</p><h2>Everyone deserves <span>affordable property.</span></h2><p>Every property journey should begin with information you understand, choices you can compare and people who can guide the next step.</p><Link className="lsap-button lsap-light-button" href="/properties">Explore Properties <ApprovedArrow/></Link></div><div className="lsap-promise-photo"><img src="/owner/2026/estate-residential.webp" alt="Real Nigerian residential estate in Landshop's archival collection" loading="lazy"/></div></div></section>

  <section className="lsap-section lsap-estates" id="featured-properties"><div className="lsap-container">
   <SectionHead kicker="OUR SELECTED" title="Estates / Properties" href="/properties" linkLabel="View published listings"/>
   <div className="lsap-estate-grid">{featured.length?featured.slice(0,3).map((p,i)=><Link className="lsap-estate-card" href={p.href} key={p.id}>
    <div className="lsap-estate-photo">{p.image?<img src={p.image} alt={'Approved photo of '+p.title} loading="lazy"/>:<div className="lsap-estate-photo-pending">Original unit photo pending approval</div>}<small>PUBLISHED / {String(i+1).padStart(2,'0')}</small></div><div className="lsap-estate-body"><p>{p.propertyType} / {p.location}</p><h3>{p.title}</h3><p>{p.price}</p><strong>View Property <ApprovedArrow/></strong></div>
   </Link>):archiveHomes.map((item,i)=><Link className="lsap-estate-card" href={item.url} key={item.title}>
    <div className="lsap-estate-photo"><img src={item.image} alt={item.note} loading="lazy"/><small>{item.kind}</small></div><div className="lsap-estate-body"><p>FAMOUS GARDENS / IBEJU-LEKKI</p><h3>{item.title}</h3><p>{item.note}</p><strong>Explore Estate Archive <ApprovedArrow/></strong></div>
   </Link>)}</div>
   {!featured.length&&<p className="lsap-provenance">Estate archival photography is not a current unit offer. Specific listings will display automatically once Landshop has verified and published them.</p>}
  </div></section>

  <section className="lsap-section lsap-collections" id="collections"><div className="lsap-container">
   <SectionHead kicker="CURATED COLLECTIONS" title="Prime & Luxury"/>
   <div className="lsap-collection-grid">{[
    {name:'Prime Estates',kind:'PRIME COLLECTION',url:'/collections/prime',src:'/owner/2026/famous-completed-homes.webp',desc:'Places for practical ownership and long-term plans.'},
    {name:'Luxury Estates',kind:'LUXURY COLLECTION',url:'/collections/luxury',src:'/owner/2026/estate-architecture.webp',desc:'Distinctive properties and premium residential design.'}
   ].map(x=><Link href={x.url} className="lsap-collection" key={x.name}><img src={x.src} alt={'Owner-provided Nigerian estate photography for '+x.name} loading="lazy"/><span className="lsap-collection-overlay"/><small>{x.kind}</small><div><h3>{x.name}<em>.</em></h3><p>{x.desc}</p><strong>Explore Collection <ApprovedArrow/></strong></div></Link>)}</div>
  </div></section>

  <section className="lsap-section lsap-prime" id="prime"><div className="lsap-container lsap-prime-grid"><div><p className="lsap-kicker">DISCOVER LANDSHOP PRIME</p><h2><span>Prime</span> Estates<em>.</em></h2><p>Explore the Prime collection through a closer look at the places, designs and property pathways suited to your goals. Every current listing is separately verified before publication.</p><Link className="lsap-button" href="/collections/prime">Explore Prime Estates <ApprovedArrow/></Link></div><LandshopVideo video="prime"/></div></section>

  <section className="lsap-section lsap-projects" id="projects"><div className="lsap-container">
   <SectionHead kicker="OUR WORK" title="Projects" href="/projects" linkLabel="View all projects"/>
   <div className="lsap-project-grid">{projects.map((p,i)=><Link href={'/projects/'+p.slug} className="lsap-project" key={p.slug}>
    <img src={p.image} alt={p.verified?'Authentic owner-provided archive image for '+p.name:'Illustrative Landshop construction archive, not verified media for '+p.name} loading="lazy"/>
    <div className="lsap-project-overlay"/><small>{p.status} / {String(i+1).padStart(2,'0')}</small><div><p>{p.sub}</p><h3>{p.name}</h3>{!p.verified&&<p>Reference imagery, original project photo under review</p>}<strong>Explore Project <ApprovedArrow/></strong></div>
   </Link>)}</div>
  </div></section>

  <section className="lsap-section lsap-locations" id="locations" {...locationPlayback.handlers}><div className="lsap-container">
   <SectionHead kicker="PROPERTY LOCATIONS" title="Explore Locations" href="/locations" linkLabel="View all locations"/>
   <div className="lsap-location-track" ref={locTrack}>{locations.map((loc,i)=><Link href={'/locations?state='+encodeURIComponent(loc.name==='Abuja (FCT)'?'Federal Capital Territory':loc.name)} className="lsap-location" key={loc.slug}><div><small>{String(i+1).padStart(2,'0')} / NIGERIA</small><ApprovedArrow/></div><div><h3>{loc.name}</h3><p>{loc.summary}</p><strong>Explore Location <ApprovedArrow/></strong></div></Link>)}</div>
   <div className="lsap-carousel-foot"><span>{String(locationIndex+1).padStart(2,'0')} / {String(locations.length).padStart(2,'0')}</span><div><button type="button" onClick={()=>changeLocation(locationIndex-1)} aria-label="Previous location"><ApprovedArrow direction="left"/></button><button type="button" onClick={()=>changeLocation(locationIndex+1)} aria-label="Next location"><ApprovedArrow/></button></div></div>
  </div></section>

  <section className="lsap-section lsap-method" id="method"><div className="lsap-container">
   <SectionHead kicker="THE LANDSHOP METHOD" title="Property decisions deserve a better process"/>
   <div className="lsap-method-grid">{steps.map(([n,title,detail])=><article key={n}><small>{n}</small><SiteIcon name={n==='01'?'search':n==='02'?'shield':n==='03'?'calendar':'check'} size={27}/><h3>{title}</h3><p>{detail}</p></article>)}</div>
  </div></section>

  <section className="lsap-section lsap-why" id="why"><div className="lsap-container">
   <SectionHead kicker="WHY LANDSHOP" title="Choose Us"/>
   <div className="lsap-why-grid">{reasons.map(([title,desc,icon],i)=><article key={title}><small>{String(i+1).padStart(2,'0')}</small><SiteIcon name={icon} size={27}/><h3>{title}</h3><p>{desc}</p></article>)}</div>
  </div></section>

  <section className="lsap-testimonials" id="stories" {...reviewPlayback.handlers}><div className="lsap-container lsap-story-grid"><div><p className="lsap-kicker">CLIENT STORIES</p><h2>What our clients <span>say about us.</span></h2><p>Hear from people who have taken steps toward ownership with Landshop.</p><Link className="lsap-button lsap-light-button" href="/contact">Start a conversation <ApprovedArrow/></Link></div><div className="lsap-quote" aria-label="Client testimonials" aria-roledescription="carousel"><span aria-hidden="true">“</span><blockquote>{reviews[reviewIndex].quote}</blockquote><div><div><strong>{reviews[reviewIndex].name}</strong><small>{reviews[reviewIndex].region}</small></div><nav><button type="button" onClick={()=>setReviewIndex(i=>(i+reviews.length-1)%reviews.length)} aria-label="Previous testimonial"><ApprovedArrow direction="left"/></button><span>{reviewIndex+1} / {reviews.length}</span><button type="button" onClick={()=>setReviewIndex(i=>(i+1)%reviews.length)} aria-label="Next testimonial"><ApprovedArrow/></button></nav></div></div></div></section>

  <section className="lsap-section lsap-insights" id="insights" {...articlePlayback.handlers}><div className="lsap-container">
   <SectionHead kicker="EDITORIAL & GUIDES" title="Insights & Updates" href="/insights" linkLabel="View all articles"/>
   <div className="lsap-insight-grid">{[0,1,2].map(offset=>{const a=articleFeed[(guideStart+offset)%articleFeed.length];return <article className="lsap-insight" key={a.slug+'-'+offset}><Link href={'/insights/'+a.slug} className="lsap-insight-image"><img src={a.image} alt={a.imageAlt||'Owner-provided documentary image for '+a.title} loading="lazy"/><small>{a.category}</small></Link><div><h3>{a.title}</h3><p>{a.summary}</p><Link href={'/insights/'+a.slug}>Read Article <ApprovedArrow/></Link></div></article>})}</div>
   <div className="lsap-carousel-foot"><span>{guideStart+1} / {articleFeed.length}</span><div><button type="button" onClick={()=>setGuideStart(i=>(i+articleFeed.length-1)%articleFeed.length)} aria-label="Previous articles"><ApprovedArrow direction="left"/></button><button type="button" onClick={()=>setGuideStart(i=>(i+1)%articleFeed.length)} aria-label="Next articles"><ApprovedArrow/></button></div></div>
  </div></section>
 </div>;
}
