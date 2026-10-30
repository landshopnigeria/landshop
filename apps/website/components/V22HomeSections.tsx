'use client';
import Link from 'next/link';
import {useState} from 'react';
import {editorialImages} from '../lib/editorial-imagery';
import {IconChip} from './SiteIcon';

export type V22Property={id:string;href:string;title:string;location:string;propertyType:string;price:string;collection?:'Prime'|'Luxury';image?:string};
const paths=[
 {name:'Develop',tag:'01 / ACQUIRE PROPERTY',intro:'Prefer outright property acquisition? Explore structured land and apartment ownership, including Prime and Luxury selections.',href:'/plans/develop',photo:editorialImages.develop.src,logo:'/brand/develop.svg',icon:'building' as const},
 {name:'Incubate',tag:'02 / SHARED OWNERSHIP',intro:'Explore shared ownership with others and register to receive confirmed opportunities and participation terms.',href:'/plans/incubate',photo:editorialImages.incubate.src,logo:'/brand/incubate.svg',icon:'chart' as const},
 {name:'Grow',tag:'03 / HOME FINANCING',intro:'Simplified mortgage pathways for completed and off-plan homes. Compare options and understand the full commitment.',href:'/plans/grow',photo:editorialImages.grow.src,logo:'/brand/grow.svg',icon:'key' as const},
 {name:'DevPro',tag:'04 / ESTATE INFRASTRUCTURE',intro:'Enquire about financing for estate roads, drainage, fencing and other eligible development levies.',href:'/plans/devpro',photo:editorialImages.architecture.src,logo:'/brand/devpro.svg',icon:'building' as const},
 {name:'EstatePro',tag:'05 / CONSTRUCTION FINANCE',intro:'Explore construction funding enquiries for eligible estate subscribers who are ready to build.',href:'/plans/estatepro',photo:editorialImages.residential.src,logo:'/brand/estatepro.svg',icon:'home' as const}
];
const locations=['Lagos','Federal Capital Territory','Ogun','Oyo','Delta','Edo','Akwa Ibom','Anambra'];
const guides=[
 {title:'Before you subscribe to land or a house',href:'/insights/property-due-diligence',tag:'OWNERSHIP',image:editorialImages.residential.src},
 {title:'Understanding mortgage pre-qualification',href:'/insights/mortgage-prequalification',tag:'FINANCING',image:editorialImages.planning.src},
 {title:'How to prepare for a property inspection',href:'/insights/property-inspection',tag:'INSPECTIONS',image:editorialImages.develop.src}
];
const reviews=[
 {quote:'Landshop is authentic and experienced. And your customer service is 100%. From social media to follow up calls.',name:'Emmanuel Sanusi',region:'Ikotun, Lagos'},
 {quote:'I have confidence in Landshop because I’m always contacted whilst I’m far away. And of course, I will recommend Landshop to friends and family.',name:'Precious Oluwapelumi Adeleye',region:'Maryland, Lagos'},
 {quote:'You’ve made land purchase very easy and affordable for everyone, including me.',name:'Ojo Victor Oluwatimilehin',region:'Surulere, Lagos'}
];
const services=[
 {name:'Property Acquisition',intro:'Understand purchase options, document checks and the pathway to an informed property decision.',href:'/services/property-acquisition',photo:editorialImages.develop.src,icon:'home' as const},
 {name:'Property Advisory',intro:'Discuss property decisions, due diligence and requirements before making a commitment.',href:'/services/advisory',photo:editorialImages.team.src,icon:'compass' as const},
 {name:'Mortgage Guidance',intro:'Compare financing pathways and learn what lender review and affordability involve.',href:'/services/mortgage',photo:editorialImages.grow.src,icon:'calculator' as const},
 {name:'Construction Credit',intro:'Explore documented development funding enquiries subject to applicable eligibility.',href:'/services/construction-credit',photo:editorialImages.architecture.src,icon:'building' as const}
];
export default function V22HomeSections({featured}:{featured:V22Property[]}){
 const [review,setReview]=useState(0),[guideIndex,setGuideIndex]=useState(0);
 const activeReview=reviews[review],activeGuide=guides[guideIndex];
 return <div className="v22-root">
  {/* 2 / About: hero and existing property filter above this component stay intact. */}
  <section className="v22-section v22-about" aria-labelledby="v22-about-title"><div className="v22-container v22-two">
   <div className="v22-copy"><span className="v22-eyebrow">WHO WE ARE</span><h2 id="v22-about-title">About Us<span className="v22-accent">.</span></h2>
    <p>Landshop is a co-investment real estate brand focused on simplifying property acquisition and making ownership more accessible to Nigerians.</p>
    <p>Through property acquisition, shared ownership interest, mortgage guidance and estate development support, we help people take clearer steps toward ownership.</p>
    <div className="v22-statline" aria-label="Landshop company figures provided for approval"><span><b>359</b> Properties sold</span><span><b>245</b> Realtors</span><span><b>98%</b> Client satisfaction</span></div>
    <Link className="v22-btn" href="/about">Discover Landshop <span aria-hidden="true">↗</span></Link>
   </div><div className="v22-collage" aria-label="Landshop editorial image collection">
    <img src={editorialImages.architecture.src} alt={editorialImages.architecture.alt} loading="lazy"/>
    <img src={editorialImages.team.src} alt={editorialImages.team.alt} loading="lazy"/>
    <img src={editorialImages.residential.src} alt={editorialImages.residential.alt} loading="lazy"/>
   </div></div></section>
  {/* 3 / Three products */}
  <section className="v22-section v22-muted" aria-labelledby="v22-products-title"><div className="v22-container">
   <div className="v22-heading"><div><span className="v22-eyebrow">OUR PRODUCTS</span><h2 id="v22-products-title">Our Products. Different goals, clearer pathways.</h2></div><p>Explore the pathway that matches your property goal.</p></div>
   <div className="v22-products">{paths.map(item=><article className="v22-product" key={item.name}>
    <Link href={item.href} className="v22-product-image"><img src={item.photo} alt={'Editorial visual representing Landshop '+item.name} loading="lazy"/></Link>
    <span className="v22-icon ls-new-brand-icon"><img src={item.logo} alt={item.name+' product mark'} loading="lazy"/></span><div className="v22-product-body"><small>{item.tag}</small><h3>{item.name}</h3><p>{item.intro}</p><Link href={item.href} className="v22-text-link">Explore {item.name} <span aria-hidden="true">↗</span></Link></div>
   </article>)}</div></div></section>
  {/* 4 / Verified inventory + property collections */}
  <section className="v22-section" id="featured-properties" aria-labelledby="v22-properties-title"><div className="v22-container">
   <div className="v22-heading"><div><span className="v22-eyebrow">PROPERTY MARKETPLACE</span><h2 id="v22-properties-title">Explore property with clarity.</h2></div><Link className="v22-text-link" href="/properties">View published listings ↗</Link></div>
   <div className="v22-featured">{featured.length?featured.slice(0,3).map(p=><Link href={p.href} className="v22-feature" key={p.id}>
     {p.image?<img src={p.image} alt={'Owner-approved photograph of '+p.title} loading="lazy"/>:<div className="v22-photo-pending">Original media awaiting approval</div>}
     <div className="v22-feature-info">{p.collection&&<span className="ls26-collection-badge">{p.collection}</span>}<span>{p.propertyType} · {p.location}</span><h3>{p.title}</h3><b>{p.price}</b></div></Link>):
    <div className="v22-inventory-empty"><h3>Verified opportunities, not placeholder listings.</h3><p>Only approved, published properties appear here. Explore the marketplace for the latest available inventory.</p><Link href="/properties" className="v22-btn">Browse the marketplace ↗</Link></div>}
   </div><div className="v22-collections"><Link href="/collections/prime"><span>PRIME ESTATES</span><strong>Considered homes for everyday living.</strong><em>Explore residential properties ↗</em></Link>
    <Link href="/collections/luxury"><span>LUXURY ESTATES</span><strong>Explore land with the right documentation.</strong><em>Explore Luxury Estates ↗</em></Link></div>
  </div></section>
  <section className="v22-section ls26-projects-home" aria-labelledby="ls26-projects-home-title"><div className="v22-container"><div className="v22-heading"><div><span className="v22-eyebrow">OUR PROJECTS</span><h2 id="ls26-projects-home-title">Explore the places behind Landshop.</h2></div><Link className="v22-text-link" href="/projects">View all projects ↗</Link></div><div className="ls26-grid-three">{[['Famous Gardens','Current sales focus','Iberekodo, Ibeju-Lekki','famous-gardens'],['Merit Park','Past project','Project history and updates','merit-park'],['Green Island','Past project','Project history and updates','green-island'],['Maiyegun Beach Estate','Past project','Project history and updates','maiyegun-beach-estate']].map(([name,status,location,slug])=><Link key={slug} href={'/projects/'+slug} className="ls26-estate-card" style={{textDecoration:'none',color:'inherit'}}><div className="ls26-estate-visual"><span>VERIFIED PROJECT IMAGE PENDING</span></div><div className="ls26-estate-content"><small className="ls26-eyebrow">{status}</small><h3>{name}</h3><p>{location}</p><strong className="v22-text-link">Explore project ↗</strong></div></Link>)}</div></div></section>
  {/* 5 / Service-specific visuals */}
  <section className="v22-section v22-muted" aria-labelledby="v22-services-title"><div className="v22-container">
   <div className="v22-heading"><div><span className="v22-eyebrow">HOW WE HELP</span><h2 id="v22-services-title">Guidance beyond the property listing.</h2></div><p>The right conversation can make the next step clearer.</p></div>
   <div className="v22-service-grid">{services.map(s=><Link className="v22-service" key={s.name} href={s.href}>
    <img src={s.photo} loading="lazy" alt={'Illustrative editorial photography for '+s.name}/><div className="v22-service-body"><span className="v22-icon"><IconChip name={s.icon}/></span><h3>{s.name}</h3><p>{s.intro}</p><b>Explore service ↗</b></div>
   </Link>)}</div></div></section>
  {/* 6 / Locations */}
  <section className="v22-section v22-locations" aria-labelledby="v22-locations-title"><div className="v22-container v22-two">
   <div><span className="v22-eyebrow">EXPLORE NIGERIA</span><h2 id="v22-locations-title">Every location tells a different property story.</h2><p>Discover property information across the states represented in Landshop's historical portfolio. Current listings are shown only where verified and published.</p><Link href="/properties" className="v22-btn">Find a property ↗</Link></div>
   <div className="v22-location-list">{locations.map((state,i)=><Link key={state} href={'/properties?state='+encodeURIComponent(state)}><small>{String(i+1).padStart(2,'0')}</small><strong>{state==='Federal Capital Territory'?'Abuja (FCT)':state}</strong><span>↗</span></Link>)}</div>
  </div></section>
  {/* 7 / Method */}
  <section className="v22-section v22-method" aria-labelledby="v22-method-title"><div className="v22-container">
   <div className="v22-heading"><div><span className="v22-eyebrow">THE LANDSHOP METHOD</span><h2 id="v22-method-title">Property decisions deserve a better process.</h2></div></div>
   <div className="v22-steps">{[['01','Explore','Discover the property or product that suits your goal.'],['02','Verify','Review current information, documents, eligibility and risks.'],['03','Inspect','Arrange a confirmed property visit where appropriate.'],['04','Proceed','Start your secure application with clarity about the next steps.']].map(step=><div key={step[0]}><b>{step[0]}</b><h3>{step[1]}</h3><p>{step[2]}</p></div>)}</div>
  </div></section>
<section className="v22-section ls-why-section" aria-labelledby="ls-why-title"><div className="v22-container">
 <div className="v22-heading"><div><span className="v22-eyebrow">WHY</span><h2 id="ls-why-title">Choose Us.</h2></div><p>Because your property journey deserves clarity, choice and ongoing support.</p></div>
 <div className="ls-why-grid">{[['Trusted Brand','Property decisions backed by years of company experience.'],['Accessible Options','Different pathways for different ownership goals.'],['Experienced Support','A team ready to explain the steps that matter.'],['Quality of Choice','Prime and Luxury collections with approved details.'],['Flexible Planning','Understand the terms before you commit.'],['Growing Communities','Explore estates and opportunities suited to your plans.']].map(([heading,copy],index)=><article className="ls-why-card" key={heading}><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span><h3>{heading}</h3><p>{copy}</p></article>)}</div>
 </div></section>
   {/* 8 / Article spotlight carousel */}
  <section className="v22-section v22-muted" aria-labelledby="v22-journal-title"><div className="v22-container">
   <div className="v22-heading"><div><span className="v22-eyebrow">INSIGHTS & GUIDES</span><h2 id="v22-journal-title">Better questions. Better property decisions.</h2></div><Link href="/insights" className="v22-text-link">Visit the journal ↗</Link></div>
   <div className="v22-editorial"><div className="v22-editorial-photo"><img src={activeGuide.image} alt={'Editorial photograph for '+activeGuide.title} loading="lazy"/></div><div className="v22-editorial-copy"><span className="v22-eyebrow">{activeGuide.tag}</span><h3>{activeGuide.title}</h3><p>Practical guidance to help you understand your next property decision.</p><Link className="v22-btn" href={activeGuide.href}>Read article ↗</Link><div className="v22-carousel-buttons"><button onClick={()=>setGuideIndex((guideIndex+guides.length-1)%guides.length)} type="button" aria-label="Previous article">←</button><span>{guideIndex+1} / {guides.length}</span><button onClick={()=>setGuideIndex((guideIndex+1)%guides.length)} type="button" aria-label="Next article">→</button></div></div></div>
  </div></section>
  {/* 9 / Testimonials and pre-footer CTA; production footer below remains unchanged. */}
  <section className="v22-section v22-final" aria-labelledby="v22-voices-title"><div className="v22-container v22-two">
   <div><span className="v22-eyebrow">CLIENT EXPERIENCES</span><h2 id="v22-voices-title">Real people. Real experiences.</h2><p>Hear from customers featured in Landshop's original corporate deck. These are historical testimonials, not claims about current results.</p><Link href="/contact" className="v22-btn">Start a conversation ↗</Link></div>
   <div className="v22-quote" aria-live="polite"><span className="v22-quote-mark">“</span><blockquote>{activeReview.quote}</blockquote><strong>{activeReview.name}</strong><small>{activeReview.region} · historical deck testimonial</small>
    <div className="v22-carousel-buttons"><button onClick={()=>setReview((review+reviews.length-1)%reviews.length)} type="button" aria-label="Previous testimonial">←</button><span>{review+1} / {reviews.length}</span><button onClick={()=>setReview((review+1)%reviews.length)} type="button" aria-label="Next testimonial">→</button></div>
   </div></div></section>
 </div>;
}
