'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {guides as approvedGuides} from '../lib/guides';
import {editorialImages} from '../lib/editorial-imagery';
import LandshopAboutCollage from './LandshopAboutCollage';
import LandshopProductCards from './LandshopProductCards';
import LandshopVideo from './LandshopVideo';

export type V22Property={id:string;href:string;title:string;location:string;propertyType:string;price:string;collection?:'Prime'|'Luxury';image?:string};
const locations=[
 {name:'Lagos',slug:'lagos',text:'Explore estate opportunities and property guidance across Lagos.'},
 {name:'Ogun',slug:'ogun',text:'Find a thoughtful place for your next home or property plan.'},
 {name:'Edo',slug:'edo',text:'Explore locations, verified estates and responsible purchase steps.'},
 {name:'Abuja (FCT)',slug:'abuja',text:'Understand available estate choices and property requirements in the capital.'}
];
const journal=approvedGuides.map(guide=>({title:guide.title,href:'/insights/'+guide.slug,tag:guide.category,image:guide.image,summary:guide.summary}));
const reviews=[
 {quote:'Landshop is authentic and experienced. And your customer service is 100%. From social media to follow-up calls. I was just informed by my account officer that my property has appreciated in price. Great.',name:'Emmanuel Sanusi',region:'Ikotun, Lagos'},
 {quote:'I have confidence in Landshop because I’m always contacted while I’m far away. Of course, I will recommend Landshop to friends and family. I am also excited about the value appreciation. That was indeed fast.',name:'Precious Oluwapelumi Adeleye',region:'Maryland, Lagos'},
 {quote:'You guys are any property investor’s top option. You’ve made land purchase very easy and affordable for everyone, including me. Hearing about the growth of my property is awesome, and knowing I can still continue my payment is wonderful.',name:'Ojo Victor Oluwatimilehin',region:'Surulere, Lagos'}
];
export default function V22HomeSections({featured}:{featured:V22Property[]}){
 const [review,setReview]=useState(0),[guideIndex,setGuideIndex]=useState(0),[locationIndex,setLocationIndex]=useState(0);
 const locationTrack=useRef<HTMLDivElement>(null);
 const goLocation=(value:number)=>{
  const visible=typeof window==='undefined'?3:window.innerWidth<=720?1:window.innerWidth<=1040?2:3;
  const next=Math.max(0,Math.min(locations.length-visible,value));
  setLocationIndex(next);
  const track=locationTrack.current,card=track?.querySelector<HTMLElement>('.ls26-location-card');
  if(track&&card)track.scrollTo({left:next*(card.getBoundingClientRect().width+18),behavior:'smooth'});
 };
 const [journalPaused,setJournalPaused]=useState(false);
 useEffect(()=>{if(journalPaused||journal.length<2||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const timer=setInterval(()=>setGuideIndex(v=>(v+1)%journal.length),6500);return()=>clearInterval(timer)},[journalPaused]);
 const activeReview=reviews[review];
 return <div className="v22-root">
  {/* 2 / About: hero and existing property filter above this component stay intact. */}
  <section className="v22-section v22-about" aria-labelledby="v22-about-title"><div className="v22-container v22-two">
   <div className="v22-copy"><span className="v22-eyebrow ls26-faded-eyebrow">WHO WE ARE</span><h2 id="v22-about-title">About <span className="ls26-heading-green">Us</span><span className="v22-accent">.</span></h2>
    <p>Landshop is a co-investment real estate brand focused on simplifying property acquisition and making ownership more accessible to Nigerians.</p>
    <p>Through property acquisition, shared ownership interest, mortgage guidance and estate development support, we help people take clearer steps toward ownership.</p>

    <Link className="v22-btn" href="/about">Discover Landshop <span aria-hidden="true">→</span></Link>
   </div><LandshopAboutCollage/></div></section>
  {/* Landshop official product artwork. Never substitute stock symbols: all assets are
       supplied by the connected main-branch LandshopProductCards component. */}
  <section className="v22-section v22-muted ls27-products-section" aria-labelledby="v22-products-title"><div className="v22-container">
   <div className="v22-heading"><h2 id="v22-products-title">Product<span className="v22-accent">.</span></h2></div>
   <LandshopProductCards/>
  </div></section>
  <section className="v22-section ls27-affordability" aria-labelledby="ls27-affordability-title">
   <div className="v22-container ls27-affordability-inner">
    <div className="ls27-affordability-copy"><span className="v22-eyebrow">THE LANDSHOP PROMISE</span>
     <h2 id="ls27-affordability-title">Everyone deserves affordable property.</h2>
     <p>Discover acquisition, investment and home-financing options with clear information so you can choose the next step with confidence.</p>
     <Link href="/properties" className="v22-btn">Explore Properties →</Link>
    </div>
    <figure className="ls27-affordability-photo"><img src="/editorial/2026/estate-parking.jpg" alt="Modern estate architectural illustration with parked cars and without artificial palm trees; not a Landshop property listing" loading="lazy" decoding="async"/></figure>
   </div>
  </section>
  {/* 4 / Verified inventory + property collections */}
  <section className="v22-section" id="featured-properties" aria-labelledby="v22-properties-title"><div className="v22-container">
   <div className="v22-heading"><div><span className="v22-eyebrow ls26-faded-eyebrow">OUR SELECTED</span><h2 id="v22-properties-title"><span className="ls26-heading-green">Estates</span> / Properties<span className="v22-accent">.</span></h2></div><Link className="v22-text-link" href="/properties">View published listings →</Link></div>
   <div className="v22-featured">{featured.length?featured.slice(0,3).map(p=><Link href={p.href} className="v22-feature ls27-glass-listing" key={p.id}>
     {p.image?<img src={p.image} alt={'Owner-approved photograph of '+p.title} loading="lazy"/>:<div className="v22-photo-pending">Original media awaiting approval</div>}
     <div className="v22-feature-info">{p.collection&&<span className="ls26-collection-badge">{p.collection}</span>}<span>{p.propertyType} · {p.location}</span><h3>{p.title}</h3><b>{p.price}</b><span className="ls26-card-cta">View Estate <span aria-hidden="true">→</span></span></div></Link>):
    <div className="v22-inventory-empty"><h3>Verified opportunities, not placeholder listings.</h3><p>Only approved, published properties appear here. Explore the marketplace for the latest available inventory.</p><Link href="/properties" className="v22-btn">Browse the marketplace →</Link></div>}
   </div><div className="ls26-collection-heading"><span className="v22-eyebrow ls26-faded-eyebrow">PRIME &amp; LUXURY</span><h3><span className="ls26-heading-green">Prime</span> &amp; Luxury<span className="v22-accent">.</span></h3></div><div className="v22-collections ls27-collections">
    <Link href="/collections/prime" className="ls27-collection-card">
     <div className="ls27-collection-cover ls27-prime-cover"><img src="/editorial/2026/modern-duplex.jpg" alt="White modern duplex in the Nigerian real estate reference collection; editorial only, not a Landshop property" loading="lazy" decoding="async"/></div>
     <span className="ls27-collection-pill">PRIME COLLECTION</span><strong>Prime Estates.</strong>
     <p>Places for practical ownership and long-term plans.</p><em>Explore Prime →</em>
    </Link>
    <Link href="/collections/luxury" className="ls27-collection-card">
     <div className="ls27-collection-cover ls27-luxury-cover"><img src="/editorial/2026/ikate-exterior.jpg" alt="Modern luxury duplex reference in Nigeria, editorial only rather than a Landshop listing" loading="lazy" decoding="async"/></div>
     <span className="ls27-collection-pill">LUXURY COLLECTION</span><strong>Luxury Estates.</strong>
     <p>Distinctive properties with verified premium features.</p><em>Explore Luxury →</em>
    </Link>
   </div>
  </div></section>
  {/* Full Prime collection feature. Video appears ONLY with Prime content, not About. */}
  <section className="v22-section ls27-prime-feature" aria-labelledby="ls27-prime-title">
   <div className="v22-container ls27-prime-layout">
    <div className="ls27-prime-copy">
     <span className="v22-eyebrow ls26-faded-eyebrow">LANDSHOP PRIME</span>
     <h2 id="ls27-prime-title"><span className="ls26-heading-green">Prime</span> Estates<span className="v22-accent">.</span></h2>
     <p>Explore the Prime collection through a closer look at the places, designs and property options that fit your plans. Every current estate listing is separately verified before publication.</p>
     <Link className="v22-btn" href="/collections/prime">Explore Prime Estates <span aria-hidden="true">→</span></Link>
    </div>
    <LandshopVideo video="prime"/>
   </div>
  </section>
  <section className="v22-section ls26-projects-home" aria-labelledby="ls26-projects-home-title"><div className="v22-container"><div className="v22-heading"><div><span className="v22-eyebrow ls26-faded-eyebrow">OUR</span><h2 id="ls26-projects-home-title"><span className="ls26-heading-green">Projects</span><span className="v22-accent">.</span></h2></div><Link className="v22-text-link" href="/projects">View all projects →</Link></div><div className="ls26-grid-three ls26-project-grid">{[['Famous Gardens','Current sales focus','Iberekodo, Ibeju-Lekki','famous-gardens','/media/famous0.webp'],['Merit Park','Past project','Project history and updates','merit-park','/editorial/2026/townhouse.jpg'],['Green Island','Past project','Project history and updates','green-island','/editorial/2026/incubate-reference.jpg'],['Maiyegun Beach Estate','Past project','Project history and updates','maiyegun-beach-estate','/media/maiyegun0.webp']].map(([name,status,location,slug,image])=><Link key={slug} href={'/projects/'+slug} className="ls26-estate-card" style={{textDecoration:'none',color:'inherit'}}><div className="ls26-estate-visual">{image?<><img src={image} alt={slug==="famous-gardens"||slug==="maiyegun-beach-estate"?"Original Landshop project archive: "+name:"Illustrative Nigerian residential photograph, not verified imagery of "+name} loading="lazy" style={{width:"100%",height:"100%",objectFit:"cover"}}/>{(slug==="merit-park"||slug==="green-island")&&<small className="ls29-editorial-watermark">Editorial reference · Project imagery awaiting confirmation</small>}</>:<span>VERIFIED PROJECT IMAGE PENDING</span>}</div><div className="ls26-estate-content"><small className="ls26-eyebrow">{status}</small><h3>{name}</h3><p>{location}</p><strong className="v22-text-link">Explore project →</strong></div></Link>)}</div></div></section>
  {/* Service guidance remains reachable through dedicated Services pages and Insights. */}
  {/* Curated property locations · three visible cards per desktop row; swipe and button navigation. */}
  <section className="v22-section ls26-location-section" aria-labelledby="v22-locations-title"><div className="v22-container">
   <div className="v22-heading"><div><span className="v22-eyebrow ls26-faded-eyebrow">PROPERTY LOCATIONS</span><h2 id="v22-locations-title"><span className="ls26-heading-green">Explore</span> Locations<span className="v22-accent">.</span></h2></div><Link href="/locations" className="v22-text-link">View all locations →</Link></div>
   <div className="ls26-location-carousel"><div className="ls26-location-track" ref={locationTrack} aria-label="Landshop locations carousel" tabIndex={0}>
    {locations.map((item,i)=><Link className="ls26-location-card" href={'/locations/'+item.slug} key={item.slug} aria-label={'Explore '+item.name+' property location'}>
      <div className="ls26-location-card-top"><small>{String(i+1).padStart(2,'0')} / LANDSHOP LOCATION</small><span aria-hidden="true">→</span></div>
      <div><h3>{item.name}</h3><p>{item.text}</p><strong>Explore location <span aria-hidden="true">→</span></strong></div>
     </Link>)}
   </div></div>
   <div className="ls26-location-controls"><span aria-live="polite">{locationIndex+1} / {locations.length}</span><div><button type="button" onClick={()=>goLocation(locationIndex-1)} disabled={locationIndex===0} aria-label="Previous location">←</button><button type="button" onClick={()=>goLocation(locationIndex+1)} aria-label="Next location">→</button></div></div>
  </div></section>
  {/* 7 / Method */}
  <section className="v22-section v22-method" aria-labelledby="v22-method-title"><div className="v22-container">
   <div className="v22-heading"><div><span className="v22-eyebrow">THE LANDSHOP METHOD</span><h2 id="v22-method-title">Property decisions deserve a better process.</h2></div></div>
   <div className="v22-steps">{[['01','Explore','Discover the property or product that suits your goal.'],['02','Verify','Review current information, documents, eligibility and risks.'],['03','Inspect','Arrange a confirmed property visit where appropriate.'],['04','Proceed','Start your secure application with clarity about the next steps.']].map(step=><div key={step[0]}><b>{step[0]}</b><h3>{step[1]}</h3><p>{step[2]}</p></div>)}</div>
  </div></section>
<section className="v22-section ls-why-section" aria-labelledby="ls-why-title"><div className="v22-container">
 <div className="v22-heading"><div><span className="v22-eyebrow ls26-faded-eyebrow">WHY</span><h2 id="ls-why-title"><span className="ls26-heading-green">Choose</span> Us<span className="v22-accent">.</span></h2></div><p>Because your property journey deserves clarity, choice and ongoing support.</p></div>
 <div className="ls-why-grid">{[['Trusted Brand','Property decisions backed by years of company experience.'],['Accessible Options','Different pathways for different ownership goals.'],['Experienced Support','A team ready to explain the steps that matter.'],['Quality of Choice','Prime and Luxury collections with approved details.'],['Flexible Planning','Understand the terms before you commit.'],['Growing Communities','Explore estates and opportunities suited to your plans.']].map(([heading,copy],index)=><article className="ls-why-card" key={heading}><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span><h3>{heading}</h3><p>{copy}</p></article>)}</div>
 </div></section>
  {/* Three-up automatic articles from published Landshop guides. */}
  <section className="v22-section ls27-journal" aria-labelledby="v22-journal-title"><div className="v22-container">
   <div className="v22-heading"><div><span className="v22-eyebrow">INSIGHTS &amp; GUIDES</span><h2 id="v22-journal-title"><span className="ls26-heading-green">Insights</span> &amp; Updates<span className="v22-accent">.</span></h2></div><Link href="/insights" className="v22-text-link">View All Articles →</Link></div>
   <div role="region" aria-roledescription="carousel" aria-label="Latest Landshop articles" onMouseEnter={()=>setJournalPaused(true)} onMouseLeave={()=>setJournalPaused(false)} onFocusCapture={()=>setJournalPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setJournalPaused(false)}}>
    <div className="ls27-articles" aria-live="off">{[0,1,2].map(offset=>{const article=journal[(guideIndex+offset)%journal.length];return <article className="ls27-article" key={article.href+"-"+offset}>
     <Link href={article.href} className="ls27-article-photo"><img src={article.image} alt={"Editorial image for "+article.title} loading="lazy"/></Link>
     <div className="ls27-article-body"><span>{article.tag}</span><h3>{article.title}</h3><p>{article.summary}</p><Link href={article.href} className="v22-text-link">Read Article →</Link></div>
    </article>})}</div>
    <div className="ls27-article-actions"><div className="v22-carousel-buttons"><button onClick={()=>setGuideIndex(v=>(v+journal.length-1)%journal.length)} type="button" aria-label="Previous articles">←</button><span>{guideIndex+1} / {journal.length}</span><button onClick={()=>setGuideIndex(v=>(v+1)%journal.length)} type="button" aria-label="Next articles">→</button></div><Link href="/insights" className="v22-btn">View All Articles →</Link></div>
   </div>
  </div></section>
  {/* 9 / Testimonials and pre-footer CTA; production footer below remains unchanged. */}
  <section className="v22-section v22-final ls29-testimonials" aria-labelledby="v22-voices-title"><div className="v22-container v22-two">
   <div className="ls29-testimonials-copy"><h2 id="v22-voices-title">What our clients say about us.</h2><Link href="/contact" className="v22-btn">Start a conversation →</Link></div>
   <div className="v22-quote" aria-live="polite"><span className="v22-quote-mark">“</span><blockquote>{activeReview.quote}</blockquote><strong>{activeReview.name}</strong><small>{activeReview.region}</small>
    <div className="v22-carousel-buttons"><button onClick={()=>setReview((review+reviews.length-1)%reviews.length)} type="button" aria-label="Previous testimonial">←</button><span>{review+1} / {reviews.length}</span><button onClick={()=>setReview((review+1)%reviews.length)} type="button" aria-label="Next testimonial">→</button></div>
   </div></div></section>
 </div>;
}
