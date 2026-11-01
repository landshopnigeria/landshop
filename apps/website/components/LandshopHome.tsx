'use client';
import ApprovedArrow from './ApprovedArrow';

import {useEffect,useState,useRef} from 'react';
import Link from 'next/link';
import ApprovedHomepageContent from './ApprovedHomepageContent';
import {useRouter} from 'next/navigation';
import {editorialImages} from '../lib/editorial-imagery';
import SiteIcon from './SiteIcon';
import {useCarouselPlayback} from './useCarouselPlayback';
export type FeaturedProperty={id:string,href:string,title:string,location:string,propertyType:string,price:string,collection?:'Prime'|'Luxury',image?:string};
const slides=[
 {name:'LANDSHOP',subtitle:'Welcome To Landshop',title:'Everyone deserves affordable property.',copy:'Your first home is a home for later and a place to put down roots. Explore your options and take the next step with Landshop.',image:'/owner/2026/slider-01.webp',primary:'Get Started',href:'https://portal.landshopnigeria.com',secondary:'Explore Famous Gardens',secondaryHref:'/projects/famous-gardens'},
 {name:'FAMOUS GARDENS',subtitle:'Welcome To Landshop',title:'Plot Your Future. Save ₦5 million.',copy:'Your Famous Gardens home could be your next chapter. Explore qualifying homes in Iberekodo, Ibeju-Lekki, with clear prices and ownership options.',image:'/owner/2026/slider-02.webp',primary:'Get Started',href:'https://portal.landshopnigeria.com',secondary:'Book Inspection',secondaryHref:'/visit?project=famous-gardens'},
 {name:'FUTURE LOCATIONS',subtitle:'Own a property with ease.',title:'Where would you own next?',copy:'Choose a Nigerian state, tell us why it matters to you and join Landshop’s interest list for future property opportunities.',image:'/owner/2026/slider-03.webp',primary:'Invest Today',href:'/mortgage-calculator',secondary:'Speak With Consultant',secondaryHref:'/visit?topic=consultation'}
] as const;
const titleParts=[['Everyone deserves','affordable property.'],['Plot Your Future.','Save ₦5 million.'],['Where would','you own next?']] as const;
const products=[
 {title:'Develop',sub:'Own your future',description:'Discover land and housing opportunities, Prime and Luxury selections.',img:editorialImages.develop.src,href:'/develop'},
 {title:'Incubate',sub:'Explore property investment',description:'Review available property-led investment opportunities and their verified terms.',img:editorialImages.incubate.src,href:'/incubate'},
 {title:'Grow',sub:'Make home ownership possible',description:'Understand Beta Mortgage and Mortgage Xtra financing pathways.',img:editorialImages.grow.src,href:'/grow'}
];

export default function Homepage({featured}:{featured:FeaturedProperty[]}){
 const [slide,setSlide]=useState(0),[purpose,setPurpose]=useState('Buy'),[typedLength,setTypedLength]=useState(0);
 const router=useRouter();
 const touchStartX=useRef<number|null>(null);
 const goToSlide=(next:number)=>{setSlide((next+slides.length)%slides.length);};
 const playback=useCarouselPlayback({
  count:slides.length,delay:6800,onAdvance:()=>setSlide(i=>(i+1)%slides.length)
 });
 const onTouchStart=(event:React.TouchEvent<HTMLElement>)=>{
  touchStartX.current=event.changedTouches[0]?.screenX??null;
  playback.handlers.onTouchStart();
 };
 const onTouchEnd=(event:React.TouchEvent<HTMLElement>)=>{
  const start=touchStartX.current;touchStartX.current=null;
  playback.handlers.onTouchEnd();
  if(start===null)return;
  const change=event.changedTouches[0]?.screenX-start;
  if(Math.abs(change)>55)goToSlide(slide+(change<0?1:-1));
 };
 useEffect(()=>{const [first,last]=titleParts[slide],total=first.length+1+last.length;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setTypedLength(total);return;}setTypedLength(0);let index=0;const id=setInterval(()=>{index=Math.min(total,index+1);setTypedLength(index);if(index===total)clearInterval(id)},37);return()=>clearInterval(id)},[slide]);

 const current=slides[slide];
 function search(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(purpose==='Sell'){locationAssign('https://portal.landshopnigeria.com');return;}
  const data=new FormData(e.currentTarget);
  const args=new URLSearchParams({purpose});
  const fields=['query','state','city','lga','area','type','min','max','bedrooms','bathrooms','minsize','availability','collection'] as const;
  for(const key of fields){const value=String(data.get(key)||'').trim();if(value)args.set(key,value)}
  locationAssign('/properties?'+args.toString());
 }
 function locationAssign(path:string){if(path.startsWith('http'))window.location.assign(path);else router.push(path)}
 return <main>

  <section className="hero hero-v16 ls-v23-hero" data-landshop-hero="v16-separated-product-slides"
   data-v23-design="cinematic-property-video-preview" data-active-product={current.name}
   aria-roledescription="carousel" aria-label="Landshop product opportunities"
   onMouseEnter={playback.handlers.onMouseEnter} onMouseLeave={playback.handlers.onMouseLeave}
   onFocusCapture={playback.handlers.onFocusCapture} onBlurCapture={playback.handlers.onBlurCapture}
   onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={playback.handlers.onTouchCancel}
   onKeyDown={event=>{if(event.key==='ArrowLeft'){event.preventDefault();goToSlide(slide-1)}if(event.key==='ArrowRight'){event.preventDefault();goToSlide(slide+1)}}}>
   <div className="hero-v16-media ls-v23-hero-media" aria-hidden="true">{slides.map((item,i)=>
     <div key={item.name} className={'hero-v16-image '+(slide===i?'is-visible':'')}
       style={{backgroundImage:'url("'+item.image+'")'}}/>)}</div>
   <div className="hero-v16-wash ls-v23-hero-wash" aria-hidden="true"/>
   <div className="hero-v16-inner ls-v23-hero-inner">
    <div className="hero-v16-content ls-v23-hero-content" key={current.name}>
     <span className="eyebrow hero-v16-eyebrow">{current.subtitle}</span>
     <h1 className="hero-v16-title ls-v23-hero-title" aria-label={current.title}>
      <span>{titleParts[slide][0].slice(0,typedLength)}</span>{typedLength>titleParts[slide][0].length?' ':null}<strong>{titleParts[slide][1].slice(0,Math.max(0,typedLength-titleParts[slide][0].length-1))}</strong>
     </h1>
     <p className="hero-v16-copy ls-v23-hero-description">{current.copy}</p>
     <div className="hero-v16-actions ls-v23-hero-actions">
      <Link className="primary" href={current.href}>{current.primary} <span aria-hidden="true"><ApprovedArrow /></span></Link>
      <Link className="hero-v16-secondary" href={current.secondaryHref}>{current.secondary} <span aria-hidden="true"><ApprovedArrow /></span></Link>
     </div>
    </div>
    <div className="hero-v16-controls ls-v23-hero-controls" aria-label="Choose a Landshop product slide">
     <div className="hero-v16-indicators">{slides.map((item,i)=>
      <button key={item.name} type="button" aria-label={'Show '+item.name+' slide'}
       aria-current={slide===i?'true':undefined} className={slide===i?'selected':''}
       onClick={()=>goToSlide(i)}><span className="ls-v23-control-dot" aria-hidden="true"/></button>)}</div>
     <div className="hero-v16-arrows"><button type="button" aria-label="Previous slide" onClick={()=>goToSlide(slide-1)}><ApprovedArrow direction="left" /></button>
      <button type="button" aria-label="Next slide" onClick={()=>goToSlide(slide+1)}><ApprovedArrow /></button></div>
    </div>
   </div>
  </section>
  <div className="ls-v23-filter-holder">
   <form className="glass-search ls-v23-property-filter" onSubmit={search} aria-label="Find properties" role="search">
    <div className="ls-v23-filter-head">
     <div className="ls-v23-filter-intro"><span aria-hidden="true" className="ls-v23-filter-indicator"/>Ready to find your property? Start here.</div>
     <div className="search-tabs ls-v23-search-tabs" role="group" aria-label="Property transaction">
      {['Buy','Sell','Rent','Shortlet'].map(p=><button type="button" key={p}
       className={p===purpose?'active':''} aria-pressed={p===purpose}
       onClick={()=>setPurpose(p)}>{p}</button>)}
     </div>
    </div>
    {purpose==='Sell'?<div className="landshop-sell-panel ls-v23-sell-panel">
      <div><strong>Ready to sell or list a property?</strong><p>Sign in to the secure Landshop portal to submit a property for identity and title verification before publication.</p></div>
      <a className="primary" href="https://portal.landshopnigeria.com">Start Selling <ApprovedArrow /></a>
    </div>:<>
    <div className="ls-v23-form-grid">
     <label>Location or keyword<input name="query" placeholder="Estate, location or keyword" maxLength={80}/></label>
     <label>State / FCT<select name="state" defaultValue=""><option value="">Select a listed location</option>{["Lagos","Federal Capital Territory","Ogun","Oyo","Delta","Edo","Akwa Ibom","Anambra"].map(x=><option value={x} key={x}>{x}</option>)}</select></label>
     <label>City / Local Government<input name="city" placeholder="City or town" maxLength={60}/></label>
     <label>Area / Estate<input name="area" placeholder="Area or estate" maxLength={70}/></label>
     <label>Property type<select name="type" defaultValue=""><option value="">Any type</option><option value="land">Land</option><option value="apartment">Apartment</option><option value="house">House</option><option value="commercial">Commercial</option></select></label>
     <label>Minimum price (₦)<input type="number" min="0" max="1000000000000" step="1" name="min" placeholder="Min" inputMode="numeric"/></label>
     <label>Maximum price (₦)<input type="number" min="0" max="1000000000000" step="1" name="max" placeholder="Max" inputMode="numeric"/></label>
     <label>Bedrooms<select name="bedrooms" defaultValue=""><option value="">Any</option>{[1,2,3,4,5].map(x=><option key={x} value={x}>{x}+</option>)}</select></label>
     <label>Bathrooms<select name="bathrooms" defaultValue=""><option value="">Any</option>{[1,2,3,4].map(x=><option key={x} value={x}>{x}+</option>)}</select></label>
     <label>Min. property size<input type="number" min="0" max="100000000" step="1" name="minsize" placeholder="m²" inputMode="numeric"/></label>
     <label>Availability<select name="availability" defaultValue=""><option value="">Any status</option><option value="available">Available</option><option value="off_plan">Off-plan</option><option value="completed">Completed</option></select></label>
     <label>More Filters<select name="collection" defaultValue=""><option value="">All collections</option><option value="Prime">Prime</option><option value="Luxury">Luxury</option></select></label>
    </div>
    <div className="ls-v23-search-bottom">
     <span>Verified listings only · Search results use current Landshop property records.</span>
     <button type="submit" className="primary"><SiteIcon name="search" size={20}/> Search Properties</button>
    </div>
    </>}
   </form>
  </div>
  <ApprovedHomepageContent featured={featured}/>

 </main>;
}
