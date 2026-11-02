'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import Link from 'next/link';
import LoanIllustrator from './LoanIllustrator';
import ApprovedArrow from './ApprovedArrow';
import {landshopProductCards} from '../lib/landshop-brand-media';
import './product-detail-redesign.css';

type ProductId='develop'|'incubate'|'grow'|'devpro'|'estatepro';
export type PageId=ProductId|'products';
type Action={label:string;href?:string;intent?:string};
type PageConfig={
 name:string;eyebrow:string;title:string;description:string;photo:string;photoAlt:string;photoLabel:string;
 highlights:[string,string][];heading:string;intro:string;features:[string,string][];
 steps:[string,string][];faqs:[string,string][];links:{title:string;description:string;href?:string;intent?:string}[];
 primary:Action;secondary:Action;status:string;note:string;
};
const pages:Record<PageId,PageConfig>={
 products:{
  name:'Products',eyebrow:'LANDSHOP PRODUCTS',title:'A property solution for every stage of your journey.',
  description:'From acquiring land and finding a home to exploring shared ownership or financing construction, discover a Landshop pathway designed around your next decision.',
  photo:'/owner/2026/estate-architecture.webp',photoAlt:'Original Nigerian townhouse photography from the Landshop property archive',photoLabel:'Original Landshop property photography',
  highlights:[['Five pathways','One connected Landshop experience'],['Clear choices','Compare each product and its purpose'],['Guided next steps','Find the right enquiry or application']],
  heading:'Explore a solution that fits your goal.',intro:'Each Landshop product serves a different need. Compare your options, understand the terms and move forward confidently.',
  features:[['Develop','Explore land and housing acquisition.'],['Incubate','Understand future shared-ownership opportunities.'],['Grow','Compare mortgage and home financing options.'],['DevPro','Explore estate infrastructure financing enquiries.'],['EstatePro','Discuss construction financing for eligible subscribers.']],
  steps:[['Explore','Choose the product that matches your goal'],['Understand','Review current availability and eligibility'],['Consult','Request records and discuss terms'],['Proceed','Use the appropriate secure application']],
  faqs:[['How do I choose a product?','Start with the decision you need to make: acquire property, explore shared ownership, finance a home, support estate infrastructure or build a house.'],['Can I apply without choosing a property?','Some products accept preliminary enquiries. Formal applications may require a verified property, lender terms or supporting documents.']],
  links:[],primary:{label:'Compare products',href:'#lsp-options'},secondary:{label:'Speak with a consultant',intent:'Product selection consultation'},
  status:'Products and availability depend on the current written terms.',note:'Always request current product terms, eligibility and verified documents before committing funds.'
 },
 develop:{
  name:'Develop',eyebrow:'PROPERTY ACQUISITION · DEVELOP',title:'Own the place where your next chapter begins.',
  description:'Explore land and housing opportunities through Landshop Develop. Understand the location, current availability, documentation and purchase process before making a commitment.',
  photo:'/owner/2026/product-develop.webp',photoAlt:'Owner-supplied Nigerian land development photograph',photoLabel:'Original Landshop property archive',
  highlights:[['Land and housing','Choose the type of property you need'],['Verified information','Request current records before payment'],['Payment options','Confirm applicable schedules and terms']],
  heading:'Property ownership made clearer.',intro:'Develop connects your property goals to documented acquisition information, practical guidance and a transparent decision process.',
  features:[['Discover land','Review estate locations, plot options, planning considerations and approved documents.'],['Explore homes','Compare property types, specifications and the features that suit your needs.'],['Understand payment plans','Check the total costs, deposits, instalments, additional fees and cancellation terms in writing.']],
  steps:[['Find','Choose a currently published property or register future interest'],['Review','Confirm title, specifications and total costs'],['Inspect','Arrange a confirmed visit where available'],['Apply','Complete an eligible acquisition application']],
  faqs:[['Can I buy outright or through instalments?','The options depend on the property and the applicable written offer. Current Develop land releases are sold out; future releases require confirmation.'],['How do I verify ownership records?','Request the official property pack and seek independent legal verification before payment.']],
  links:[{title:'Prime collection',description:'Explore the existing Prime property collection and its published details.',href:'/collections/prime'},{title:'Luxury collection',description:'Review the Luxury collection and available property information.',href:'/collections/luxury'},{title:'Future Develop opportunities',description:'Ask to be informed when approved new land releases are announced.',intent:'Develop future release interest'}],
  primary:{label:'Explore properties',href:'/properties'},secondary:{label:'Enquire about Develop',intent:'Develop acquisition enquiry'},
  status:'Current Develop releases sold out. Future releases subject to confirmation.',
  note:'Any future January 2027 release date is indicative. Prices, title documents, inventory and payment terms must be reconfirmed for each offer.'
 },
 incubate:{
  name:'Incubate',eyebrow:'SHARED OWNERSHIP · INCUBATE',title:'Explore property participation with greater clarity.',
  description:'Understand the proposed ownership structure, underlying property, your legal rights and risks before registering interest in a Landshop shared-ownership opportunity.',
  photo:'/owner/2026/product-incubate.webp',photoAlt:'Owner-supplied Nigerian estate photograph',photoLabel:'Historical property imagery, not a current investment offer',
  highlights:[['Risk awareness','Know the material risks before committing'],['Asset clarity','Request offer-specific evidence'],['Suitability review','Participation requires further assessment']],
  heading:'Make decisions based on evidence, not assumptions.',intro:'Incubate provides an organised introduction to future shared-property participation without promising any particular financial outcome.',
  features:[['Understand the structure','Clarify ownership rights, participation terms and the property involved.'],['Review the disclosures','Consider costs, risks, timelines, restrictions and exit arrangements.'],['Register future interest','Receive information when authorised programmes and documents become available.']],
  steps:[['Register','Tell us your interest and preferred opportunity'],['Review','Request product-specific rights and risk disclosures'],['Assess','Complete eligibility and suitability checks'],['Decide','Proceed only after independent evaluation']],
  faqs:[['Are returns guaranteed?','No. Financial returns, appreciation and distributions are never guaranteed.'],['Does registering give me ownership rights?','No. Registration is free and does not allocate a share or establish ownership. Rights depend on a future approved written agreement.']],
  links:[{title:'Join the interest list',description:'Register your details for confirmed future programme updates.',intent:'Incubate future interest list'},{title:'Understand the programme',description:'Ask about ownership structures, eligibility and the planned process.',intent:'Incubate information and disclosures'}],
  primary:{label:'Register your interest',intent:'Incubate future interest list'},secondary:{label:'Request information',intent:'Incubate information and disclosures'},
  status:'Concept-stage interest only. No current investment sale.',
  note:'Future opportunities planned from January 2027 are subject to approval and confirmation. This page is not an offer of securities or a promise of returns.'
 },
 grow:{
  name:'Grow',eyebrow:'HOME FINANCING · GROW',title:'A clearer path from home goals to financing.',
  description:'Compare mortgage pathways, understand your affordability and prepare for lender assessment with guidance from Landshop.',
  photo:'/owner/2026/product-grow.webp',photoAlt:'Owner-supplied residential property and homeownership photograph',photoLabel:'Original Nigerian residential photography',
  highlights:[['Beta Mortgage','Explore eligible off-plan pathways'],['Mortgage Xtra','Understand eligible completed-home options'],['Lender review','Final financing terms require approval']],
  heading:'Understand affordability before you apply.',intro:'Home finance decisions become clearer when the property stage, deposit, monthly obligations and lender requirements are explained upfront.',
  features:[['Compare mortgage options','Understand how Beta Mortgage differs from Mortgage Xtra.'],['Plan the total cost','Review equity, lender charges, instalments and other obligations.'],['Prepare documents','Organise income and property records for eligibility review.']],
  steps:[['Choose','Compare Beta Mortgage and Mortgage Xtra'],['Estimate','Explore repayments with illustrative calculations'],['Prepare','Gather the requested supporting documents'],['Apply','Proceed through the secure lender review workflow']],
  faqs:[['Does a calculator guarantee approval?','No. Calculations are illustrative and do not constitute an offer from a lender.'],['Who sets the repayment terms?','An authorised finance provider determines current rates, fees, eligibility and final repayment obligations.']],
  links:[{title:'Beta Mortgage',description:'Understand the eligible off-plan property financing pathway.',href:'/grow/beta-mortgage'},{title:'Mortgage Xtra',description:'Review the eligible completed-home financing pathway.',href:'/grow/mortgage-xtra'},{title:'Mortgage calculator',description:'Estimate payments using your own assumptions.',href:'/mortgage-calculator'}],
  primary:{label:'Explore mortgage options',href:'#lsp-options'},secondary:{label:'Speak with an advisor',intent:'Grow mortgage advisory consultation'},
  status:'Mortgage approval and finance terms depend on lender assessment.',
  note:'Equity levels, interest rates, charges, eligibility and repayment figures are subject to the lender current written offer.'
 },
 devpro:{
  name:'DevPro',eyebrow:'ESTATE INFRASTRUCTURE CREDIT',title:'Plan essential infrastructure with confidence.',
  description:'Explore enquiries about eligible financing for estate development obligations, including drainage, internal roads, security fencing and shared facilities.',
  photo:'/owner/2026/garden-building-workers.webp',photoAlt:'Archival Landshop construction activity on a Nigerian estate',photoLabel:'Documented Landshop estate construction',
  highlights:[['Existing subscribers','For qualifying Landshop estate customers'],['Infrastructure focus','Defined eligible development obligations'],['Subject to approval','All lending terms require confirmation']],
  heading:'Make estate development easier to plan.',intro:'Understand the infrastructure requirement, potential financing scope and supporting documents before asking for a formal assessment.',
  features:[['Know what may qualify','Eligible infrastructure categories depend on the approved programme.'],['Review repayment assumptions','Use the illustrative calculator and obtain the actual fees and rates from a lender.'],['Request guidance','Provide estate records to help determine the next appropriate step.']],
  steps:[['Confirm','Identify the development obligation'],['Prepare','Gather estate and subscriber information'],['Estimate','Review illustrative repayments and fees'],['Enquire','Request a formal eligibility discussion']],
  faqs:[['Does DevPro cover every levy?','No. Coverage depends on the estate, funding programme and written lender criteria.'],['Is finance automatically approved?','No. A lender must assess the subscriber and issue an approved offer.']],
  links:[{title:'Eligibility consultation',description:'Tell us about your estate and the infrastructure levy.',intent:'DevPro infrastructure financing eligibility'},{title:'Our estates',description:'Review Landshop estate information and property history.',href:'/estates'}],
  primary:{label:'Ask about eligibility',intent:'DevPro infrastructure financing eligibility'},secondary:{label:'Explore our estates',href:'/estates'},
  status:'Enquiries subject to documentation and lender review.',
  note:'Any sample payment calculation is illustrative, not an approved financial offer. Rates, fees and repayment schedules require a lender written confirmation.'
 },
 estatepro:{
  name:'EstatePro',eyebrow:'CONSTRUCTION FINANCE · ESTATEPRO',title:'Turn your building plan into a structured next step.',
  description:'Explore construction finance enquiries for eligible Landshop estate subscribers, from property documentation and building budgets to lender assessment.',
  photo:'/owner/2026/estate-architecture.webp',photoAlt:'Completed Nigerian townhouses from the owner-provided Landshop archive',photoLabel:'Original residential estate photography',
  highlights:[['Plot documentation','Prepare ownership and planning records'],['Construction budget','Review realistic building costs'],['Lender assessment','Finance is subject to approval']],
  heading:'Build from a plan supported by clear numbers.',intro:'A defined construction budget and appropriate property documents help you understand your financing needs before approaching a lender.',
  features:[['Prepare a building plan','Confirm designs, permits, materials, site readiness and expected project stages.'],['Review affordability','Calculate the amount you may need and assess sample repayment scenarios.'],['Request lender consideration','Provide relevant records for an eligibility enquiry, not an automatic approval.']],
  steps:[['Document','Confirm land ownership and planning requirements'],['Budget','Estimate costs and contingency'],['Assess','Review funding requirements and eligibility'],['Submit','Request a formal finance assessment']],
  faqs:[['Is construction funding guaranteed?','No. A lender must review the property, documentation and applicant before offering any facility.'],['Do I need an approved building plan?','Building documentation and approvals may be required depending on the financing programme and property.']],
  links:[{title:'Construction finance enquiry',description:'Explain your building stage, budget and financing requirements.',intent:'EstatePro construction finance eligibility'},{title:'Property advisory',description:'Ask about documentation and planning requirements.',intent:'EstatePro property documentation advice'}],
  primary:{label:'Enquire about construction finance',intent:'EstatePro construction finance eligibility'},secondary:{label:'Speak with an advisor',intent:'EstatePro advisory consultation'},
  status:'Construction finance enquiries are subject to lender assessment.',
  note:'Illustrative repayments are not lending commitments. Actual loan availability, rates, security, fees and tenure must be confirmed in writing.'
 }
};

export default function ProductDetailRedesign({page}:{page:PageId}){
 const d=pages[page];
 const [modal,setModal]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState<{ok:boolean;message:string;reference?:string}|null>(null);
 const dialogRef=useRef<HTMLDivElement>(null);
 const openModal=(intent:string)=>{setModal(intent);setFeedback(null);setBusy(false)};
 useEffect(()=>{
  if(!modal)return;
  const prior=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const priorOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const first=dialogRef.current?.querySelector<HTMLInputElement>('input[name="full_name"]');
  first?.focus();
  const handler=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){setModal(null);return}
   if(e.key!=='Tab')return;
   const focusable=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('input:not([type="hidden"]),select,textarea,button,a[href]')||[]).filter(x=>!x.hasAttribute('disabled'));
   if(!focusable.length)return;
   const firstFocusable=focusable[0],lastFocusable=focusable[focusable.length-1];
   if(e.shiftKey&&document.activeElement===firstFocusable){e.preventDefault();lastFocusable.focus()}
   else if(!e.shiftKey&&document.activeElement===lastFocusable){e.preventDefault();firstFocusable.focus()}
  };
  window.addEventListener('keydown',handler);
  return()=>{document.body.style.overflow=priorOverflow;window.removeEventListener('keydown',handler);prior?.focus()}
 },[modal]);
 async function submitEnquiry(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setBusy(true);setFeedback(null);
  const fields=new FormData(e.currentTarget);
  const interest=modal||'General product enquiry';
  const message='Product: '+d.name+'. Request: '+interest+'.\n'+String(fields.get('message')||'').trim();
  const topic=d.name==='Develop'||d.name==='Incubate'||d.name==='Grow'?d.name:'Other';
  try{
   const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    full_name:String(fields.get('full_name')||'').trim(),email:String(fields.get('email')||'').trim(),
    phone:String(fields.get('phone')||'').trim(),topic,message,consent:fields.get('consent')==='on',website:String(fields.get('website')||'')
   })});
   const result=await response.json() as {ok?:boolean;message?:string;reference?:string};
   setFeedback({ok:response.ok&&result.ok===true,message:result.message||'The request could not be submitted.',reference:result.reference});
  }catch{setFeedback({ok:false,message:'Unable to submit right now. Please email care@landshopnigeria.com.'})}
  finally{setBusy(false)}
 }
 function ActionButton({action,solid=false}:{action:Action;solid?:boolean}){
  const cls=solid?'lsp-primary':'lsp-outline';
  return action.href?<Link className={cls} href={action.href}>{action.label}<ApprovedArrow /></Link>
   :<button type="button" className={cls} onClick={()=>openModal(action.intent||action.label)}>{action.label}<ApprovedArrow /></button>;
 }
 const productCard=(slug:ProductId)=>{
  const product=landshopProductCards.find(x=>x.slug===slug);
  if(!product)return null;
  return <Link key={slug} href={'/plans/'+slug} className="lsp-product-card">
   <div className="lsp-product-card-media">{product.photo?<img src={product.photo} alt={product.photoAlt} loading="lazy"/>:<img src={pages[slug].photo} alt={pages[slug].photoAlt} loading="lazy"/>}</div>
   <div className="lsp-product-card-body"><span className="lsp-kicker">{pages[slug].eyebrow}</span><img className="lsp-product-logo" src={product.logo} alt={product.name+' logo'} loading="lazy"/><p>{product.description}</p><strong>Explore {product.name} <ApprovedArrow /></strong></div>
  </Link>
 };
 return <main className="lsp-product">
  <div className="lsp-shell"><nav className="lsp-crumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span>{page!=='products'&&<><Link href="/products">Products</Link><span>/</span></>}{d.name}</nav>
   <section className="lsp-hero" aria-labelledby="lsp-title"><div className="lsp-hero-copy"><span className="lsp-kicker">{d.eyebrow}</span><h1 id="lsp-title">{d.title}</h1><p>{d.description}</p><div className="lsp-actions"><ActionButton action={d.primary} solid/><ActionButton action={d.secondary}/></div><div className="lsp-status">{d.status}</div></div>
    <figure className="lsp-hero-photo"><img src={d.photo} alt={d.photoAlt}/><figcaption>{d.photoLabel}</figcaption></figure>
   </section>
   <div className="lsp-stats">{d.highlights.map(([title,desc])=><div className="lsp-stat" key={title}><strong>{title}</strong><span>{desc}</span></div>)}</div>
   <section className="lsp-section" id="lsp-options"><div className="lsp-heading"><span className="lsp-kicker">WHAT YOU SHOULD KNOW</span><h2>{d.heading}</h2><p>{d.intro}</p></div>
    {page==='products'?<div className="lsp-products-grid">{(['develop','incubate','grow','devpro','estatepro'] as ProductId[]).map(productCard)}</div>:
    <div className="lsp-features">{d.features.map(([title,desc],i)=><article key={title} className="lsp-feature"><span className="lsp-index">0{i+1}</span><h3>{title}</h3><p>{desc}</p></article>)}</div>}
   </section>
   <section className="lsp-section lsp-process"><div className="lsp-heading"><span className="lsp-kicker">HOW IT WORKS</span><h2>Your next steps, clearly explained.</h2><p>Explore the information, verify the details and move at a pace that works for you.</p></div><div className="lsp-steps">{d.steps.map(([title,desc],i)=><article key={title}><strong>0{i+1}</strong><h3>{title}</h3><p>{desc}</p></article>)}</div></section>
   {page!=='products'&&<section className="lsp-section lsp-pathways"><div className="lsp-heading"><span className="lsp-kicker">PRODUCT PATHWAYS</span><h2>Choose your next step.</h2><p>Follow the relevant link or open a secure enquiry popup to ask for further guidance.</p></div><div className="lsp-pathway-grid">{d.links.map((item,i)=><article className="lsp-pathway" key={item.title}><span className="lsp-index">0{i+1}</span><h3>{item.title}</h3><p>{item.description}</p>{item.href?<Link href={item.href}>Explore pathway <ApprovedArrow /></Link>:<button type="button" onClick={()=>openModal(item.intent||item.title)}>Open enquiry form <ApprovedArrow /></button>}</article>)}</div></section>}
   {(page==='devpro'||page==='estatepro')&&<section className="lsp-section lsp-calculator"><div className="lsp-heading"><span className="lsp-kicker">FINANCE PLANNER</span><h2>Explore a possible repayment scenario.</h2><p>Adjust your own amount, rate and term assumptions. This is not an offer or approval.</p></div><LoanIllustrator kind={page}/></section>}
   <section className="lsp-section lsp-faq"><div className="lsp-heading"><span className="lsp-kicker">FREQUENTLY ASKED QUESTIONS</span><h2>Questions worth asking.</h2></div><div className="lsp-faq-list">{d.faqs.map(([question,answer])=><details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
   <section className="lsp-conversion"><div><span className="lsp-kicker">LANDSHOP IS HERE TO HELP</span><h2>Ready to take a more informed step?</h2><p>Ask the right questions and request the information you need before proceeding.</p></div><button type="button" className="lsp-primary" onClick={()=>openModal(d.name+' next-step consultation')}>Speak with Landshop <ApprovedArrow /></button></section>
   <p className="lsp-disclosure"><strong>Please note:</strong> {d.note}</p>
  </div>
  {modal&&<div className="lsp-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}>
   <div ref={dialogRef} className="lsp-modal" role="dialog" aria-modal="true" aria-labelledby="lsp-modal-title" aria-describedby="lsp-modal-desc">
    <button type="button" className="lsp-modal-close" onClick={()=>setModal(null)} aria-label="Close enquiry form">×</button>
    <span className="lsp-kicker">{d.name.toUpperCase()} ENQUIRY</span><h2 id="lsp-modal-title">{modal}</h2><p id="lsp-modal-desc">Share your contact details and question. The Landshop team will review your enquiry and respond through its official support process.</p>
    {feedback?.ok?<div className="lsp-modal-success" role="status"><strong>Enquiry received.</strong><p>{feedback.message}</p>{feedback.reference&&<p>Reference: <strong>{feedback.reference}</strong></p>}<button className="lsp-primary" type="button" onClick={()=>setModal(null)}>Close</button></div>:
     <form onSubmit={submitEnquiry}><div className="lsp-form-grid"><label>Full name <span>*</span><input name="full_name" autoComplete="name" minLength={2} maxLength={120} placeholder="Your full name" required/></label><label>Email address <span>*</span><input name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required/></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="+234 ..."/></label><label>Product<input value={d.name} readOnly aria-label="Selected Landshop product"/></label><label className="lsp-wide">How can we help? <span>*</span><textarea name="message" minLength={20} maxLength={2800} required rows={4} placeholder="Tell us what you want to achieve, your preferred location or your question."/></label></div>
      <label className="lsp-consent"><input type="checkbox" name="consent" required/><span>I agree to be contacted about this enquiry and acknowledge the <Link href="/privacy" target="_blank" rel="noopener noreferrer">privacy notice</Link>.</span></label>
      <div className="lsp-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      {feedback&&!feedback.ok&&<p className="lsp-form-error" role="alert">{feedback.message}</p>}
      <button className="lsp-primary lsp-submit" type="submit" disabled={busy}>{busy?'Submitting enquiry...':'Submit enquiry'} <ApprovedArrow /></button><p className="lsp-modal-note">Submitting an enquiry does not reserve a property, approve financing or create an ownership interest.</p>
     </form>}
   </div></div>}
 </main>;
}
