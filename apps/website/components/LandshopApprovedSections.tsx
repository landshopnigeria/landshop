'use client';
import Link from 'next/link';
import {useRef,useState} from 'react';
import LandshopPrimeFilm from './LandshopPrimeFilm';
import {useCarouselPlayback} from './useCarouselPlayback';
import type {FeaturedProperty} from './LandshopHome';

const photo='/owner/2026/';
const products=[
 {id:'develop',image:'product-develop.webp',brand:'Develop',logo:'/brand/develop-official.png',category:'PROPERTY ACQUISITION',description:'Prefer outright acquisition and instant ownership? Explore Prime and Luxury selections and future land opportunities.',href:'/plans/develop'},
 {id:'incubate',image:'product-incubate.webp',brand:'Incubate',logo:'/brand/incubate-concept.png',category:'SHARED OWNERSHIP',description:'Explore a shared ownership concept with others and understand future participation terms.',href:'/plans/incubate'},
 {id:'grow',image:'product-grow.webp',brand:'Grow',logo:'/brand/grow-official.png',category:'HOMEOWNERSHIP',description:'Explore Mortgage Xtra and Beta Mortgage pathways for approved completed and off-plan homes.',href:'/plans/grow'},
 {id:'devpro',image:'garden-construction.webp',brand:'DevPro',logo:'/brand/devpro-premium.png',category:'ESTATE INFRASTRUCTURE',description:'Enquire about financing eligible estate infrastructure levies, drainage, fencing and roads.',href:'/plans/devpro'},
 {id:'estatepro',image:'garden-building-workers.webp',brand:'EstatePro',logo:'/brand/estatepro-premium.png',category:'CONSTRUCTION FUNDING',description:'Ask about construction finance for eligible estate subscribers who are ready to build.',href:'/plans/estatepro'}
] as const;
const projects=[
 {name:'Famous Gardens',desc:'Our current sales focus',slug:'famous-gardens',cover:photo+'famous-exterior.webp',tag:'NOW EXPLORING',location:'IBEREKODO, IBEJU-LEKKI'},
 {name:'Merit Park',desc:'Project history and available updates.',slug:'merit-park',tag:'PAST PROJECT'},
 {name:'Green Island',desc:'Project history and available updates.',slug:'green-island',tag:'PAST PROJECT'},
 {name:'Maiyegun Beach Estate',desc:'Explore the project story and updates.',slug:'maiyegun-beach-estate',tag:'PAST PROJECT'}
] as const;
const locations=[
 {name:'Lagos',slug:'lagos',description:'Explore estate opportunities and property guidance across Lagos.'},
 {name:'Ogun',slug:'ogun',description:'Find a thoughtful place for your next home or property plan.'},
 {name:'Edo',slug:'edo',description:'Explore locations, verified estates and responsible purchase steps.'},
 {name:'Abuja (FCT)',slug:'abuja',description:'Understand estate choices and property requirements in the capital.'}
] as const;
const reviews=[
 {text:'Landshop is authentic and experienced. And your customer service is 100%. From social media to follow-up calls. I was just informed by my account officer that my property has appreciated in price. Great.',name:'Emmanuel Sanusi',location:'Ikotun, Lagos'},
 {text:'I have confidence in Landshop because I’m always contacted while I’m far away. Of course, I will recommend Landshop to friends and family. I am also excited about the value appreciation. That was indeed fast.',name:'Precious Oluwapelumi Adeleye',location:'Maryland, Lagos'},
 {text:'You guys are any property investor’s top option. You’ve made land purchase very easy and affordable for everyone, including me. Hearing about the growth of my property is awesome, and knowing I can still continue my payment is wonderful.',name:'Ojo Victor Oluwatimilehin',location:'Surulere, Lagos'}
];
const articles=[
 {title:'Buying Your First Home in Nigeria: From Budget to Handover',summary:'An end-to-end guide to understanding the stages of a first residential purchase.',tag:'PROPERTY OWNERSHIP',image:'famous-bedroom.webp',href:'/insights/first-home-nigeria'},
 {title:'Prime vs Luxury Properties: Choosing the Right Fit',summary:'Choose based on function and total ownership commitments rather than labels.',tag:'PROPERTY OWNERSHIP',image:'estate-architecture.webp',href:'/insights/prime-vs-luxury'},
 {title:'How Property Instalment Plans Work and What to Check',summary:'Learn which contractual details matter when property payments are spread over time.',tag:'MORTGAGES & FINANCE',image:'famous-completed-homes.webp',href:'/insights/property-instalment-plans'},
 {title:'Questions Worth Asking Before an Estate Inspection',summary:'What to check before you visit, inspect and make a property decision.',tag:'PROPERTY INSPECTIONS',image:'garden-site-team.webp',href:'/insights'},
 {title:'Understanding Documents Before You Purchase Land',summary:'Make sense of the checks, questions and agreements that matter.',tag:'PROPERTY DUE DILIGENCE',image:'garden-building-workers.webp',href:'/insights'},
 {title:'Mortgage Planning: What Every Homebuyer Should Know',summary:'Consider equity, monthly commitments and written terms before proceeding.',tag:'HOMEOWNERSHIP',image:'product-grow.webp',href:'/insights'}
];
const path=(asset:string)=>photo+asset;

function SectionTitle({eyebrow,children,description,href,cta}:{eyebrow:string,children:React.ReactNode,description?:string,href?:string,cta?:string}){
 return <div className="ls33-heading"><div><span className="ls33-kicker">{eyebrow}</span><h2 className="ls33-title">{children}<i>.</i></h2>{description&&<p>{description}</p>}</div>{href&&<Link className="ls33-text-link" href={href}>{cta||'Explore more'} <span aria-hidden>↗</span></Link>}</div>;
}
const SmallArrow=()=> <span className="ls33-arrow" aria-hidden>↗</span>;
export default function LandshopApprovedSections({featured}:{featured:FeaturedProperty[]}){
 const [review,setReview]=useState(1),[articleIndex,setArticleIndex]=useState(0),[locationIndex,setLocationIndex]=useState(0);
 const locationsRef=useRef<HTMLDivElement>(null);
 const moveLocations=(next:number)=>{
  const max=locations.length-1;
  const index=(next+locations.length)%locations.length;
  setLocationIndex(index);
  const container=locationsRef.current,card=container?.querySelector<HTMLElement>('.ls33-location-card');
  if(container&&card){
   const w=card.getBoundingClientRect().width+18;
   container.scrollTo({left:Math.min(index*w,container.scrollWidth-container.clientWidth),behavior:'smooth'});
  }
 };
 const reviewPlayback=useCarouselPlayback({count:reviews.length,delay:7400,onAdvance:()=>setReview(x=>(x+1)%reviews.length)});
 const locationPlayback=useCarouselPlayback({count:locations.length,delay:6000,onAdvance:()=>moveLocations(locationIndex+1)});
 const articlePlayback=useCarouselPlayback({count:articles.length,delay:6800,onAdvance:()=>setArticleIndex(x=>(x+1)%articles.length)});
 return <div className="ls33-home" id="landshop-home-content">
  <section className="ls33-section ls33-about" id="about" aria-labelledby="ls33-about-title">
   <div className="ls33-container ls33-about-grid">
    <div className="ls33-about-copy"><span className="ls33-kicker">WHO WE ARE</span><h2 className="ls33-title" id="ls33-about-title">About <span>Us</span><i>.</i></h2>
     <p className="ls33-lead">Landshop is a co-investment real estate brand focused on simplifying property acquisition and making ownership more accessible to Nigerians.</p>
     <p>Through property acquisition, shared ownership interest, mortgage guidance and estate development support, we help people take clearer steps toward ownership.</p>
     <Link className="ls33-button" href="/about">Discover Landshop <SmallArrow/></Link>
     <small>Real stories. Real possibilities.</small>
    </div>
    <div className="ls33-about-gallery" aria-label="Landshop Nigerian construction and project imagery">
     <figure className="ls33-about-main"><img src={path('garden-building-workers.webp')} alt="Archival construction work at Famous Gardens in Nigeria" loading="lazy"/><figcaption>01 / SITE WORK</figcaption></figure>
     <figure className="ls33-about-second"><img src="/media/landshop-about-site-team.jpg" alt="Digitally branded Landshop construction discussion with white safety helmets" loading="lazy"/><figcaption>02 / OUR PEOPLE <small>Brand-edited</small></figcaption></figure>
     <figure className="ls33-about-third"><img src={path('estate-architecture.webp')} alt="Completed Nigerian residential estate architecture from the Landshop photo archive" loading="lazy"/><figcaption>03 / THE ESTATE</figcaption></figure>
    </div>
   </div>
  </section>
  <section className="ls33-section ls33-products" id="products" aria-labelledby="ls33-products-title"><div className="ls33-container">
   <div className="ls33-heading"><div><span className="ls33-kicker">OUR</span><h2 className="ls33-title" id="ls33-products-title"><span>Products</span><i>.</i></h2><p>Five pathways designed around the way you want to own, invest and build.</p></div><Link className="ls33-text-link" href="/products">Explore all products <SmallArrow/></Link></div>
   <div className="ls33-products-grid">{products.map((p,index)=><article className="ls33-product-card" key={p.id}>
    <Link href={p.href} className="ls33-product-photo" aria-label={'Explore '+p.brand}><img src={path(p.image)} alt={p.brand+' Nigerian property and construction photography from Landshop archives'} loading="lazy"/><span className="ls33-product-index">{String(index+1).padStart(2,'0')} / 05</span></Link>
    <div className="ls33-product-body">
     <img className="ls33-product-logo" src={p.logo} alt={p.brand+' official or proposed Landshop product mark'} loading="lazy"/>
     <small className="ls33-product-category">{p.category}</small><h3>{p.brand}</h3><p>{p.description}</p>
     <Link href={p.href}>Explore More <SmallArrow/></Link>
    </div>
   </article>)}</div><p className="ls33-product-disclaimer">Availability and finance depend on the published product terms. Registering interest does not guarantee ownership or returns.</p>
  </div></section>
  <section className="ls33-promise" aria-labelledby="ls33-promise-title"><div className="ls33-container ls33-promise-grid"><div>
   <span className="ls33-small-kicker">THE LANDSHOP PROMISE</span><h2 id="ls33-promise-title">Everyone deserves <em>affordable property.</em></h2>
   <p>Discover acquisition, investment and home-financing options with clear information so you can choose the next step with confidence.</p>
   <Link className="ls33-button ls33-button-white" href="/properties">Explore Properties <SmallArrow/></Link>
  </div><img src={path('estate-residential.webp')} alt="Completed Nigerian estate townhouses photographed for Landshop" loading="lazy"/></div></section>
  <section className="ls33-section ls33-estates" id="estates" aria-labelledby="ls33-estates-title"><div className="ls33-container">
   <SectionTitle eyebrow="OUR SELECTED" description="Real moments from the Famous Gardens photo archive. Explore current listings for verified availability and pricing." href="/properties" cta="View published listings"><span>Estates</span> / Properties</SectionTitle>
   <div className="ls33-estate-grid">
    {[{image:'famous-exterior.webp',tag:'ESTATE ARCHIVE',location:'IBEREKODO, IBEJU-LEKKI',title:'Famous Gardens',copy:'Discover the estate, surrounding architecture and ownership options.',small:'Pricing: See verified listings',href:'/projects/famous-gardens',cta:'View Estate'},
     {image:'famous-completed-homes.webp',tag:'RESIDENTIAL DESIGN',location:'FAMOUS GARDENS / PHOTO ARCHIVE',title:'Explore the Residences',copy:'Take a closer look at the completed homes and estate environment.',small:'Not a separate listing',href:'/projects/famous-gardens',cta:'Explore Homes'},
     {image:'famous-living.webp',tag:'INTERIOR GALLERY',location:'FAMOUS GARDENS / PHOTO ARCHIVE',title:'Inside the Homes',copy:'See genuine home interiors from the Famous Gardens collection.',small:'No separate listing or verified price',href:'/projects/famous-gardens',cta:'Explore Project'}
    ].map((v,i)=><article className={'ls33-estate-card ls33-estate-'+i} key={v.title}><Link href={v.href} className="ls33-estate-image"><img src={path(v.image)} alt={v.title+' Nigerian project archive photograph'} loading="lazy"/><span>{v.tag}</span></Link><div className="ls33-estate-info"><small>{v.location}</small><h3>{v.title}</h3><p>{v.copy}</p><div className="ls33-estate-bottom"><span>{v.small}</span><Link href={v.href}>{v.cta} <SmallArrow/></Link></div></div></article>)}
   </div>
   {featured.length>0&&<div className="ls33-inventory"><div><strong>Currently published estates &amp; properties</strong><p>These records come from Landshop’s live, published property inventory.</p></div><div className="ls33-inventory-grid">{featured.slice(0,3).map(p=><Link href={p.href} key={p.id}><span>{p.image&&<img src={p.image} alt={'Approved property photography for '+p.title} loading="lazy"/>}</span><b>{p.title}</b><small>{p.location} · {p.price}</small><em>View property →</em></Link>)}</div></div>}
   <p className="ls33-estate-note">Gallery images illustrate real archived projects; only verified published estate records establish current prices, available units and Prime/Luxury classification.</p>
  </div></section>
  <section className="ls33-section ls33-collections" id="collections" aria-labelledby="ls33-collections-title"><div className="ls33-container">
   <SectionTitle eyebrow="PRIME & LUXURY" description="Two curated ways to explore the home you want to own."><span>Prime</span> &amp; Luxury</SectionTitle>
   <div className="ls33-collection-grid">
    <Link href="/collections/prime" className="ls33-collection-card"><img src={path('famous-completed-homes.webp')} alt="Authentic Nigerian completed homes from Landshop's Famous Gardens archive" loading="lazy"/><div className="ls33-collection-shade"/><div className="ls33-collection-content"><small>01 / PRIME COLLECTION</small><h3>Prime Estates<i>.</i></h3><p>Places for practical ownership and long-term plans.</p><span>Explore Prime <SmallArrow/></span></div></Link>
    <Link href="/collections/luxury" className="ls33-collection-card"><img src={path('estate-architecture.webp')} alt="Authentic Nigerian modern residential townhouses from Landshop archives" loading="lazy"/><div className="ls33-collection-shade"/><div className="ls33-collection-content"><small>02 / LUXURY COLLECTION</small><h3>Luxury Estates<i>.</i></h3><p>Distinctive properties with verified premium features.</p><span>Explore Luxury <SmallArrow/></span></div></Link>
   </div>
   <p className="ls33-collection-note">Collection visuals are authentic archive references. Verify individual estate classification and availability on the property detail page.</p>
  </div></section>
  <section className="ls33-section ls33-prime-film" id="prime" aria-labelledby="ls33-prime-title"><div className="ls33-container ls33-film-grid"><div><span className="ls33-kicker">LANDSHOP PRIME</span><h2 className="ls33-title" id="ls33-prime-title"><span>Prime</span> Estates<i>.</i></h2><p>Explore the Prime collection through a closer look at the places, designs and property options that fit your plans. Every current estate listing is separately verified before publication.</p><Link href="/collections/prime" className="ls33-button">Explore Prime Estates <SmallArrow/></Link></div><div className="ls33-film-card"><LandshopPrimeFilm/></div></div></section>
  <section className="ls33-section ls33-projects" id="projects" aria-labelledby="ls33-projects-title"><div className="ls33-container">
   <SectionTitle eyebrow="OUR" description="Our current sales focus, alongside the places that have shaped our story." href="/projects" cta="View all projects"><span>Projects</span></SectionTitle>
   <div className="ls33-project-grid">
    <Link className="ls33-project-featured" href="/projects/famous-gardens"><img src={path('famous-exterior.webp')} alt="Owner-supplied Famous Gardens exterior photograph" loading="lazy"/><div className="ls33-project-shade"/><span className="ls33-project-marker">NOW EXPLORING</span><div><small>01 / 04 <br/> IBEREKODO, IBEJU-LEKKI</small><h3>Famous Gardens</h3><p>Our current sales focus <SmallArrow/></p></div></Link>
    <div className="ls33-project-archive">{projects.slice(1).map((p,i)=><Link href={'/projects/'+p.slug} key={p.slug} className="ls33-archive-card"><div className="ls33-archive-number">0{i+2}</div><span>PAST PROJECT</span><h3>{p.name}</h3><p>{p.desc}</p><small>Verified project photography pending</small><strong>Explore project <SmallArrow/></strong></Link>)}</div>
   </div>
  </div></section>
  <section className="ls33-section ls33-locations" id="locations" aria-labelledby="ls33-locations-title" {...locationPlayback.handlers}><div className="ls33-container">
   <div className="ls33-heading"><div><span className="ls33-kicker">PROPERTY LOCATIONS</span><h2 className="ls33-title" id="ls33-locations-title"><span>Explore</span> Locations<i>.</i></h2><p>Think about where your next chapter should begin.</p></div><div className="ls33-controls"><button onClick={()=>moveLocations(locationIndex-1)} aria-label="Previous property location">←</button><button onClick={()=>moveLocations(locationIndex+1)} aria-label="Next property location">→</button></div></div>
   <div className="ls33-location-viewport"><div className="ls33-location-track" ref={locationsRef} tabIndex={0} aria-label="Landshop locations carousel">{locations.map((item,i)=><Link className="ls33-location-card" href={'/locations/'+item.slug} key={item.slug}><div className="ls33-location-top"><small>{String(i+1).padStart(2,'0')} / NIGERIA</small><span aria-hidden>{item.name[0]}</span></div><div><h3>{item.name}</h3><p>{item.description}</p><strong>Explore location <SmallArrow/></strong></div></Link>)}</div></div>
   <div className="ls33-location-bottom"><span>{String(locationIndex+1).padStart(2,'0')} / 04</span><span>DRAG TO EXPLORE ↗</span></div>
  </div></section>
  <section className="ls33-section ls33-method" id="method" aria-labelledby="ls33-method-title"><div className="ls33-container"><SectionTitle eyebrow="THE LANDSHOP METHOD">Property decisions deserve a better process</SectionTitle><div className="ls33-method-grid">{[
    ['01','Explore','Discover the property or product that suits your goal.'],['02','Verify','Review current information, documents, eligibility and risks.'],
    ['03','Inspect','Arrange a confirmed property visit where appropriate.'],['04','Proceed','Start your secure application with clarity about the next steps.']
   ].map(x=><article className="ls33-method-card" key={x[0]}><span>{x[0]}</span><div className="ls33-method-icon" aria-hidden>↗</div><h3>{x[1]}</h3><p>{x[2]}</p></article>)}</div></div></section>
  <section className="ls33-section ls33-why" id="why" aria-labelledby="ls33-why-title"><div className="ls33-container"><SectionTitle eyebrow="WHY" description="Because your property journey deserves clarity, choice and ongoing support."><span>Choose</span> Us</SectionTitle><div className="ls33-why-grid">{[
   ['Trusted Brand','Property decisions backed by years of company experience.'],['Accessible Options','Different pathways for different ownership goals.'],['Experienced Support','A team ready to explain the steps that matter.'],
   ['Quality of Choice','Prime and Luxury collections with approved details.'],['Flexible Planning','Understand the terms before you commit.'],['Growing Communities','Explore estates and opportunities suited to your plans.']
  ].map((item,i)=><article className="ls33-why-card" key={item[0]}><span className="ls33-why-number">{String(i+1).padStart(2,'0')}</span><h3>{item[0]}</h3><p>{item[1]}</p></article>)}</div></div></section>
  <section className="ls33-testimonials" id="stories" aria-labelledby="ls33-stories-title"><div className="ls33-container ls33-testimonial-grid"><div><span className="ls33-kicker">REAL CLIENT STORIES</span><h2 id="ls33-stories-title">What our clients say about us.</h2><p>Feedback shared by Landshop clients.</p><Link className="ls33-button ls33-button-white" href="/contact">Start a conversation <SmallArrow/></Link></div>
   <div className="ls33-review-card" {...reviewPlayback.handlers}><span className="ls33-quote-mark">“</span><blockquote>{reviews[review].text}</blockquote><div className="ls33-review-bottom"><div><strong>{reviews[review].name}</strong><small>{reviews[review].location}</small></div><div className="ls33-controls"><button onClick={()=>setReview(x=>(x+reviews.length-1)%reviews.length)} aria-label="Previous testimonial">←</button><span>{String(review+1).padStart(2,'0')} / 03</span><button onClick={()=>setReview(x=>(x+1)%reviews.length)} aria-label="Next testimonial">→</button></div></div></div>
  </div></section>
  <section className="ls33-section ls33-insights" id="insights" aria-labelledby="ls33-insights-title" {...articlePlayback.handlers}><div className="ls33-container">
   <SectionTitle eyebrow="INSIGHTS & GUIDES" description="Useful knowledge for a more confident property journey." href="/insights" cta="View all articles"><span>Insights</span> &amp; Updates</SectionTitle>
   <div className="ls33-articles">{[0,1,2].map(offset=>{const a=articles[(articleIndex+offset)%articles.length];return <article className="ls33-insight-card" key={a.title}><Link href={a.href} className="ls33-insight-photo"><img src={path(a.image)} alt={a.title+' : authentic Nigerian Landshop archival photography'} loading="lazy"/><small>{a.tag}</small></Link><div className="ls33-insight-content"><h3>{a.title}</h3><p>{a.summary}</p><Link href={a.href}>Read Article <SmallArrow/></Link></div></article>})}</div>
   <div className="ls33-insight-controls"><span>{String(articleIndex+1).padStart(2,'0')} / 06</span><span className="ls33-progress"><i style={{width:((articleIndex+1)/articles.length*100)+'%'}}/></span><div className="ls33-controls"><button aria-label="Previous article" onClick={()=>setArticleIndex(x=>(x+articles.length-1)%articles.length)}>←</button><button aria-label="Next article" onClick={()=>setArticleIndex(x=>(x+1)%articles.length)}>→</button></div></div>
  </div></section>
 </div>;
}
