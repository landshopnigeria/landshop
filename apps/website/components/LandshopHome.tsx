'use client';
import {useEffect,useState,useRef} from 'react';
type Listing={title:string,location:string,type:string,img:string,category:string,details:string};
export type FeaturedProperty={id:string,title:string,location:string,propertyType:string,price:string};
const slides=[
 {name:'DEVELOP',title:'Develop.',tagline:'Own Your Future.',copy:'Discover land and homes with confidence. Explore verified property opportunities, transparent guidance and a clearer path to ownership.',image:'/media/deck-building.webp',action:'Develop',href:'/develop',alt:'Landshop construction site photograph from the official project deck'},
 {name:'INCUBATE',title:'Incubate.',tagline:'Invest in Possibilities.',copy:'Explore property-linked investment opportunities with documented terms, eligibility requirements and a responsible investment review.',image:'/media/deck-investment.webp',action:'Invest Now',href:'https://portal.landshopnigeria.com/applications/incubate-investment',alt:'Landshop investment project photograph from the official deck'},
 {name:'GROW',title:'Grow.',tagline:'Make Homeownership Possible.',copy:'Explore Beta Mortgage and Mortgage Xtra, calculate your potential affordability, and take the next step with informed financial guidance.',image:'/media/deck-mortgage.webp',action:'Know Your Earnings',href:'https://portal.landshopnigeria.com/calculator',alt:'Landshop mortgage and housing project photograph from the official deck'}
] as const;
const products=[
 {title:'Develop',sub:'Own your future',description:'Discover land and housing opportunities, Prime and Luxury selections.',img:'/media/deck-develop.webp',href:'/develop'},
 {title:'Incubate',sub:'Explore property investment',description:'Review available property-led investment opportunities and their verified terms.',img:'/media/deck-investment.webp',href:'/incubate'},
 {title:'Grow',sub:'Make home ownership possible',description:'Understand Beta Mortgage and Mortgage Xtra financing pathways.',img:'/media/deck-mortgage.webp',href:'/grow'}
];
const listings:Listing[]=[
 {title:'Famous Gardens',location:'Nigeria',type:'Estate media',img:'/media/famous0.webp',category:'Develop',details:'Original owner-provided property photographs; current offer terms require verification'},
 {title:'Maiyegun Beach Estate',location:'Lagos, Nigeria',type:'Estate media',img:'/media/maiyegun0.webp',category:'Develop',details:'Supplied estate photographs; availability requires direct confirmation'},
 {title:'Merit Park',location:'Nigeria',type:'Aerial media',img:'/media/drone0.webp',category:'Develop',details:'Original drone gallery; location and title documents must be reviewed'},
 {title:'Famous Gardens Gallery',location:'Nigeria',type:'Estate gallery',img:'/media/famous1.webp',category:'Estate Media',details:'Additional original estate media, not a published sale offer'},
 {title:'Maiyegun Site Overview',location:'Lagos, Nigeria',type:'Estate gallery',img:'/media/maiyegun1.webp',category:'Estate Media',details:'Additional site photography; verified project terms available on enquiry'},
 {title:'Development Portfolio',location:'Nigeria',type:'Project gallery',img:'/media/deck-construction.webp',category:'Project Media',details:'Project imagery from the Landshop source deck'}
];
const nav=[{text:'Product',children:[['Develop','/develop'],['Incubate','/incubate'],['Grow','/grow']]},
 {text:'Company',children:[['About Landshop','/about'],['Vision & Mission','/about#vision'],['Leadership & Team','/company/team'],['How Landshop Works','/about#approach']]},
 {text:'Services',children:[['Property Acquisition','/services/property-acquisition'],['Property Advisory','/services/advisory'],['Mortgage Guidance','/services/mortgage'],['Property Inspection','/applications'],['Construction Credit','/services/construction-credit'],['Cooperatives & Thrift','/thrift']]}];
export default function Homepage({featured}:{featured:FeaturedProperty[]}){
 const [slide,setSlide]=useState(0),[purpose,setPurpose]=useState('Buy'),[type,setType]=useState(''),[location,setLocation]=useState(''),[price,setPrice]=useState(''),[mobile,setMobile]=useState(false),[pause,setPause]=useState(false),[hideHeader,setHideHeader]=useState(false),[openMenu,setOpenMenu]=useState<string|null>(null);
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

 useEffect(()=>{
  let last=window.scrollY;let frame=0;
  const change=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const pos=window.scrollY;if(Math.abs(pos-last)>10){setHideHeader(pos>170&&pos>last&&!mobile);last=pos;}if(pos<70)setHideHeader(false);});};
  window.addEventListener('scroll',change,{passive:true});return ()=>{window.removeEventListener('scroll',change);cancelAnimationFrame(frame)};
 },[mobile]);
 const current=slides[slide];
 function search(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(purpose==='Sell'){locationAssign('https://portal.landshopnigeria.com');return;}const args=new URLSearchParams({purpose});if(type)args.set('type',type);if(location)args.set('state',location);if(price)args.set('max',price);locationAssign('/properties?'+args.toString())}
 function locationAssign(path:string){window.location.href=path}
 return <main>
  <div className="top-strip"><span>Everyone Deserves Affordable Property.</span><form className="global-search" action="/search" method="get" role="search"><label htmlFor="landshop-global-search">Search</label><input id="landshop-global-search" type="search" name="q" placeholder="Search properties, services, guides…" maxLength={90}/><button aria-label="Search Landshop" type="submit">⌕</button></form><div><a href="https://portal.landshopnigeria.com">Account</a><a href="https://portal.landshopnigeria.com">Realtor Portal</a><a href="https://portal.landshopnigeria.com">Become a Realtor</a><a href="https://app.landshopnigeria.com/admin">Command Center</a><a href="/contact">Support</a></div></div>
  <header className={"site-header "+(hideHeader?"header-hide":"")}><div className="header-inner">
   <a className="logo" href="/" aria-label="Landshop home"><img src="/media/logo.webp" alt="Landshop official logo"/></a>
   <button type="button" className="mobile-nav" aria-expanded={mobile} onClick={()=>setMobile(v=>!v)} aria-label="Toggle navigation">☰</button>
   <nav className={'nav-links '+(mobile?'open':'')} aria-label="Main navigation"><a href="/">Home</a>
    {nav.map(group=><div className={'navdrop '+(openMenu===group.text?'navdrop-open':'')} key={group.text}><button type="button" aria-haspopup="true" aria-expanded={openMenu===group.text} onClick={()=>setOpenMenu(current=>current===group.text?null:group.text)}>{group.text} <span className="nav-chevron" aria-hidden="true">⌄</span></button><div className="mega"><div className="intro"><strong>{group.text==='Product'?'Three paths to ownership':group.text==='Company'?'Our Company':'Support for your goals'}</strong><p>Explore Landshop's official products, estate services and resources.</p><a className="primary" href="/applications">Get Started</a></div><div className="menuitems">{group.children.map(([title,url])=><a key={url+title} href={url}>{title} →</a>)}</div></div></div>)}
    <a href="/properties">Properties</a><a href="/insights">Insights / Blog</a><a href="/contact">Contact Us</a></nav>
   <a className="primary" href="https://portal.landshopnigeria.com">Get Started ↗</a></div></header>
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
      <a className="hero-v16-secondary" href={current.href}>{current.action} <span aria-hidden="true">→</span></a>
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
  <section className="section-soft"><div className="container why"><div><span className="eyebrow green who-editorial">WHO WE ARE</span><h2>Building a more <strong>accessible Nigeria.</strong></h2><p>Landshop helps individuals, families and organizations navigate real estate decisions through property acquisition, documented investment enquiries and structured homeownership pathways.</p><div className="about-pillars"><span><strong>03</strong> Product pathways</span><span><strong>07</strong> Guided application forms</span><span><strong>01</strong> Connected experience</span></div><p><a className="primary about-learn" href="/about">Learn More ↗</a></p></div><div className="about-image-v4 about-collage"><img src="/media/event0.webp" alt="Landshop community event imagery"/><img src="/media/deck-architecture.webp" alt="Nigerian modern property architecture"/><img src="/media/famous0.webp" alt="Original Landshop estate gallery"/><span className="about-image-note">Building Wealth Through Real Estate.</span></div></div></section>
  <section className="container"><div className="section-intro"><div><span className="eyebrow green">OUR PRODUCTS</span><h2>Three ways to own, grow and build</h2></div><p>Explore Landshop solutions tailored to acquisition, investment and property financing.</p></div><div className="grid3">{products.map(p=><article className="prod-card" key={p.title}><a href={p.href}><img src={p.img} alt={p.title+' property imagery'}/></a><div className="card-content"><span className="eyebrow green">{p.sub}</span><h3>{p.title}</h3><p>{p.description}</p><a href={p.href}>Explore {p.title} →</a></div></article>)}</div></section>
  <section className="container"><div className="section-intro"><div><span className="eyebrow green">{featured.length?"FEATURED PROPERTIES":"FEATURED ESTATE MEDIA"}</span><h2>Explore exceptional property opportunities</h2><p>{featured.length?"The latest approved published properties from the Landshop marketplace. Confirm current availability, pricing and title documents before any commitment.":"Explore selected estate-media previews from Landshop’s supplied project materials. These are galleries, not verified live sale listings."}</p></div><a className="outline" href="/properties">View All Properties →</a></div><div className="featured-grid">{featured.length?featured.map(p=><article className="property-card" key={p.id}><div className="property-image-pending" role="img" aria-label="Property photograph pending independent approval"><span>Verified property photo pending</span></div><div className="card-content"><span className="tag">{p.propertyType}</span><h3>{p.title}</h3><p>{p.location}</p><p className="property-price">{p.price}</p><a href={"/properties/"+p.id}>View Property →</a></div></article>):listings.map(p=><article className="property-card" key={p.title}><img src={p.img} alt={'Estate media for '+p.title}/><div className="card-content"><span className="tag">{p.category}</span><h3>{p.title}</h3><p>{p.location} · {p.type}</p><p className="value-note">{p.details}</p><a href="/properties">Explore estate →</a></div></article>)}</div></section>
  <section className="section-soft"><div className="container"><div className="section-intro"><div><span className="eyebrow green">FROM LANDSHOP</span><h2>Insights & updates</h2></div><a href="/insights" className="outline">View Articles →</a></div><div className="grid3">{['Property acquisition basics','Understanding mortgage pre-qualification','Preparing for an estate inspection'].map((title,i)=><article className="content-card" key={title}><img src={['/media/deck-building.webp','/media/deck-mortgage.webp','/media/deck-construction.webp'][i]} alt="Relevant property editorial image"/><div className="card-content"><h3>{title}</h3><p>Landshop guides, documentation and considerations.</p><a href={'/insights/'+['property-due-diligence','mortgage-prequalification','property-inspection'][i]}>Read guide →</a></div></article>)}</div></div></section>
  <section className="v4-trust"><div className="container v4-trust-inner"><div><span className="eyebrow">OUR CUSTOMER COMMITMENT</span><h2>Clarity, care and confidence at every stage.</h2><p>Understand each Landshop product, review your requirements and make decisions with the right supporting documents. Our team can help you find the correct application process.</p></div><a className="v4-trust-action" href="/contact">Talk to Landshop →</a></div></section>
  <section className="container v4-updates"><div><span className="eyebrow green">LANDSHOP UPDATES</span><h2>Stay informed about property opportunities.</h2><p>Request verified project updates and educational resources from the Landshop team. No automatic mailing list registration occurs through this link.</p></div><a className="primary" href="mailto:care@landshopnigeria.com?subject=Landshop%20Property%20Updates%20Request">Request Property Updates →</a></section>
  <footer className="site-footer"><div className="footer-inner"><div><a href="/" aria-label="Landshop home"><img src="/media/logo.webp" width={145} alt="Landshop official logo"/></a><p>Landshop connects customers to documented real estate acquisition, property investment enquiries and homeownership pathways.</p></div><div><strong>Company</strong><a href="/about">About Landshop</a><a href="/company/team">Leadership</a><a href="/contact">Contact</a></div><div><strong>Products</strong>{products.map(p=><a key={p.title} href={p.href}>{p.title}</a>)}</div><div><strong>Customer</strong><a href="https://portal.landshopnigeria.com">Customer Portal</a><a href="/applications">Application Centre</a><a href="/properties">Property Marketplace</a></div><div><strong>Contact</strong><a href="/contact">Contact Our Team</a><a href="mailto:care@landshopnigeria.com">care@landshopnigeria.com</a><a href="tel:+2349169973359">+234 916 997 3359</a></div></div><div className="legal">© Landshop · Property and financial terms require current verification.</div></footer>
 </main>;
}
