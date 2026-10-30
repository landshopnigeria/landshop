'use client';
import BrandedSelect from 'BrandedSelect';

import {useEffect,useState,useRef} from 'react';
import Link from 'next/link';
import V22HomeSections from './V22HomeSections';
import SiteFooter from './SiteFooter';
import {useRouter} from 'next/navigation';
import {editorialImages} from '../lib/editorial-imagery';
import SiteIcon,{IconChip} from './SiteIcon';
import {getApprovedPublicPropertyImages} from '../lib/public-property-media';
export type FeaturedProperty={id:string,href:string,title:string,location:string,propertyType:string,price:string,image?:string};
const slides=[
 {name:'DEVELOP',title:'Develop.',tagline:'Own Your Future.',copy:'Discover land and homes with confidence. Explore verified property opportunities, transparent guidance and a clearer path to ownership.',image:editorialImages.develop.src,action:'Develop',href:'/develop',alt:editorialImages.develop.alt},
 {name:'INCUBATE',title:'Incubate.',tagline:'Invest in Possibilities.',copy:'Explore property-linked investment opportunities with documented terms, eligibility requirements and a responsible investment review.',image:editorialImages.incubate.src,action:'Invest Now',href:'https://portal.landshopnigeria.com/applications/incubate-investment',alt:editorialImages.incubate.alt},
 {name:'GROW',title:'Grow.',tagline:'Make Homeownership Possible.',copy:'Explore Beta Mortgage and Mortgage Xtra, calculate your potential affordability, and take the next step with informed financial guidance.',image:editorialImages.grow.src,action:'Know Your Earnings',href:'https://portal.landshopnigeria.com/calculator',alt:editorialImages.grow.alt}
] as const;
const products=[
 {title:'Develop',sub:'Own your future',description:'Discover land and housing opportunities, Prime and Luxury selections.',img:editorialImages.develop.src,href:'/develop'},
 {title:'Incubate',sub:'Explore property investment',description:'Review available property-led investment opportunities and their verified terms.',img:editorialImages.incubate.src,href:'/incubate'},
 {title:'Grow',sub:'Make home ownership possible',description:'Understand Beta Mortgage and Mortgage Xtra financing pathways.',img:editorialImages.grow.src,href:'/grow'}
];

export default function Homepage({featured}:{featured:FeaturedProperty[]}){
 const [slide,setSlide]=useState(0),[purpose,setPurpose]=useState('Buy'),[type,setType]=useState(''),[location,setLocation]=useState(''),[price,setPrice]=useState(''),[pause,setPause]=useState(false);
 const router=useRouter();
 const touchStartX=useRef<number|null>(null);
 const goToSlide=(next:number)=>{setSlide((next+slides.length)%slides.length);};
 const onTouchStart=(event:React.TouchEvent<HTMLElement>)=>{touchStartX.current=event.changedTouches[0]?.screenX??null;setPause(true)};
 const onTouchEnd=(event:React.TouchEvent<HTMLElement>)=>{
  const start=touchStartX.current;touchStartX.current=null;
  if(start===null)return;
  const change=event.changedTouches[0]?.screenX-start;
  if(Math.abs(change)>55)goToSlide(slide+(change<0?1:-1));
  setPause(false);
 };
 useEffect(()=>{if(pause)return;const id=setInterval(()=>setSlide(v=>(v+1)%slides.length),7300);return()=>clearInterval(id)},[pause]);

 const current=slides[slide];
 function search(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(purpose==='Sell'){locationAssign('https://portal.landshopnigeria.com');return;}const args=new URLSearchParams({purpose});if(type)args.set('type',type);if(location)args.set('state',location);if(price)args.set('max',price);locationAssign('/properties?'+args.toString())}
 function locationAssign(path:string){if(path.startsWith('http'))window.location.assign(path);else router.push(path)}
 return <main>
  <section className="hero hero-v16" data-landshop-hero="v16-separated-product-slides"
   data-active-product={current.name} aria-roledescription="carousel" aria-label="Landshop product opportunities"
   onMouseEnter={()=>setPause(true)} onMouseLeave={()=>setPause(false)}
   onFocusCapture={()=>setPause(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setPause(false)}}
   onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
   onKeyDown={event=>{if(event.key==='ArrowLeft'){event.preventDefault();goToSlide(slide-1)}if(event.key==='ArrowRight'){event.preventDefault();goToSlide(slide+1)}}}>
   <div className="hero-v16-media" aria-hidden="true">{slides.map((item,i)=>
    <div key={item.name} className={'hero-v16-image '+(slide===i?'is-visible':'')}
      style={{backgroundImage:'url("'+item.image+'")'}} />)}</div>
   <div className="hero-v16-wash" aria-hidden="true"/>
   <div className="hero-v16-inner">
    <div className="hero-v16-content" key={current.name}>
     <span className="eyebrow hero-v16-eyebrow">LANDSHOP <span aria-hidden="true">/</span> {current.name}</span>
     <h1 className="hero-v16-title"><span>{current.title}</span> <strong>{current.tagline}</strong></h1>
     <p className="hero-v16-promise">Everyone Deserves Affordable Property.</p>
     <p className="hero-v16-copy">{current.copy}</p>
     <div className="hero-v16-actions">
      <a className="primary" href="https://portal.landshopnigeria.com">Get Started <span aria-hidden="true">↗</span></a>
      <Link className="hero-v16-secondary" href={current.href}>{current.action} <span aria-hidden="true">→</span></Link>
     </div>
    </div>
    <div className="hero-v16-controls" aria-label="Choose a Landshop product slide">
     <span className="hero-v16-progress-label">{String(slide+1).padStart(2,'0')} <span>/</span> 03</span>
     <div className="hero-v16-indicators">{slides.map((item,i)=>
      <button key={item.name} type="button" aria-label={'Show '+item.name+' slide'}
        aria-current={slide===i?'true':undefined} className={slide===i?'selected':''}
        onClick={()=>goToSlide(i)}><span>{String(i+1).padStart(2,'0')}</span></button>)}</div>
     <div className="hero-v16-arrows"><button type="button" aria-label="Previous slide" onClick={()=>goToSlide(slide-1)}>←</button>
      <button type="button" aria-label="Next slide" onClick={()=>goToSlide(slide+1)}>→</button></div>
    </div>
   </div>
   <span className="hero-v16-edge-note">DEVELOP <span>·</span> INCUBATE <span>·</span> GROW</span>
  </section>
  <form className="glass-search" onSubmit={search} aria-label="Find properties"><div className="search-tabs">{['Buy','Sell','Rent','Shortlet'].map(p=><button type="button" key={p} className={p===purpose?'active':''} aria-pressed={p===purpose} onClick={()=>{setPurpose(p);if(p==='Shortlet')setType('shortlet');else if(type==='shortlet')setType('')}}>{p}</button>)}</div>{purpose==='Sell'?<div className="landshop-sell-panel"><div><strong>Ready to sell or list a property?</strong><p>Sign in to the secure Landshop portal to begin the property listing process. Listings are subject to identity verification, title review and approval before publication.</p></div><a className="primary" href="https://portal.landshopnigeria.com">Start Selling ↗</a></div>:<div className="search-grid"><BrandedSelect aria-label="Property type" value={type} onChange={e=>setType(e.target.value)}><option value="">All property types</option><option value="land">Land</option><option value="house">House</option><option value="apartment">Apartment</option><option value="commercial">Commercial</option></BrandedSelect><BrandedSelect aria-label="Country" defaultValue="Nigeria"><option value="Nigeria">Nigeria</option></BrandedSelect><BrandedSelect aria-label="State or FCT" value={location} onChange={e=>setLocation(e.target.value)}><option value="">All Nigerian states</option>{["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Federal Capital Territory","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"].map(l=><option key={l} value={l}>{l}</option>)}</BrandedSelect><BrandedSelect aria-label="Budget" value={price} onChange={e=>setPrice(e.target.value)}><option value="">Any budget</option><option value="20000000">Up to ₦20 million</option><option value="50000000">Up to ₦50 million</option><option value="100000000">Up to ₦100 million</option></BrandedSelect><button className="primary" type="submit">Search Properties →</button></div>}</form>
  <V22HomeSections featured={featured}/>
  <SiteFooter/>
 </main>;
}
