
import ContentShell from '../../components/ContentShell';
import ContactForm from './ContactForm';
export const metadata={title:'Contact Landshop | Property Enquiries, Inspections & Customer Support',description:'Contact Landshop Nigeria for Develop, Incubate, Grow, estate inspections, property documentation and customer support.'};
const email='care@landshopnigeria.com';
const phone='+2349169973359';
const topics=[
 {name:'Develop',desc:'Estate information, property selection, inspection and documented purchase enquiries.',subject:'Develop Property Enquiry'},
 {name:'Incubate',desc:'Property-linked investment questions, suitability, documentation and available opportunities.',subject:'Incubate Investment Enquiry'},
 {name:'Grow',desc:'Beta Mortgage, Mortgage Xtra, indicative repayment calculations and financing applications.',subject:'Grow Mortgage Enquiry'},
 {name:'Customer Support',desc:'Existing applications, account access, verification and assistance with your next step.',subject:'Customer Support Request'}
];
export default function Contact(){return <ContentShell eyebrow="Contact Landshop" title="Your next property decision starts with a conversation." intro="Ask the Landshop team about properties, inspections, applications and mortgage guidance. Choose a topic so we can direct your enquiry." image="/media/deck-construction.webp">
 <section><h2>Get in touch</h2><p className="content-subhead">These contact details are taken from Landshop's existing published contact materials. For privacy, never send passwords or complete identity documents in an ordinary email.</p>
  <div className="content-grid">
   <div className="content-tile"><span className="number">EMAIL</span><h3>Customer Care</h3><p>For product questions and application enquiries.</p><a href={'mailto:'+email}>{email} →</a></div>
   <div className="content-tile"><span className="number">PHONE</span><h3>Call Landshop</h3><p>Talk with the team about your next steps.</p><a href={'tel:'+phone}>+234 916 997 3359 →</a></div>
   <div className="content-tile"><span className="number">CUSTOMER PORTAL</span><h3>Applications &amp; support</h3><p>Use the secure portal for account-specific support and applications.</p><a href="https://portal.landshopnigeria.com/support">Open support portal →</a></div>
  </div>
 </section>
 <section id="enquiries"><h2>Send a secure enquiry</h2><p className="content-subhead">Tell us what you need. Your message is recorded in the Landshop enquiries queue and routed for follow-up. Please do not include account passwords, identity documents or payment card information.</p><ContactForm/><h2 style={{marginTop:55}}>How can we help?</h2><div className="content-grid two">
  {topics.map((t,i)=><article className="content-tile" key={t.name}><span className="number">0{i+1} / {t.name.toUpperCase()}</span><h3>{t.name}</h3><p>{t.desc}</p><a href={'mailto:'+email+'?subject='+encodeURIComponent(t.subject)}>Email about {t.name} →</a></article>)}
 </div></section>
 <aside className="content-aside"><h3>Booking a property inspection?</h3><p>Use a guided Develop or Mortgage Xtra inspection application to share your preferred estate and date. An inspection is only confirmed when an authorized Landshop team member accepts the request.</p><a className="content-cta" href="/applications">See inspection application forms →</a></aside>
 <section className="content-split"><div><h2>Visit with an appointment</h2><p>Landshop's earlier contact materials list Kings Deck, Chevron Drive, Lekki, Lagos. Confirm current office details and availability before traveling.</p><p>For sensitive application records, use your signed-in customer account instead of sending unencrypted documents through ordinary email.</p></div><img src="/media/deck-building.webp" alt="Modern property exterior"/></section>
 </ContentShell>}
