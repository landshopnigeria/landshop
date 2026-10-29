
import Link from 'next/link';
import {MarketHeader,MarketFooter} from '../../components/MarketChrome';
import {publicDb,money} from '../../lib/marketplace';
import '../properties/property-market.css';
export const dynamic='force-dynamic';
export const metadata={title:'Search Landshop | Properties, Products and Guides',description:'Search real Landshop public pages, approved properties and educational resources.'};
const pages=[
 {title:'Develop — Land and House Ownership',url:'/develop',description:'Discover documented property development and acquisition options.'},
 {title:'Incubate — Property Investment Enquiries',url:'/incubate',description:'Learn about documented property-linked investment opportunities.'},
 {title:'Grow — Homeownership & Mortgages',url:'/grow',description:'Explore mortgage guidance, Beta Mortgage and Mortgage Xtra.'},
 {title:'Property Marketplace',url:'/properties',description:'Search management-published properties by location and budget.'},
 {title:'About Landshop',url:'/about',description:'Who We Are, Vision, Mission and Values.'},
 {title:'Landshop Insights & Real Estate Guides',url:'/insights',description:'Property due diligence, inspections and mortgage guidance.'},
 {title:'Before You Subscribe to Land or a House',url:'/insights/before-you-subscribe-to-land-or-house',description:'Independent title checks, agreements, estate inspections and payment conditions.'},
 {title:'Understanding Mortgage Pre-qualification',url:'/insights/understanding-mortgage-prequalification',description:'Mortgage affordability, equity, repayments and verified lender terms.'},
 {title:'How to Prepare for a Property Inspection',url:'/insights/how-to-prepare-for-property-inspection',description:'A practical estate viewing and documentation checklist.'},
 {title:'Applications Center',url:'/applications',description:'Choose the correct multi-step product-decision form.'},
 {title:'Customer Account & KYC',url:'https://portal.landshopnigeria.com',description:'Register securely, confirm email and complete verification.'},
 {title:'Customer Support',url:'/contact',description:'Contact Landshop for enquiries and inspection support.'},
 {title:'Mortgage Calculator',url:'https://portal.landshopnigeria.com/calculator',description:'Calculate illustrative principal, equity, tenure and repayments.'},
 {title:'Property Acquisition Service',url:'/services/property-acquisition',description:'Structured acquisition and verification guidance.'},
 {title:'Property Advisory',url:'/services/advisory',description:'Advice on property selection and documentation.'}
];
export default async function Search({searchParams}:{searchParams:Promise<{q?:string}>}){
 const {q:raw}=await searchParams,q=(raw||'').trim().slice(0,90),term=q.toLowerCase();
 const results=term.length>=2?pages.filter(page=>(page.title+' '+page.description).toLowerCase().includes(term)):[];
 const db=publicDb();
 let propertyMatches:{id:string,title:string,amount_kobo:number|null,property_type:string}[]=[];
 let backendError=false;
 if(term.length>=2&&db){
  const {data,error}=await db.from('properties').select('id,title,amount_kobo,property_type').eq('status','published').ilike('title','%'+q.replace(/[%_,\\]/g,'')+'%').order('created_at',{ascending:false}).limit(12);
  propertyMatches=data||[];backendError=Boolean(error);
 }
 return <main className="mk-layout"><MarketHeader/><section className="mk-hero"><div><small>LANDSHOP / SEARCH</small><h1>Search <em>Landshop</em></h1><p>Find official product pages, approved property listings and helpful real estate guides.</p></div></section><div className="mk-wrap">
  <form action="/search" method="get" className="mk-search" role="search" style={{display:'flex',gap:12,flexWrap:'wrap'}}><input name="q" aria-label="Search products, pages and properties" defaultValue={q} autoFocus placeholder="Type an estate, product, service or topic…" maxLength={90} style={{flex:'1 1 280px',minWidth:0,border:'1px solid #cadfd4',padding:14,borderRadius:12}}/><button className="mk-btn" type="submit">Search ↗</button></form>
  {term.length<2?<div className="mk-blank"><h2>Search Landshop</h2><p>Enter at least two characters to explore real site pages and published inventory.</p></div>:<div className="mk-utility"><article><h2>Website results ({results.length})</h2>{results.length?results.map(x=><div key={x.url} style={{borderBottom:'1px solid #d9ebe0',padding:'15px 0'}}><h3 style={{margin:'0 0 7px',fontSize:18}}><Link href={x.url}>{x.title} ↗</Link></h3><p style={{margin:0}}>{x.description}</p></div>):<p>No matching indexed Landshop information. Try another keyword.</p>}</article><article><h2>Published Properties ({propertyMatches.length})</h2>{backendError?<p>Property search temporarily unavailable. Please try again.</p>:propertyMatches.length?propertyMatches.map(x=><div key={x.id} style={{borderBottom:'1px solid #d9ebe0',padding:'15px 0'}}><h3 style={{fontSize:18,margin:'0 0 7px'}}><Link href={'/properties/'+x.id}>{x.title} ↗</Link></h3><p>{x.property_type} · {money(x.amount_kobo)}</p></div>):<p>No verified published property matches your search. No properties or prices are generated.</p>}<Link href="/properties" className="mk-btn">Advanced Property Search ↗</Link></article></div>}
  <MarketFooter/>
 </div></main>;
}
