
import ContentShell from '../../components/ContentShell';
import ContactEnquiryForm from '../../components/ContactEnquiryForm';
export const metadata={title:'Contact Landshop | Property, Mortgage & Customer Support',description:'Reach Landshop for property acquisition, Develop, Incubate, Grow, mortgage guidance and application support.'};
const email='care@landshopnigeria.com',phone='+2349169973359';
const topics=[
 {name:'Property Acquisition',desc:'Learn about available properties, title questions and current acquisition steps.',href:'/services/property-acquisition'},
 {name:'Mortgage Guidance',desc:'Compare illustrative repayment scenarios and approved application pathways.',href:'https://portal.landshopnigeria.com/calculator'},
 {name:'Applications & Support',desc:'Follow up on a current application using the secure customer portal.',href:'https://portal.landshopnigeria.com/support'},
 {name:'Property Inspection',desc:'Arrange a site visit through the appropriate guided Landshop application.',href:'/applications'}
];
export default function Contact(){
 return <ContentShell eyebrow="Contact Landshop" title="Your next property decision starts with a conversation." intro="Whether you are exploring a property, preparing for a mortgage or checking an application, our team can direct you to the right next step." image="/media/event0.webp">
  <section><span className="content-kicker" style={{color:'#08896b'}}>SUPPORT & ADVISORY</span><h2>We are here to help.</h2><p className="content-subhead">Reach the right team without sending sensitive identity records by email. The form below creates a tracked enquiry; mortgage, investment and property terms are always subject to written verification.</p>
   <div className="v16-contact-cards">{[
    {label:'Customer Care',name:email,href:'mailto:'+email,subtitle:'Questions and documentation'},
    {label:'Call Landshop',name:'+234 916 997 3359',href:'tel:'+phone,subtitle:'Speak with our customer team'},
    {label:'Secure Support',name:'Open Customer Portal',href:'https://portal.landshopnigeria.com/support',subtitle:'Account and application assistance'}
    ].map(t=><article className="content-tile" key={t.label}><span className="number">{t.label.toUpperCase()}</span><h3 style={{fontWeight:550}}>{t.name}</h3><p>{t.subtitle}</p><a href={t.href}>Get in touch ↗</a></article>)}</div>
  </section>
  <section id="enquiries" className="content-split" style={{alignItems:'start'}}>
   <div><span className="content-kicker" style={{color:'#087960'}}>HOW CAN WE HELP?</span><h2>Choose the right next step.</h2><p>Request information about current property opportunities, inspection arrangements, or financing estimates. Each service leads to its designated application journey.</p><div style={{display:'grid',gap:12,marginTop:22}}>{topics.map(t=><a href={t.href} className="content-tile" key={t.name} style={{display:'block',padding:18}}><strong>{t.name} ↗</strong><p style={{fontSize:12,margin:'7px 0 0'}}>{t.desc}</p></a>)}</div><div className="content-aside"><strong>Visit by appointment</strong><p>The previously published office reference is Kings Deck, Chevron Drive, Lekki, Lagos. Please confirm the current address and visiting hours before traveling.</p></div></div>
   <ContactEnquiryForm/>
  </section>
 </ContentShell>;
}
