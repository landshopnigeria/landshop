import Link from 'next/link';
import ContentShell from '../../components/ContentShell';
import {editorialImages} from '../../lib/editorial-imagery';
export const metadata={
 title:'About Landshop | Purpose, Vision, People & Real Estate in Nigeria',
 description:'Learn about Landshop, founded in 2017, our mission, vision and three property pathways: Develop, Incubate and Grow.',
 alternates:{canonical:'/about'}
};
const milestones=[
 ['2017','The beginning','Founded to help make Nigerian real estate decisions more accessible and less complex.'],
 ['Property pathways','A clearer structure','Distinct acquisition, investment enquiry and mortgage guidance journeys evolved around customer needs.'],
 ['Today','Develop · Incubate · Grow','Three separate product experiences with guided application processes.']
];
export default function About(){return <ContentShell eyebrow="WHO WE ARE" title="About Us." intro="A Nigerian real estate company with a commitment to making property decisions more accessible, understandable and achievable." image={editorialImages.architecture.src} imageAlt={editorialImages.architecture.alt}>
 <div className="v22-root v22-interior">
 {/* The ContentShell hero is section 1; eight intentional sections follow. */}
 <section className="v22-section" id="who-we-are"><div className="v22-container v22-two"><div>
  <span className="v22-eyebrow">WHO WE ARE</span><h2>About Us</h2>
  <p>Landshop was founded in 2017 by a team of career professionals combining experience across real estate, corporate management and other sectors. The company set out to simplify property acquisition and address the uncertainty, complexities and lack of awareness that often surround buying and developing property in Nigeria.</p>
  <p>Landshop's purpose is to help people find the right information, understand their choices and navigate responsible ownership and property investment journeys. Its current three-product model is Develop, Incubate and Grow.</p>
  <Link className="v22-btn" href="/contact">Speak to Landshop ↗</Link>
 </div><div className="v22-collage">
  <img src={editorialImages.architecture.src} alt={editorialImages.architecture.alt}/>
  <img src={editorialImages.team.src} alt={editorialImages.team.alt}/>
  <img src={editorialImages.residential.src} alt={editorialImages.residential.alt}/>
 </div></div></section>
 <section className="v22-section v22-muted"><div className="v22-container"><span className="v22-eyebrow">OUR STORY</span><h2>Built on the belief that property can be more accessible.</h2><div className="v22-steps">{milestones.map(([year,title,body])=><article key={year}><b>{year}</b><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>
 <section className="v22-section"><div className="v22-container v22-two"><article className="v22-vision"><span className="v22-eyebrow">OUR VISION</span><h2>Fill the real estate deficit for every generation of Nigeria's growing population.</h2><p>Vision statement from the original Landshop Product Deck.</p></article><article className="v22-vision"><span className="v22-eyebrow">MISSION STATEMENT</span><h2>Be the country's most trusted and affordable repository of real estate.</h2><p>Mission statement from the original Landshop Product Deck.</p></article></div></section>
 <section className="v22-section v22-muted"><div className="v22-container"><span className="v22-eyebrow">WHAT GUIDES US</span><h2>Clarity before complexity.</h2><div className="v22-steps">{[['01','Clarity','Explain property terms and documentation in language customers can use.'],['02','Accessibility','Create pathways for different property goals and levels of readiness.'],['03','Integrity','Distinguish verified facts from estimates and historical statements.'],['04','Accountability','Make applications and enquiries traceable through documented next steps.']].map(([n,t,b])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{b}</p></article>)}</div></div></section>
 <section className="v22-section"><div className="v22-container"><span className="v22-eyebrow">OUR PRODUCTS</span><h2>Three distinct property decisions.</h2><div className="v22-products">{[
  ['Develop','Acquire land or property with documented information.','/develop',editorialImages.develop.src],
  ['Incubate','Review available property-linked investment opportunities, terms and risks.','/incubate',editorialImages.incubate.src],
  ['Grow','Explore mortgage-related ownership pathways and affordability guidance.','/grow',editorialImages.grow.src]
 ].map(([t,d,href,img])=><article className="v22-product" key={t}><Link href={href} className="v22-product-image"><img src={img} loading="lazy" alt={'Editorial visual for Landshop '+t}/></Link><div className="v22-product-body"><h3>{t}</h3><p>{d}</p><Link href={href} className="v22-text-link">Explore {t} ↗</Link></div></article>)}</div></div></section>
 <section className="v22-section v22-muted"><div className="v22-container"><span className="v22-eyebrow">PROPERTY HERITAGE</span><h2>Projects, communities and the work behind the vision.</h2><p>Landshop's original product deck documents completed allocation events, construction activity and architectural concepts. Archival material is not evidence of current listing availability.</p><div className="v22-heritage"><img src={editorialImages.develop.src} alt="Illustrative property development image" loading="lazy"/><img src={editorialImages.team.src} alt="Illustrative customer and advisory meeting" loading="lazy"/><img src={editorialImages.architecture.src} alt="Illustrative building architecture" loading="lazy"/></div></div></section>
 <section className="v22-section"><div className="v22-container v22-two"><div><span className="v22-eyebrow">RELATIONSHIPS & RECOGNITION</span><h2>Trust is earned through the work.</h2><p>The original Landshop Product Deck records partner relationships, professional association references and recognition awards. Current partner and certification claims should be checked against authoritative records before public promotion.</p><Link className="v22-btn" href="/partners">Explore our partners ↗</Link></div><img className="v22-cover-photo" src={editorialImages.officeTower.src} alt={editorialImages.officeTower.alt} loading="lazy"/></div></section>
 <section className="v22-section v22-final"><div className="v22-container v22-two"><div><span className="v22-eyebrow">OUR COMMITMENT</span><h2>Your next property decision deserves the right information.</h2><p>Whether you are exploring ownership, financing or property investment enquiries, our goal is to guide you towards a clear and responsible next action.</p></div><div className="v22-action-panel"><h3>Start with the right pathway.</h3><p>Explore available properties, submit a guided application or speak with our team.</p><div className="v22-actions"><Link className="v22-btn" href="/properties">Explore properties ↗</Link><Link className="v22-text-link" href="/contact">Contact Landshop →</Link></div></div></div></section>
 </div>
 </ContentShell>}
