
import ContentShell from '../../components/ContentShell';
import {editorialImages} from '../../lib/editorial-imagery';
import Link from 'next/link';
export const metadata={title:'About Landshop | Real Estate Development & Ownership in Nigeria',description:'Discover the purpose, values, approach and three product pathways of Landshop: Develop, Incubate and Grow.'};
const pillars=[
 {name:'Clarity and due diligence',description:'Every decision begins with the property, its documentation, the parties involved and the terms a customer can independently review.'},
 {name:'Accessible pathways',description:'Different property goals call for different solutions. We organize ownership, investment enquiries and mortgage-related applications separately.'},
 {name:'Customer-centered process',description:'From the first enquiry to inspections, document review and post-application follow-up, each stage should have a clear next action.'}
];
export default function About(){return <ContentShell eyebrow="About Landshop" title="Building wealth through real estate." intro="Landshop brings property development, ownership opportunities and structured financial pathways into one connected experience." image={editorialImages.team.src} imageAlt={editorialImages.team.alt}>
 <section id="who-we-are" className="content-split"><div><span className="content-kicker" style={{color:'#0b886a'}}>Who we are</span><h2>Don't just buy property. Own your future.</h2><p>Landshop is a Nigerian real estate business focused on making property decisions clearer and more accessible. Our operating experience covers property acquisition and development opportunities, investment enquiries and pathways to home ownership.</p><p>We work to distinguish confirmed project facts from estimates or proposals, and to connect customers to the correct application process for their needs.</p></div><img src={editorialImages.architecture.src} alt={editorialImages.architecture.alt} loading="lazy"/></section>
 <section id="vision" className="content-grid two" aria-label="Vision and mission">
  <div className="content-tile"><span className="number">01 / OUR VISION</span><h2>More people building lasting property wealth.</h2><p>To help make responsible property ownership, development and property-led wealth creation more accessible to people and communities across Nigeria.</p></div>
  <div className="content-tile"><span className="number">02 / OUR MISSION</span><h2>Make every decision informed.</h2><p>To connect individuals, families and organizations with documented real estate opportunities, guided applications and support from enquiry to decision.</p></div>
 </section>
 <section id="approach"><span className="content-kicker" style={{color:'#0b886a'}}>How we work</span><h2>Trust is built into the process.</h2><div className="content-grid">{pillars.map((v,i)=><article className="content-tile" key={v.name}><span className="number">0{i+1}</span><h3>{v.name}</h3><p>{v.description}</p></article>)}</div></section>
 <section><h2>Three products. Distinct decisions.</h2><div className="content-grid">
  <article className="content-tile"><span className="number">DEVELOP</span><h3>Own land and housing</h3><p>Discover land, homes and estate opportunities, with property-specific documentation and suitable acquisition pathways.</p><Link href="/develop">Explore Develop →</Link></article>
  <article className="content-tile"><span className="number">INCUBATE</span><h3>Explore property investments</h3><p>Evaluate available property-linked investment opportunities with disclosed commercial terms, risks and eligibility requirements.</p><Link href="/incubate">Explore Incubate →</Link></article>
  <article className="content-tile"><span className="number">GROW</span><h3>Make homeownership possible</h3><p>Understand Beta Mortgage and Mortgage Xtra, explore illustrative repayment estimates, and request financing assessment.</p><Link href="/grow">Explore Grow →</Link></article>
 </div></section>
 <aside className="content-band"><h2>Turning today's decisions into tomorrow's wealth.</h2><p>Start with the right property information and a guided product application. Investment performance, availability, mortgage terms and title information are only confirmed through current approved documentation.</p><Link href="/applications" className="content-cta">Find your application →</Link></aside>
 </ContentShell>}
