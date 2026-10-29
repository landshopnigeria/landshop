'use client';
import {useEffect,useState,useRef} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {editorialImages} from '../lib/editorial-imagery';
import SiteIcon,{IconChip} from './SiteIcon';
type Listing={title:string,location:string,type:string,img:string,category:string,details:string};
export type FeaturedProperty={id:string,title:string,location:string,propertyType:string,price:string};
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
const listings:Listing[]=[
 {title:'Lagos Residential Development',location:'Lagos, Nigeria',type:'Editorial photograph',img:editorialImages.develop.src,category:'Nigeria Architecture',details:'Real Lagos property photograph · Illustration only, not a Landshop listing'},
 {title:'Osapa London Residential District',location:'Lagos, Nigeria',type:'Aerial photograph',img:editorialImages.incubate.src,category:'Nigeria Architecture',details:'Real aerial photograph · Location context, not a sale offer'},
 {title:'Contemporary Lagos Apartments',location:'Lagos, Nigeria',type:'Editorial photograph',img:editorialImages.residential.src,category:'Nigeria Architecture',details:'Real Lagos building photograph · Not a Landshop listing'},
 {title:'Modern Nigerian City Living',location:'Lagos, Nigeria',type:'Editorial photograph',img:editorialImages.architecture.src,category:'Nigeria Architecture',details:'Real Nigerian architecture · Not offered for sale'},
 {title:'Lagos Coastal Skyline',location:'Lagos, Nigeria',type:'City photograph',img:editorialImages.skyline.src,category:'Nigeria Architecture',details:'Real Nigerian skyline · Regional editorial photography'},
 {title:'Lagos Development Outlook',location:'Lagos, Nigeria',type:'Editorial photograph',img:editorialImages.officeTower.src,category:'Nigeria Architecture',details:'Real Lagos business architecture · Illustrative media only'}
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
  <form className="glass-search" onSubmit={search} aria-label="Find properties"><div className="search-tabs">{['Buy','Sell','Rent','Shortlet'].map(p=><button type="button" key={p} className={p===purpose?'active':''} aria-pressed={p===purpose} onClick={()=>{setPurpose(p);if(p==='Shortlet')setType('shortlet');else if(type==='shortlet')setType('')}}>{p}</button>)}</div>{purpose==='Sell'?<div className="landshop-sell-panel"><div><strong>Ready to sell or list a property?</strong><p>Sign in to the secure Landshop portal to begin the property listing process. Listings are subject to identity verification, title review and approval before publication.</p></div><a className="primary" href="https://portal.landshopnigeria.com">Start Selling ↗</a></div>:<div className="search-grid"><select aria-label="Property type" value={type} onChange={e=>setType(e.target.value)}><option value="">All property types</option><option value="land">Land</option><option value="house">House</option><option value="apartment">Apartment</option><option value="commercial">Commercial</option></select><select aria-label="Country" defaultValue="Nigeria"><option value="Nigeria">Nigeria</option></select><select aria-label="State or FCT" value={location} onChange={e=>setLocation(e.target.value)}><option value="">All Nigerian states</option>{["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Federal Capital Territory","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"].map(l=><option key={l} value={l}>{l}</option>)}</select><select aria-label="Budget" value={price} onChange={e=>setPrice(e.target.value)}><option value="">Any budget</option><option value="20000000">Up to ₦20 million</option><option value="50000000">Up to ₦50 million</option><option value="100000000">Up to ₦100 million</option></select><button className="primary" type="submit">Search Properties →</button></div>}</form>
  <section className="section-soft"><div className="container why"><div><span className="eyebrow green who-editorial">WHO WE ARE</span><h2>Building a more <strong>accessible Nigeria.</strong></h2><p>Landshop helps individuals, families and organizations navigate real estate decisions through property acquisition, documented investment enquiries and structured homeownership pathways.</p><div className="about-pillars"><span><strong>03</strong> Product pathways</span><span><strong>07</strong> Guided application forms</span><span><strong>01</strong> Connected experience</span></div><p><a className="primary about-learn" href="/about">Learn More ↗</a></p></div><div className="about-image-v4 about-collage"><img src={editorialImages.team.src} alt={editorialImages.team.alt} loading="lazy"/><img src={editorialImages.architecture.src} alt={editorialImages.architecture.alt} loading="lazy"/><img src={editorialImages.portrait.src} alt={editorialImages.portrait.alt} loading="lazy"/><span className="about-image-note">Building Wealth Through Real Estate.</span></div></div></section>
  <section className="container"><div className="section-intro"><div><span className="eyebrow green">OUR PRODUCTS</span><h2>Three ways to own, grow and build</h2></div><p>Explore Landshop solutions tailored to acquisition, investment and property financing.</p></div><div className="grid3">{products.map(p=><article className="prod-card" key={p.title}><Link href={p.href}><img src={p.img} alt={'Real Nigerian editorial photography for '+p.title+' (not a Landshop listing)'}/></Link><span className="ls-product-icon">{p.title==='Develop'?<IconChip name="building"/>:p.title==='Incubate'?<IconChip name="chart"/>:<IconChip name="key"/>}</span><div className="card-content"><span className="eyebrow green">{p.sub}</span><h3>{p.title}</h3><p>{p.description}</p><Link href={p.href}>Explore {p.title} →</Link></div></article>)}</div></section>
  <section className="container"><div className="section-intro"><div><span className="eyebrow green">{featured.length?"FEATURED PROPERTIES":"REAL NIGERIAN ARCHITECTURE"}</span><h2>Explore exceptional property opportunities</h2><p>{featured.length?"The latest approved published properties from the Landshop marketplace. Confirm current availability, pricing and title documents before any commitment.":"Explore genuine photographs of Nigerian residential architecture and neighborhoods. These editorial photographs are not Landshop property listings or offers for sale."}</p></div><a className="outline" href="/properties">View All Properties →</a></div><div className="featured-grid">{featured.length?featured.map(p=><article className="property-card" key={p.id}><div className="property-image-pending" role="img" aria-label="Property photograph pending independent approval"><span>Verified property photo pending</span></div><div className="card-content"><span className="tag">{p.propertyType}</span><h3>{p.title}</h3><p>{p.location}</p><p className="property-price">{p.price}</p><a href={"/properties/"+p.id}>View Property →</a></div></article>):listings.map(p=><article className="property-card" key={p.title}><img src={p.img} alt={'Real Nigerian editorial image: '+p.title} loading="lazy"/><div className="card-content"><span className="tag">{p.category}</span><h3>{p.title}</h3><p>{p.location} · {p.type}</p><p className="value-note">{p.details}</p><a href="/properties">Explore estate →</a></div></article>)}</div></section>
  <section className="section-soft"><div className="container"><div className="section-intro"><div><span className="eyebrow green">FROM LANDSHOP</span><h2>Insights & updates</h2></div><a href="/insights" className="outline">View Articles →</a></div><div className="grid3">{['Property acquisition basics','Understanding mortgage pre-qualification','Preparing for an estate inspection'].map((title,i)=><article className="content-card" key={title}><img src={[editorialImages.residential.src,editorialImages.planning.src,editorialImages.develop.src][i]} alt="Relevant property editorial image"/><div className="card-content"><h3>{title}</h3><p>Landshop guides, documentation and considerations.</p><a href={'/insights/'+['property-due-diligence','mortgage-prequalification','property-inspection'][i]}>Read guide →</a></div></article>)}</div></div></section>
  <section className="v4-trust"><div className="container v4-trust-inner"><div><span className="eyebrow">OUR CUSTOMER COMMITMENT</span><h2>Clarity, care and confidence at every stage.</h2><p>Understand each Landshop product, review your requirements and make decisions with the right supporting documents. Our team can help you find the correct application process.</p></div><a className="v4-trust-action" href="/contact">Talk to Landshop →</a></div></section>
  <section className="container v4-updates"><div><span className="eyebrow green">LANDSHOP UPDATES</span><h2>Stay informed about property opportunities.</h2><p>Request verified project updates and educational resources from the Landshop team. No automatic mailing list registration occurs through this link.</p></div><a className="primary" href="mailto:care@landshopnigeria.com?subject=Landshop%20Property%20Updates%20Request">Request Property Updates →</a></section>
  <footer className="site-footer"><div className="footer-inner"><div><a href="/" aria-label="Landshop home"><img src="/media/logo-transparent.png" width={145} alt="Landshop official logo"/></a><p>Landshop connects customers to documented real estate acquisition, property investment enquiries and homeownership pathways.</p></div><div><strong>Company</strong><a href="/about">About Landshop</a><a href="/company/team">Leadership</a><a href="/contact">Contact</a></div><div><strong>Products</strong>{products.map(p=><a key={p.title} href={p.href}>{p.title}</a>)}</div><div><strong>Customer</strong><a href="https://portal.landshopnigeria.com">Customer Portal</a><a href="/applications">Application Centre</a><a href="/properties">Property Marketplace</a></div><div><strong>Contact</strong><a href="/contact">Contact Our Team</a><a href="mailto:care@landshopnigeria.com">care@landshopnigeria.com</a><a href="tel:+2349169973359">+234 916 997 3359</a></div></div><div className="legal">© Landshop · Property and financial terms require current verification.</div></footer>
 </main>;
}
