import Link from 'next/link';
import FAQAssistant from './FAQAssistant';
import {editorialImages} from '../lib/editorial-imagery';
import {IconChip} from './SiteIcon';
import '../app/product-journeys.css';

type Product='develop'|'incubate'|'grow';
type Pathway={name:string,detail:string,href:string,action:string,number:string};
const portal='https://portal.landshopnigeria.com';
const content={
 develop:{
  eyebrow:'01 / DEVELOP',label:'Develop.',headline:'Own Your Future.',
  intro:'Property ownership, made more understandable.',
  description:'Explore documented land and housing opportunities through Landshop. Choose the right product, learn what to verify, book an inspection, and submit a guided application for review.',
  image:editorialImages.develop.src,
  alt:editorialImages.develop.alt,
  heroAction:'Explore Available Properties',heroHref:'/properties',
  secondaryAction:'Start a Develop Application',secondaryHref:'/applications?product=develop',
  quote:'Your next ownership decision deserves clear information.',
  highlights:['Explore land and home opportunities','Review estate documents and current availability','Start a guided, secure application','Track the review of your application'],
  pathways:[
   {number:'01',name:'Develop Land',detail:'Interested in residential or commercial land? Specify your estate preference, plot details, payment preference and required identity information.',href:portal+'/applications/develop-land',action:'Apply for Land'},
   {number:'02',name:'Develop House',detail:'Explore available houses and apartments, choose a suitable home and complete the relevant ownership application.',href:portal+'/applications/develop-house',action:'Apply for a Home'},
   {number:'03',name:'Property Inspection',detail:'Arrange a documented site visit before making an ownership decision. Inspection requests are reviewed and confirmed by staff.',href:portal+'/applications/develop-inspection',action:'Request Inspection'}
  ],
  disclaimer:'All sale prices, plot allocations, title documents, instalment plans and completion dates require current verification with Landshop.'
 },
 incubate:{
  eyebrow:'02 / INCUBATE',label:'Incubate.',headline:'Invest in Possibilities.',
  intro:'Explore property-led investment, with informed decisions at every step.',
  description:'Incubate provides a structured entry point for property-linked investment enquiries. Explore eligibility, review available opportunities and disclosures, and submit your interest for suitability and compliance review.',
  image:editorialImages.incubate.src,
  alt:editorialImages.incubate.alt,
  heroAction:'Start Investment Application',heroHref:portal+'/applications/incubate-investment',
  secondaryAction:'Read Property Investment Guidance',secondaryHref:'/insights',
  quote:'Growth begins with understanding the opportunity and its risks.',
  highlights:['Review verified opportunity-specific information','Understand eligibility and investment risks','Submit your investment interest securely','Receive an authorized review, not an automatic approval'],
  pathways:[
   {number:'01',name:'Incubate Investment',detail:'Provide your investment interest, preferred duration, suitability details, required identification and documented preferences through one secure guided form.',href:portal+'/applications/incubate-investment',action:'Explore Investment Form'}
  ],
  disclaimer:'Property investment carries risk. No returns, yields, capital protection or payout timing are guaranteed on this page. Consult approved terms and independent professional advice.'
 },
 grow:{
  eyebrow:'03 / GROW',label:'Grow.',headline:'Make Homeownership Possible.',
  intro:'Structured financing pathways for informed homeowners.',
  description:'Understand the available financing pathways, compare indicative affordability and submit the appropriate multi-step application. Every mortgage or credit decision remains subject to lender eligibility, documentation and approval.',
  image:editorialImages.grow.src,
  alt:editorialImages.grow.alt,
  heroAction:'Calculate Your Affordability',heroHref:portal+'/calculator',
  secondaryAction:'Explore Financing Applications',secondaryHref:'/applications?product=grow',
  quote:'A better financing decision starts with a clear understanding of the numbers.',
  highlights:['Explore Beta Mortgage and Mortgage Xtra','Estimate repayment and equity requirements','Prepare the supporting application documents','Track the review without assuming pre-approval'],
  pathways:[
   {number:'01',name:'Beta Mortgage',detail:'Begin mortgage pre-qualification with employment, income, household and equity information. Eligibility is assessed by authorized reviewers.',href:portal+'/applications/beta-mortgage',action:'Begin Beta Mortgage'},
   {number:'02',name:'Mortgage Xtra',detail:'Explore a structured housing finance application, including documented requirements, financing interest and property details.',href:portal+'/applications/mortgage-xtra',action:'Apply for Mortgage Xtra'},
   {number:'03',name:'Mortgage Xtra Inspection',detail:'Coordinate a mortgage-linked property inspection and record your preferred appointment details.',href:portal+'/applications/mortgage-xtra-inspection',action:'Request Inspection'}
  ],
  disclaimer:'Calculators provide illustrations only. Interest rates, deposit thresholds, fees, repayment schedules and approvals must be checked against current lender agreements.'
 }
} satisfies Record<Product,{
 eyebrow:string;label:string;headline:string;intro:string;description:string;
 image:string;alt:string;heroAction:string;heroHref:string;
 secondaryAction:string;secondaryHref:string;quote:string;
 highlights:string[];pathways:Pathway[];disclaimer:string
}>;

const stages=[
 {number:'01',title:'Discover',description:'Understand the product, available opportunities and the information you need.'},
 {number:'02',title:'Decide',description:'Choose the appropriate pathway and compare documented options.'},
 {number:'03',title:'Apply',description:'Complete the secure multi-step form and attach relevant evidence.'},
 {number:'04',title:'Review',description:'Authorized Landshop staff assess your application and communicate next steps.'}
];

export default function ProductPage({product}:{product:Product}){
 const p=content[product];
 return <main className="landshop-product" data-product-journey={product}>
  <div className="lp-topline"><span>Everyone Deserves Affordable Property.</span><div><a href={portal}>Account</a><a href={portal+'/applications'}>Application Center</a><a href="/contact">Contact Us</a></div></div>
  <header className="lp-nav">
   <Link className="lp-brand" href="/" aria-label="Landshop homepage"><img src="/media/logo-transparent.png" alt="Landshop official logo" width={126} height={53}/></Link>
   <nav aria-label="Main navigation"><Link href="/">Home</Link><Link href="/develop" aria-current={product==='develop'?'page':undefined}>Develop</Link><Link href="/incubate" aria-current={product==='incubate'?'page':undefined}>Incubate</Link><Link href="/grow" aria-current={product==='grow'?'page':undefined}>Grow</Link><Link href="/properties">Properties</Link><Link href="/insights">Insights</Link></nav>
   <a className="lp-primary" href={portal}>Get Started ↗</a>
  </header>
  <section className="lp-hero">
   <img src={p.image} alt={p.alt} className="lp-hero-image" fetchPriority="high"/>
   <div className="lp-hero-shade" aria-hidden="true"/>
   <div className="lp-hero-inner">
    <div className="lp-breadcrumb"><Link href="/">HOME</Link><span>/</span> PRODUCTS <span>/</span> {p.label.toUpperCase()}</div>
    <div className="lp-hero-content">
     <span className="lp-eyebrow">{p.eyebrow}</span>
     <h1><em>{p.label}</em><strong>{p.headline}</strong></h1>
     <p className="lp-lead">{p.intro}</p>
     <p className="lp-description">{p.description}</p>
     <div className="lp-actions"><a className="lp-primary" href={p.heroHref}>{p.heroAction} ↗</a><a className="lp-secondary" href={p.secondaryHref}>{p.secondaryAction} →</a></div>
    </div>
    <div className="lp-hero-count"><strong>0{['develop','incubate','grow'].indexOf(product)+1}</strong><span>/ 03 LANDSHOP PATHWAYS</span></div>
   </div>
  </section>
  <section className="lp-overview">
   <div className="lp-container lp-overview-grid">
    <div className="lp-overview-heading"><span className="lp-eyebrow">WHAT {p.label.toUpperCase()} OFFERS</span><h2>Clarity at every <em>decision point.</em></h2><p>{p.quote}</p><Link href="/about">About Landshop ↗</Link></div>
    <div className="lp-highlights">{p.highlights.map((item,i)=><div key={item}><span className="lp-highlight-icon"><IconChip name={i===0?'home':i===1?'shield':i===2?'document':'check'}/></span><p>{item}</p></div>)}</div>
   </div>
  </section>
  <section className="lp-process" id="how-it-works"><div className="lp-container"><div className="lp-heading"><span className="lp-eyebrow">YOUR LANDSHOP JOURNEY</span><h2>From interest to informed action.</h2><p>Product forms are decision-making applications, not Sign In or Sign Up forms.</p></div>
   <div className="lp-steps">{stages.map(s=><article key={s.number}><span>{s.number}</span><h3>{s.title}</h3><p>{s.description}</p></article>)}</div>
  </div></section>
  <section className="lp-container lp-pathways" id="applications">
   <div className="lp-heading"><span className="lp-eyebrow">CHOOSE YOUR APPLICATION</span><h2>Find the right next step.</h2><p>Every pathway opens a secure, product-specific, multi-step application in the Landshop portal.</p></div>
   <div className="lp-pathway-grid">{p.pathways.map(item=><article key={item.name} className="lp-pathway-card"><span className="lp-card-number">{item.number}</span><span className="lp-card-icon"><IconChip name={item.name.toLowerCase().includes('inspection')?'calendar':product==='grow'?'calculator':product==='incubate'?'chart':'home'}/></span><h3>{item.name}</h3><p>{item.detail}</p><a href={item.href}>{item.action} ↗</a></article>)}</div>
   <aside className="lp-disclosure"><strong>Important product information</strong><p>{p.disclaimer}</p></aside>
  </section>
  <section className="lp-knowledge"><FAQAssistant product={product}/></section>
  <section className="lp-contact"><div className="lp-container"><div><span className="lp-eyebrow">TALK TO LANDSHOP</span><h2>Need more information before you decide?</h2><p>Our team can help you understand a product or request verified current information.</p></div><Link href="/contact">Speak With Our Team ↗</Link></div></section>
  <footer className="lp-footer"><div><Link href="/"><img src="/media/logo-transparent.png" width={139} height={58} alt="Landshop logo"/></Link><p>Building Wealth Through Real Estate.</p></div><nav aria-label="Footer links"><Link href="/develop">Develop</Link><Link href="/incubate">Incubate</Link><Link href="/grow">Grow</Link><Link href="/applications">Applications</Link><Link href="/contact">Contact</Link></nav><small>© {new Date().getFullYear()} Landshop. All rights reserved.</small></footer>
 </main>;
}