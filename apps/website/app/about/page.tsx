import Link from 'next/link';
import ApprovedArrow from '../../components/ApprovedArrow';
import {AboutProductsCarousel,AboutServicesCarousel} from '../../components/AboutShowcaseCarousels';
import AboutStoryTimeline from '../../components/AboutStoryTimeline';
import AboutImpactCounters from '../../components/AboutImpactCounters';
import AboutRevealObserver from '../../components/AboutRevealObserver';
import './about-refinement.css';

export const metadata={
 title:'About Landshop | Our Story, Vision, People and Property Solutions',
 description:'Explore the Landshop story, mission, values, real estate products, services and our commitment to accessible property ownership in Nigeria.',
 alternates:{canonical:'/about'},
 openGraph:{title:'About Landshop | A More Accessible Path to Property Ownership',description:'Discover Landshop’s story, products, values and commitment to Nigerian property ownership.',url:'/about',images:[{url:'/about/landshop-landmark-building.webp',alt:'Landshop-branded landmark building'}]},
 twitter:{card:'summary_large_image',images:['/about/landshop-landmark-building.webp']}
};

const icons:Record<string,string>={
 calendar:'M7 2v4M17 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
 layers:'m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5',
 cube:'m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10 9-5m-9 5L3 7m9 5v10',
 chart:'M4 20h16M7 17V9m5 8V4m5 13v-6',
 eye:'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
 target:'M21 12a9 9 0 1 1-9-9m7 2-7 7m0-5v5h5M12 8a4 4 0 1 0 4 4',
 gem:'m6 3 12 0 4 6-10 12L2 9l4-6Zm-4 6h20M10 3 7 9l5 12 5-12-3-6',
 handshake:'M2 12 7 7l4 3 3-2 3 2 5 2-6 7-4-2-3 2-7-7Zm5-5 4-2 4 1 2 4m-8 7 3-3m0 3 3-3',
 shield:'M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5l-8-3Zm-4 10 3 3 5-6',
 users:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6M2 21v-2a6 6 0 0 1 12 0v2H2Zm14 0h6v-2a5 5 0 0 0-5-5',
 rocket:'M4 15c1-5 6-10 15-11 0 9-5 14-11 16l-4-5Zm6-5 4 4m-9 3-2 5 5-2m7-12a1 1 0 1 0 0 2 1 1 0 0 0 0-2',
 star:'m12 2 3.1 6.3L22 9.3l-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1L12 2Z',
 pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Zm-8-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
 wallet:'M3 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm0 1V5a2 2 0 0 1 2-2h13m-3 9h6m-6-2v4',
 headset:'M4 14v-3a8 8 0 0 1 16 0v3M4 14h4v6H6a2 2 0 0 1-2-2v-4Zm16 0h-4v6h2a2 2 0 0 0 2-2v-4Zm-4 7c-1 2-3 2-5 2',
 trend:'M3 19 9 13l4 4 8-10M15 7h6v6'
};
function AboutIcon({kind}:{kind:string}){
 return <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[kind]||icons.star}/></svg>;
}
const values=[
 {icon:'gem',title:'Clarity',body:'Explain property terms and opportunities simply, so every client can make informed decisions.'},
 {icon:'handshake',title:'Accessibility',body:'Create practical pathways for Nigerians with different property goals and readiness levels.'},
 {icon:'shield',title:'Integrity',body:'Uphold honesty, fairness and professionalism in every relationship.'},
 {icon:'users',title:'Accountability',body:'Take ownership of our delivery, promises, processes and client outcomes.'},
 {icon:'rocket',title:'Innovation',body:'Use purposeful technology and insight to make property ownership easier.'},
 {icon:'star',title:'Customer Success',body:'Put our clients’ goals first and help them build lasting value with confidence.'}
];
const benefits=[
 {icon:'shield',label:'Verified Properties'},
 {icon:'pin',label:'Strategic Locations'},
 {icon:'wallet',label:'Flexible Payment Plans'},
 {icon:'handshake',label:'Professional Expertise'},
 {icon:'headset',label:'Customer-Centred Guidance'},
 {icon:'trend',label:'Long-Term Value'}
];

export default function About(){
 return <main className="content-page ls-about-page"><div className="content-main">
 <div className="v22-root v22-interior ls-about-showcase"><AboutRevealObserver/>
  <section className="v22-section ls-about-hero" id="who-we-are" aria-labelledby="about-landshop-heading">
   <div className="v22-container ls-about-hero-layout">
    <div className="ls-about-hero-content">
     <span className="ls-about-kicker ls-about-faded-kicker">WHO WE ARE</span>
     <h1 id="about-landshop-heading">About <span>Landshop</span><em>.</em></h1>
     <p>Landshop is a Nigerian real estate brand focused on simplifying property ownership and unlocking real estate value across the country. We bring clarity, trust and innovation to land and property investment, making ownership more accessible and helping Nigerians build long-term wealth.</p>
     <Link className="v22-btn ls-about-primary-cta" href="/plans/develop">Build with Landshop <ApprovedArrow /></Link>
    </div>
    <div className="ls-about-photo-collage" aria-label="Three owner-selected images for the Landshop About page">
     <img className="ls-about-collage-main" src="/about/landshop-landmark-building.webp" alt="Landshop-branded landmark building image selected for the About page" loading="eager" fetchPriority="high"/>
     <img src="/about/landshop-site-team-huddle.webp" alt="Three Landshop-branded construction team members on site" loading="eager"/>
     <img src="/about/landshop-white-estate-gate.webp" alt="White estate entrance gate and residential buildings" loading="eager"/>
    </div>
   </div>
  </section>
  <section className="v22-section ls-about-story" aria-labelledby="about-our-story">
   <div className="v22-container">
    <span className="ls-about-kicker ls-about-faded-kicker">OUR STORY</span>
    <h2 id="about-our-story" className="ls-about-section-title">Built on the belief that property can be more accessible.</h2>
    <AboutStoryTimeline/>
   </div>
  </section>
  <section className="v22-section ls-about-vision-section" aria-label="Landshop vision and mission">
   <div className="v22-container ls-about-vision-grid">
    <article className="ls-about-promise-card">
     <div className="ls-about-promise-icon"><AboutIcon kind="eye"/></div>
     <div><span className="ls-about-kicker">OUR VISION</span>
      <h2>To become Africa’s most trusted and innovative real estate company.</h2>
      <p>Transforming lives through accessible, secure and high-quality property solutions that create long-term wealth and stronger communities.</p></div>
    </article>
    <article className="ls-about-promise-card">
     <div className="ls-about-promise-icon"><AboutIcon kind="target"/></div>
     <div><span className="ls-about-kicker">OUR MISSION</span>
      <h2>To deliver secure, transparent and innovative real estate solutions.</h2>
      <p>Empowering individuals, families and investors to own, build and grow value through trusted guidance, flexible options and a client-first experience.</p></div>
    </article>
   </div>
  </section>
  <section className="v22-section ls-about-values ls-about-animate" aria-labelledby="about-values">
   <div className="v22-container">
    <span className="ls-about-kicker">WHAT GUIDES US</span>
    <h2 id="about-values" className="ls-about-section-title">Our core values drive everything we do.</h2>
    <div className="ls-about-values-grid">{values.map((item)=><article className="ls-about-value-card" key={item.title}>
     <span className="ls-about-value-icon"><AboutIcon kind={item.icon}/></span>
     <div><h3>{item.title}</h3><p>{item.body}</p></div>
    </article>)}</div>
   </div>
  </section>
  <section className="v22-section ls-about-leadership ls-about-animate" aria-labelledby="about-ceo-message">
   <div className="v22-container ls-about-leadership-grid">
    <figure className="ls-about-leadership-photo">
     <img src="/owner/2026/garden-field-update.webp" alt="Landshop project representative giving a Nigerian estate development update" loading="lazy" decoding="async"/>
     <figcaption>Landshop project team on site</figcaption>
    </figure>
    <div className="ls-about-leadership-copy">
     <span className="ls-about-short-accent" aria-hidden="true"/>
     <h2 id="about-ceo-message">Message from the CEO</h2>
     <p>At Landshop, our purpose is simple: to make property ownership more achievable, more transparent and more rewarding for Nigerians. We understand that real estate can feel complex, but it shouldn’t be. That is why we are building a brand that gives you clarity, trusted guidance and the right support at every step of your property journey.</p>
     <p>Whether you are buying your first land, investing in a development or building for the future, we are here to walk with you through integrity, innovation and a genuine commitment to your success. At Landshop, we don’t just sell property; we create opportunities for people, families and communities to build lasting wealth and brighter futures.</p>
     <div className="ls-about-leadership-signature"><strong>Office of the Chief Executive</strong><span>LANDSHOP</span></div>
    </div>
   </div>
  </section>
  <section className="v22-section ls-about-products" aria-labelledby="about-products">
   <div className="v22-container"><span className="ls-about-kicker">OUR PRODUCTS</span>
    <h2 id="about-products" className="ls-about-section-title">Products<span className="ls-about-title-dot">.</span></h2>
    <AboutProductsCarousel/>
   </div>
  </section>
  <section className="v22-section ls-about-services" aria-labelledby="about-services">
   <div className="v22-container"><span className="ls-about-kicker">WHAT WE DO</span>
    <h2 id="about-services" className="ls-about-section-title">Services</h2>
    <AboutServicesCarousel/>
   </div>
  </section>
  <section className="v22-section ls-about-impact" aria-labelledby="about-impact-heading">
   <div className="v22-container">
    <h2 id="about-impact-heading">IMPACT IN NUMBERS</h2>
    <AboutImpactCounters/>
   </div>
  </section>
  <section className="v22-section ls-about-why ls-about-animate" aria-labelledby="about-why-heading">
   <div className="v22-container">
    <span className="ls-about-kicker">WHY CHOOSE LANDSHOP</span>
    <h2 id="about-why-heading" className="ls-about-section-title">A more trusted and accessible path to property ownership.</h2>
    <div className="ls-about-benefits">{benefits.map((item)=><div key={item.label}><span className="ls-about-benefit-icon"><AboutIcon kind={item.icon}/></span><strong>{item.label}</strong></div>)}</div>
   </div>
  </section>
  <section className="v22-section ls-about-last-section ls-about-animate" aria-label="Start your property journey">
   <div className="v22-container">
    <div className="ls-about-final-cta">
     <div className="ls-about-final-copy">
      <h2>Start your property journey<br/>with confidence.</h2>
      <p>Explore verified opportunities, get expert guidance and take the next step toward ownership.</p>
      <div className="ls-about-cta-actions">
       <Link href="/properties" className="ls-about-cta-orange">Browse Properties <ApprovedArrow /></Link>
       <Link href="/contact" className="ls-about-cta-outline">Contact Landshop <ApprovedArrow /></Link>
      </div>
     </div>
     <img src="/owner/2026/famous-completed-homes.webp" alt="Completed Nigerian estate homes from the Landshop owner photo archive" loading="lazy"/>
    </div>
   </div>
  </section>
 </div></div></main>;
}
