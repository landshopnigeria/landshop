import FAQAssistant from './FAQAssistant';
import Link from 'next/link';
type Product='develop'|'incubate'|'grow';
const content={
 develop:{
   eyebrow:'LANDSHOP · DEVELOP',
   title:'Own Your Future',
   summary:'Property acquisition for individuals, families and organizations.',
   description:'Develop is Landshop’s property acquisition offering, designed for people seeking outright ownership of land or apartment units. Explore our Prime and Luxury collections and speak with the Landshop team about documented ownership and available payment options.',
   features:['Prime & Luxury property collections','Land and completed housing opportunities','Property documents and title review','Inspection booking and allocation guidance'],
   primary:'Explore Properties'
 },
 incubate:{
   eyebrow:'LANDSHOP · INCUBATE',
   title:'Build Wealth Through Property',
   summary:'Landshop’s property-led investment pathway.',
   description:'Incubate builds on the property-investment concept described as Invest in the earlier Landshop product deck. Investors can explore eligible property opportunities, review supporting information and proceed through due diligence and suitability checks.',
   features:['Investment application and profiling','Opportunity-specific documents','Portfolio and transaction visibility','Risk disclosures and financial approvals'],
   primary:'Speak With an Advisor'
 },
 grow:{
   eyebrow:'LANDSHOP · GROW',
   title:'A Smarter Path to Homeownership',
   summary:'Learn about mortgage-backed and structured financing.',
   description:'Grow introduces Nigerians to mortgage and structured property financing. The Landshop product deck describes Beta Mortgage and Mortgage Xtra, subject to current lender terms, verified eligibility, documentation and formal approval.',
   features:['Beta Mortgage pathway','Mortgage Xtra pathway','Indicative repayment calculator','Application and financing workflow'],
   primary:'Apply for Financing'
 }
} as const;
export default function ProductPage({product}:{product:Product}){
 const p=content[product];
 return <main style={{fontFamily:'Arial,Helvetica,sans-serif',color:'#093d31'}}>
  <header style={{padding:'20px 6%',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#ffffffed',borderBottom:'1px solid #d9e9df'}}>
   <Link href="/" style={{color:'#008d70',fontSize:28,fontWeight:800,textDecoration:'none'}}>Landshop</Link>
   <Link href="https://portal.landshopnigeria.com" style={{background:'#008d70',color:'#fff',padding:'13px 19px',borderRadius:12,textDecoration:'none'}}>Get Started</Link>
  </header>
  <section style={{padding:'52px 6% 64px',background:'linear-gradient(125deg,#064838,#008a71)',color:'#fff'}}>
   <nav aria-label="Breadcrumb" style={{fontSize:13}}><Link href="/" style={{color:'#c5ead9'}}>Home</Link> / Product / {product.toUpperCase()}</nav>
   <div style={{maxWidth:790,marginTop:60}}>
    <small style={{letterSpacing:3,color:'#ffb15c'}}>{p.eyebrow}</small>
    <h1 style={{fontSize:'clamp(38px,6vw,78px)',lineHeight:1.04,margin:'20px 0'}}>{p.title}</h1>
    <p style={{fontSize:19,lineHeight:1.6}}>{p.summary}</p>
    <Link href={'/applications?product='+product} style={{display:'inline-block',background:'#fff',color:'#056247',padding:'17px 26px',borderRadius:14,textDecoration:'none',marginTop:20}}>{p.primary}</Link>
   </div>
  </section>
  <section style={{padding:'64px 6%',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:35,alignItems:'start'}}>
   <div><small style={{color:'#a45e1f'}}>ABOUT THE PRODUCT</small><h2 style={{fontSize:36}}>One platform. More possibilities.</h2><p style={{fontSize:17,lineHeight:1.8}}>{p.description}</p></div>
   <div style={{border:'1px solid #d8e6df',borderRadius:24,padding:28,background:'#f4faf7'}}>
    <h3>What to expect</h3>
    <ul style={{display:'grid',gap:17,paddingLeft:20}}>{p.features.map(f=><li key={f}>{f}</li>)}</ul>
   </div>
  </section>
  <section style={{background:'#ebf5ef'}}><FAQAssistant product={product}/></section>
  <footer style={{background:'#063e35',color:'#fff',padding:'50px 6%'}}>Landshop · Develop | Incubate | Grow · <a style={{color:'#fff'}} href="mailto:care@landshopnigeria.com">care@landshopnigeria.com</a></footer>
 </main>
}
