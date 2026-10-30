'use client';
import {useEffect,useState,useRef} from 'react';
import Link from 'next/link';
import V22HomeSections from './V22HomeSections';
import SiteFooter from './SiteFooter';
import {useRouter} from 'next/navigation';
import {editorialImages} from '../lib/editorial-imagery';
import SiteIcon from './SiteIcon';
export type FeaturedProperty={id:string,href:string,title:string,location:string,propertyType:string,price:string,image?:string};
const slides=[
 {name:'DEVELOP',title:'Develop.',tagline:'Own Your Future.',copy:'Discover land and homes with confidence. Explore verified property opportunities, transparent guidance and a clearer path to ownership.',image:'/media/deck-building.webp',action:'Develop',href:'/develop',alt:editorialImages.develop.alt},
 {name:'INCUBATE',title:'Incubate.',tagline:'Invest in Possibilities.',copy:'Explore property-linked investment opportunities with documented terms, eligibility requirements and a responsible investment review.',image:'/media/deck-investment.webp',action:'Invest Now',href:'https://portal.landshopnigeria.com/applications/incubate-investment',alt:editorialImages.incubate.alt},
 {name:'GROW',title:'Grow.',tagline:'Make Homeownership Possible.',copy:'Explore Beta Mortgage and Mortgage Xtra, calculate your potential affordability, and take the next step with informed financial guidance.',image:'/media/deck-mortgage.webp',action:'Know Your Earnings',href:'https://portal.landshopnigeria.com/calculator',alt:editorialImages.grow.alt}
] as const;
const products=[
 {title:'Develop',sub:'Own your future',description:'Discover land and housing opportunities, Prime and Luxury selections.',img:editorialImages.develop.src,href:'/develop'},
 {title:'Incubate',sub:'Explore property investment',description:'Review available property-led investment opportunities and their verified terms.',img:editorialImages.incubate.src,href:'/incubate'},
 {title:'Grow',sub:'Make home ownership possible',description:'Understand Beta Mortgage and Mortgage Xtra financing pathways.',img:editorialImages.grow.src,href:'/grow'}
];

export default function Homepage({featured}:{featured:FeaturedProperty[]}){
 const [slide,setSlide]=useState(0),[purpose,setPurpose]=useState('Buy'),[pause,setPause]=useState(false);
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
   onMouseEnter={()=>setPause(true)} onMouseLeave={()=>setPause(false)}
   onFocusCapture={()=>setPause(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setPause(false)}}
   onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
   onKeyDown={event=>{if(event.key==='ArrowLeft'){event.preventDefault();goToSlide(slide-1)}if(event.key==='ArrowRight'){event.preventDefault();goToSlide(slide+1)}}}>
   <div className="hero-v16-media ls-v23-hero-media" aria-hidden="true">{slides.map((item,i)=>
     <div key={item.name} className={'hero-v16-image '+(slide===i?'is-visible':'')}
       style={{backgroundImage:'url("'+item.image+'")'}}/>)}</div>
   <div className="hero-v16-wash ls-v23-hero-wash" aria-hidden="true"/>
   <div className="hero-v16-inner ls-v23-hero-inner">
    <div className="hero-v16-content ls-v23-hero-content" key={current.name}>
     <span className="eyebrow hero-v16-eyebrow">LANDSHOP <span aria-hidden="true">/</span> {current.name}</span>
     <h1 className="hero-v16-title ls-v23-hero-title">
      {slide===0?<><span>Your Property.</span><strong>Your Future.</strong></>:
       slide===1?<><span>Invest in Knowledge.</span><strong>Incubate Possibility.</strong></>:
       <><span>A Clearer Path</span><strong>to Homeownership.</strong></>}
     </h1>
     <p className="hero-v16-copy ls-v23-hero-description">{current.copy}</p>
     <div className="hero-v16-actions ls-v23-hero-actions">
      <Link className="primary" href={current.href}>Get Started <span aria-hidden="true">↗</span></Link>
      <Link className="hero-v16-secondary" href="/properties">Discover Properties <span aria-hidden="true">↗</span></Link>
     </div>
    </div>
    <div className="hero-v16-controls ls-v23-hero-controls" aria-label="Choose a Landshop product slide">
     <span className="hero-v16-progress-label">{String(slide+1).padStart(2,'0')} <small>/ 03</small></span>
     <div className="hero-v16-indicators">{slides.map((item,i)=>
      <button key={item.name} type="button" aria-label={'Show '+item.name+' slide'}
       aria-current={slide===i?'true':undefined} className={slide===i?'selected':''}
       onClick={()=>goToSlide(i)}><span className="ls-v23-control-dot" aria-hidden="true"/></button>)}</div>
     <div className="hero-v16-arrows"><button type="button" aria-label="Previous slide" onClick={()=>goToSlide(slide-1)}>←</button>
      <button type="button" aria-label="Next slide" onClick={()=>goToSlide(slide+1)}>→</button></div>
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
      <a className="primary" href="https://portal.landshopnigeria.com">Start Selling ↗</a>
    </div>:<>
    <div className="ls-v23-form-grid">
     <label>Location or keyword<input name="query" placeholder="Estate, location or keyword" maxLength={80}/></label>
     <label>State / FCT<select name="state" defaultValue=""><option value="">All Nigeria</option>{["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Federal Capital Territory","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"].map(x=><option value={x} key={x}>{x}</option>)}</select></label>
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
  <V22HomeSections featured={featured}/>
  <SiteFooter/>
 </main>;
}
