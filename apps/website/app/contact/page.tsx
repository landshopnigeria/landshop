import Link from 'next/link';
import SiteIcon,{IconChip} from '../../components/SiteIcon';
import ContactForm from './ContactForm';
import {MarketFooter} from '../../components/MarketChrome';
import '../properties/property-market.css';
import './contact-premium.css';
export const metadata={title:'Contact Landshop | Property Enquiries & Customer Care',description:'Talk with Landshop Nigeria about property enquiries, estate inspections, mortgages, investments, customer service and your account.'};
const phone='+2349169973359',email='care@landshopnigeria.com';
const office="3rd Floor, King's Deck, Alternative Route, off Chevron Drive, Lekki, Lagos, Nigeria";
const googleMaps="https://maps.app.goo.gl/GLiNo6LfYWhWvJV1A";
const directions="https://www.google.com/maps/dir/?"+new URLSearchParams({api:"1",destination:office}).toString();
const mapEmbed="https://www.google.com/maps?q="+encodeURIComponent("Landshop HQ, "+office)+"&output=embed&z=16";
const businessSchema={"@context":"https://schema.org","@type":"RealEstateAgent","@id":"https://www.landshopnigeria.com/#landshop",name:"Landshop",url:"https://www.landshopnigeria.com",
 telephone:phone,email,hasMap:googleMaps,address:{"@type":"PostalAddress",streetAddress:"3rd Floor, King's Deck, Alternative Route, off Chevron Drive",addressLocality:"Lekki",addressRegion:"Lagos",addressCountry:"NG"}};

const topics=[
 {name:'Develop — Property',topic:'Develop',icon:'building' as const,description:'Land, houses, locations, inspections and acquisition documentation.'},
 {name:'Incubate — Investment',topic:'Incubate',icon:'chart' as const,description:'Property-linked investment enquiries, applications and current terms.'},
 {name:'Grow — Mortgage',topic:'Grow',icon:'key' as const,description:'Beta Mortgage, Mortgage Xtra and financing guidance.'},
 {name:'Customer & Realtor Support',topic:'Customer Support',icon:'help' as const,description:'Account access, applications, customer care and support requests.'}
];
export default function Contact(){return <main className="lc-premium"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(businessSchema)}}/>
 <section className="lc-hero"><div className="lc-hero-grid">
  <div className="lc-hero-copy">
   <nav className="lc-crumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span>Contact Landshop</nav>
   <span className="lc-kicker">LANDSHOP CUSTOMER CARE</span>
   <h1>Let's talk about <em>your next move.</em></h1>
   <p>Clear answers. Real support. Whether you are exploring property, planning an investment, applying for a mortgage or arranging an inspection, we're here to guide your next step.</p>
   <div className="lc-hero-actions"><a href="#enquiry" className="lc-solid">Send an enquiry <SiteIcon name="arrow" size={20}/></a><a href={'tel:'+phone} className="lc-hollow"><SiteIcon name="phone" size={20}/> Call Landshop</a></div>
   <small>Authentic support for Develop · Incubate · Grow</small>
  </div>
  <div className="lc-hero-photo">
   <img src="https://images.unsplash.com/photo-1645620413090-f458f39aea04?auto=format&fit=crop&q=80&w=1600" alt="Nigerian customer-service professional working at a laptop with a headset in Lagos; illustrative photograph, not a Landshop employee" fetchPriority="high" decoding="async"/>
   <div className="lc-photo-overlay"><IconChip name="phone"/><div><strong>We're here to listen.</strong><span>Property · Investment · Financing</span></div></div>
  </div>
 </div></section>
 <section className="lc-methods" aria-label="Contact methods">
  <a href={'tel:'+phone}><IconChip name="phone"/><span><small>PHONE</small><strong>+234 916 997 3359</strong><em>Talk with customer care</em></span><SiteIcon name="external" size={20}/></a>
  <a href={'mailto:'+email}><IconChip name="mail"/><span><small>EMAIL</small><strong>{email}</strong><em>Send documents or enquiries securely through appropriate channels</em></span><SiteIcon name="external" size={20}/></a>
  <a href="https://portal.landshopnigeria.com/support"><IconChip name="help"/><span><small>CUSTOMER PORTAL</small><strong>Account &amp; Support</strong><em>Secure assistance for existing customers</em></span><SiteIcon name="external" size={20}/></a>
 </section>
 <section className="lc-enquiry-grid" id="enquiry">
  <div className="lc-form-col"><span className="lc-kicker">SEND A MESSAGE</span><h2>How can we help?</h2><p>Share your enquiry and the Landshop team can route it to the right department. Do not submit passwords, complete identity documents or card details in this form.</p><ContactForm/></div>
  <aside className="lc-help-col"><span className="lc-kicker">YOUR SUPPORT OPTIONS</span><h2>Find the right team.</h2><p>Choose the pathway that fits your question.</p>
   {topics.map(t=><a href={"/contact?topic="+encodeURIComponent(t.topic)+"#enquiry"} className="lc-help-row" key={t.name}><IconChip name={t.icon}/><div><strong>{t.name}</strong><p>{t.description}</p><span className="lc-help-follow">Send this enquiry <SiteIcon name="arrow" size={17}/></span></div></a>)}
   <div className="lc-inspection"><SiteIcon name="calendar" size={30}/><h3>Book a property inspection</h3><p>Choose an inspection application and request a preferred date. Bookings require staff confirmation.</p><Link href="https://portal.landshopnigeria.com/applications/develop-inspection">Start an inspection request <SiteIcon name="external" size={18}/></Link></div>
  </aside>
 </section>
<section className="v22-root v22-section v22-muted v22-contact-extra" aria-label="Landshop product support"><div className="v22-container">
 <span className="v22-eyebrow">CHOOSE THE RIGHT SUPPORT</span><h2>Three products. The right conversation.</h2>
 <div className="v22-products">
  <article className="v22-action-panel"><IconChip name="building"/><h3>Develop</h3><p>Questions about properties, available units, documentation and acquisition applications.</p><Link href="/contact?topic=Develop#enquiry" className="v22-text-link">Ask about Develop ↗</Link></article>
  <article className="v22-action-panel"><IconChip name="chart"/><h3>Incubate</h3><p>Documented property-linked investment enquiries and application requirements.</p><Link href="/contact?topic=Incubate#enquiry" className="v22-text-link">Ask about Incubate ↗</Link></article>
  <article className="v22-action-panel"><IconChip name="key"/><h3>Grow</h3><p>Mortgage eligibility guidance, repayment illustrations and financing applications.</p><Link href="/contact?topic=Grow#enquiry" className="v22-text-link">Ask about Grow ↗</Link></article>
 </div></div></section>
 <section className="v22-root v22-section v22-contact-extra"><div className="v22-container v22-two"><div>
  <span className="v22-eyebrow">PROPERTY INSPECTIONS</span><h2>See the property. Ask better questions.</h2><p>Request a preferred inspection date through the approved Landshop portal. Your visit will be scheduled only after a staff member confirms availability.</p>
  <Link className="v22-btn" href="https://portal.landshopnigeria.com/applications/develop-inspection">Request an inspection ↗</Link>
 </div><img className="v22-cover-photo" src="https://images.pexels.com/photos/30688593/pexels-photo-30688593.jpeg?auto=compress&cs=tinysrgb&w=1100" loading="lazy" alt="Illustrative Nigerian professional consultation, not an actual property inspection"/></div></section>
  <section className="lc-visit"><div><span className="lc-kicker">VISIT BY APPOINTMENT</span><h2>Meet the Landshop team.</h2><p>Visit our King’s Deck office at Alternative Route, off Chevron Drive, Lekki, Lagos. Appointments must be confirmed in advance.</p><Link href="/contact?topic=Customer%20Support#enquiry">Request an office appointment <SiteIcon name="external" size={18}/></Link></div><div className="lc-visit-card"><IconChip name="pin"/><strong>Landshop Nigeria</strong><span>King’s Deck · Chevron Drive · Lekki, Lagos</span><small>Visits by confirmed appointment</small></div></section>
<section className="v22-root v22-section v22-muted v22-contact-extra"><div className="v22-container">
 <span className="v22-eyebrow">FREQUENT QUESTIONS</span><h2>Answers before your next step.</h2>
 <div className="v22-faq"><details><summary>Can I request an inspection before applying?</summary><p>Yes. Submit an inspection request for the property you are interested in. A member of the Landshop team must confirm the appointment.</p></details>
 <details><summary>Where can I check my application?</summary><p>Use your secure Landshop customer portal to view any application status that is available to your account.</p></details>
 <details><summary>How do I verify a property's price or availability?</summary><p>Use the current published listing and request written confirmation. Historical promotional material does not establish current sale terms.</p></details>
 <details><summary>How do I speak to the relevant department?</summary><p>Choose Develop, Incubate, Grow or Customer & Realtor Support in the enquiry form and describe your request.</p></details></div>
 </div></section>
 <section className="v22-root v22-section v22-contact-extra"><div className="v22-container v22-two">
 <div><span className="v22-eyebrow">CLIENT EXPERIENCES</span><h2>Service matters at every stage.</h2><p>Customers featured in Landshop's historic product deck describe the importance of follow-up, clear communication and support throughout the property journey.</p><Link href="/about" className="v22-text-link">More about Landshop ↗</Link></div>
 <blockquote className="v22-quote"><span className="v22-quote-mark">“</span><p>Landshop is authentic and experienced. And your customer service is 100%. From social media to follow up calls.</p><strong>Emmanuel Sanusi</strong><small>Ikotun, Lagos · excerpt from the original Landshop deck</small></blockquote>
 </div></section>
  <section className="lc-office-map" aria-label="Landshop office map">
  <div className="lc-map-intro"><div><span className="lc-kicker">FIND LANDSHOP ON GOOGLE MAPS</span><h2>Visit our Lekki office.</h2><p>{office}</p></div><div className="lc-map-actions"><a href={googleMaps} target="_blank" rel="noopener noreferrer"><SiteIcon name="pin" size={20}/> Open Google Maps</a><a className="lc-map-directions" href={directions} target="_blank" rel="noopener noreferrer"><SiteIcon name="compass" size={20}/> Get directions</a></div></div>
  <div className="lc-map-landscape"><iframe src={mapEmbed} title="Google Maps — Landshop HQ, King's Deck, Chevron Drive, Lekki, Lagos" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>
  <p className="lc-map-note">Google Maps directions open in a separate tab. Please confirm your appointment before visiting.</p>
 </section>
 <div className="lc-footer"><MarketFooter includeUpdates={false}/></div>
 </main>;}
