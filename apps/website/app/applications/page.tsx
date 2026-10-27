import Link from 'next/link';
import './application-center.css';
export const metadata={title:'Applications Center | Landshop',description:'Develop, Incubate and Grow product application forms and mortgage pre-qualification.'};
type Search={product?:string};
const forms=[{"slug":"develop-house","title":"Develop House","sub":"Own a house or apartment","product":"Develop","img":"deck-develop.webp","steps":8,"summary":"Select your estate and home, choose a payment preference, provide your next of kin and submit for review."},{"slug":"develop-land","title":"Develop Land","sub":"Own a residential or commercial plot","product":"Develop","img":"famous0.webp","steps":8,"summary":"Choose an approved estate and plot size, enter your subscription preferences and complete your declaration."},{"slug":"incubate-investment","title":"Incubate Investment","sub":"Explore property-linked investments","product":"Incubate","img":"deck-investment.webp","steps":7,"summary":"Submit an investment interest, preferred duration, identity documents and payout preferences for suitability review."},{"slug":"beta-mortgage","title":"Beta Mortgage","sub":"Mortgage pre-qualification","product":"Grow","img":"deck-mortgage.webp","steps":7,"summary":"Provide income, employment, household and equity details for an eligibility assessment."},{"slug":"mortgage-xtra","title":"Mortgage Xtra","sub":"Structured home financing","product":"Grow","img":"deck-building.webp","steps":7,"summary":"Start a financing request, review estimated affordability and follow your application through inspection and review."},{"slug":"develop-inspection","title":"Develop Inspection","sub":"Book or record a property inspection","product":"Inspection","img":"maiyegun0.webp","steps":6,"summary":"Enter your preferred estate and date; Landshop staff record verified inspection outcomes."},{"slug":"mortgage-xtra-inspection","title":"Mortgage Xtra Inspection","sub":"Mortgage-linked property inspection","product":"Inspection","img":"drone0.webp","steps":6,"summary":"Coordinate inspection for your selected property and capture prospect feedback after the visit."}];
const portal='https://portal.landshopnigeria.com';
export default async function ApplicationsCenter({searchParams}:{searchParams:Promise<Search>}){
 const {product}=await searchParams;
 const focus=(product||'').toLowerCase();
 const ordered=[...forms].sort((a,b)=>Number(b.product.toLowerCase()===focus)-Number(a.product.toLowerCase()===focus));
 return <main className="lc-scene">
  <header className="lc-sitebar"><Link href="/" className="lc-brand"><img src="/media/logo.webp" alt="Landshop logo"/> Landshop</Link>
   <nav aria-label="Applications navigation"><Link href="/">Home</Link><Link href="/properties">Properties</Link><Link href="/develop">Develop</Link><Link href="/incubate">Incubate</Link><Link href="/grow">Grow</Link><a href={portal}>My Account</a></nav></header>
  <section className="lc-hero"><div className="lc-herotext"><div className="lc-eyebrow">Welcome to Landshop Applications</div>
   <h1>Your property journey <span>starts here.</span></h1>
   <p>Choose the correct Develop, Incubate or Grow application. Complete a guided multi-step form, save your progress and track the review in your secure account.</p>
   <a href={portal+'/applications'}>Open Secure Applications Center →</a></div></section>
  <div className="lc-body"><span className="lc-tag">Develop · Incubate · Grow</span><h2>Choose your application</h2>
   <p className="lc-intro">These product subscription and inspection forms are separate from account Sign In and Sign Up. All financing and investment terms require official confirmation.</p>
   <div className="lc-steps"><span className="lc-step"><strong>01</strong> Select product</span><span className="lc-step"><strong>02</strong> Enter information</span><span className="lc-step"><strong>03</strong> Save and review</span><span className="lc-step"><strong>04</strong> Submit securely</span></div>
   <aside className="lc-guidance"><strong>Before you apply:</strong> Use your own verified information and attach the documents requested for your product. Submitted applications are reviewed by authorized Landshop staff; submission is not automatic approval or a confirmed allocation.</aside>
   <div className="lc-grid">{ordered.map(item=><article className={'lc-card '+(focus===item.product.toLowerCase()?'featured':'')} key={item.slug}>
     <img className="lc-photo" src={'/media/'+item.img} alt={item.title+' official Landshop supporting imagery'}/>
     <div className="lc-cardbody"><span className="lc-tag">{item.product}</span><h3>{item.title}</h3><p className="lc-sub">{item.sub}</p><p>{item.summary}</p><p className="lc-small">{item.steps} guided stages · private draft saving</p>
      <a href={portal+'/applications/'+item.slug}>Start {item.title} →</a></div>
    </article>)}</div>
   <div className="lc-footnote"><h3>Need to calculate affordability first?</h3><p>Use Landshop's indicative calculator to compare deposits and repayments. Mortgage rates, equity percentages and investment outcomes are estimates until supported by approved contracts.</p><a href={portal+'/calculator'}>Open Mortgage Calculator →</a></div>
  </div></main>
}