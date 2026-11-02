import ApprovedArrow from '../../components/ApprovedArrow';
import Link from 'next/link';
import ContentShell from '../../components/ContentShell';
import {editorialImages} from '../../lib/editorial-imagery';
import LandshopAboutCollage from '../../components/LandshopAboutCollage';
import LandshopProductCards from '../../components/LandshopProductCards';
import LandshopVideo from '../../components/LandshopVideo';
import {landshopAboutImages,landshopEditorialTeam} from '../../lib/landshop-brand-media';
export const metadata={
 title:'About Landshop | Purpose, Vision, People & Real Estate in Nigeria',
 description:'Discover Landshop, our Nigerian real estate story, five property products, mission and vision, genuine construction media and company introduction film.',
 alternates:{canonical:'/about'}
};
const milestones=[
 ['2017','The beginning','Founded to help make Nigerian real estate decisions more accessible and less complex.'],
 ['Property pathways','A clearer structure','Distinct acquisition, investment enquiry and mortgage guidance journeys evolved around customer needs.'],
 ['Today','Develop · Incubate · Grow','Three separate product experiences with guided application processes.']
];
export default function About(){return <ContentShell eyebrow="WHO WE ARE" title="About Us." intro="Landshop is a co-investment real estate brand helping Nigerians make property ownership simpler, clearer and more accessible." image={landshopAboutImages[2].src} imageAlt={landshopAboutImages[2].alt}>
 <div className="v22-root v22-interior">
 {/* The ContentShell hero is section 1; eight intentional sections follow. */}
 <section className="v22-section ls27-about-intro" id="who-we-are">
  <div className="v22-container v22-two">
   <div>
    <span className="v22-eyebrow ls26-faded-eyebrow">WHO WE ARE</span><h2>About <span className="ls26-heading-green">Us</span><span className="v22-accent">.</span></h2>
    <p>Landshop is a co-investment real estate brand focused on simplifying property acquisition and making ownership more accessible to Nigerians.</p>
    <p>Through property acquisition, shared ownership interest, mortgage guidance and estate development support, we help people take clearer steps toward ownership.</p>
    <Link className="v22-btn" href="/contact">Speak to Landshop <ApprovedArrow /></Link>
   </div>
   <LandshopAboutCollage/>
  </div>
 </section>
 <section className="v22-section v22-muted ls27-about-film" aria-labelledby="ls27-about-video-heading"><div className="v22-container ls27-film-layout">
  <div><span className="v22-eyebrow ls26-faded-eyebrow">ABOUT LANDSHOP</span><h2 id="ls27-about-video-heading">Discover <span className="ls26-heading-green">Landshop</span> in our own words<span className="v22-accent">.</span></h2>
  <p>Watch the Landshop company introduction, then explore the products, people and principles behind our approach to property ownership.</p></div>
  <LandshopVideo video="about"/>
 </div></section>
 <section className="v22-section v22-muted"><div className="v22-container"><span className="v22-eyebrow">OUR STORY</span><h2>Built on the belief that property can be more accessible.</h2><div className="v22-steps">{milestones.map(([year,title,body])=><article key={year}><b>{year}</b><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>
 <section className="v22-section"><div className="v22-container v22-two"><article className="v22-vision"><span className="v22-eyebrow">OUR VISION</span><h2>Fill the real estate deficit for every generation of Nigeria's growing population.</h2><p>Vision statement from the original Landshop Product Deck.</p></article><article className="v22-vision"><span className="v22-eyebrow">MISSION STATEMENT</span><h2>Be the country's most trusted and affordable repository of real estate.</h2><p>Mission statement from the original Landshop Product Deck.</p></article></div></section>
 <section className="v22-section v22-muted"><div className="v22-container"><span className="v22-eyebrow">WHAT GUIDES US</span><h2>Clarity before complexity.</h2><div className="v22-steps">{[['01','Clarity','Explain property terms and documentation in language customers can use.'],['02','Accessibility','Create pathways for different property goals and levels of readiness.'],['03','Integrity','Distinguish verified facts from estimates and historical statements.'],['04','Accountability','Make applications and enquiries traceable through documented next steps.']].map(([n,t,b])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{b}</p></article>)}</div></div></section>
 <section className="v22-section" aria-labelledby="ls27-about-products"><div className="v22-container">
  <span className="v22-eyebrow ls26-faded-eyebrow">OUR</span><h2 id="ls27-about-products"><span className="ls26-heading-green">Products</span><span className="v22-accent">.</span></h2>
  <p>Explore five property pathways, each with a clear next step.</p>
  <LandshopProductCards/>
 </div></section>
 <section className="v22-section v22-muted"><div className="v22-container"><span className="v22-eyebrow">PROPERTY HERITAGE</span><h2>Projects, communities and the work behind the vision.</h2><p>Landshop's original product deck documents completed allocation events, construction activity and architectural concepts. Archival material is not evidence of current listing availability.</p><div className="v22-heritage"><img src={editorialImages.develop.src} alt="Illustrative property development image" loading="lazy"/><img src={landshopEditorialTeam.src} alt={landshopEditorialTeam.alt} loading="lazy"/><img src={editorialImages.architecture.src} alt="Illustrative building architecture" loading="lazy"/></div></div></section>
 <section className="v22-section ls27-team-story" aria-label="Landshop people and partnership"><div className="v22-container v22-two">
   <img src={landshopEditorialTeam.src} alt={landshopEditorialTeam.alt} loading="lazy" decoding="async" className="ls27-team-photo"/>
   <div><span className="v22-eyebrow ls26-faded-eyebrow">OUR PEOPLE</span><h2>Better <span className="ls26-heading-green">property decisions</span> begin with people<span className="v22-accent">.</span></h2>
   <p>Every enquiry deserves clear communication, proper information and a thoughtful next step. Our brand-led team visuals support that story; they do not represent verified employee identification.</p>
   <Link className="v22-btn" href="/careers">Explore Landshop Careers <ApprovedArrow /></Link></div>
 </div></section>
 <section className="v22-section ls-about-recognition"><div className="v22-container v22-two"><div><span className="v22-eyebrow">RELATIONSHIPS & RECOGNITION</span><h2>Trust is earned through the work.</h2><p>The original Landshop Product Deck records partner relationships, professional association references and recognition awards. Current partner and certification claims should be checked against authoritative records before public promotion.</p><Link className="v22-btn" href="/partners">Explore our partners <ApprovedArrow /></Link></div><img className="v22-cover-photo" src={editorialImages.officeTower.src} alt={editorialImages.officeTower.alt} loading="lazy"/></div></section>
 <section className="v22-section v22-final"><div className="v22-container v22-two"><div><span className="v22-eyebrow">OUR COMMITMENT</span><h2>Your next property decision deserves the right information.</h2><p>Whether you are exploring ownership, financing or property investment enquiries, our goal is to guide you towards a clear and responsible next action.</p></div><div className="v22-action-panel"><h3>Start with the right pathway.</h3><p>Explore available properties, submit a guided application or speak with our team.</p><div className="v22-actions"><Link className="v22-btn" href="/properties">Explore properties <ApprovedArrow /></Link><Link className="v22-text-link" href="/contact">Contact Landshop <ApprovedArrow /></Link></div></div></div></section>
 </div>
 </ContentShell>}
