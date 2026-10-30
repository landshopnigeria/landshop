import Link from 'next/link';
import ContentShell from '../../components/ContentShell';
export const metadata={title:'Privacy Policy | Landshop Nigeria',description:'Read how Landshop handles website, contact and newsletter information.',alternates:{canonical:'/privacy'}};
export default function Privacy(){return <ContentShell eyebrow="PRIVACY" title="Privacy Policy" intro="How Landshop uses information submitted through this website.">
 <article className="v22-root v22-section"><div className="v22-container" style={{maxWidth:850}}>
 <h2>Privacy and your information.</h2>
 <p>When you contact Landshop or submit an application, the information you provide is used to respond to your request, support the relevant property journey and administer the service you select. A newsletter email address is stored when you choose Subscribe and is used for Landshop property news and insights.</p>
 <h3>Information collected</h3><p>Depending on the service, information may include your name, contact information, submitted messages, application details and documents needed for eligibility or due diligence. Website technical logs may record information needed for security and reliability.</p>
 <h3>How information is handled</h3><p>Information is limited to appropriate authorized staff and service providers who support the selected service. Application and identity verification may require separate notices and additional consent. We maintain access controls and do not use a newsletter subscription as permission to publish personal details.</p>
 <h3>Newsletter preferences</h3><p>You can ask to stop newsletter messages by contacting <a href="mailto:care@landshopnigeria.com">care@landshopnigeria.com</a>. Newsletter contact details are not public. We retain necessary records for service administration, compliance and security and review data-retention needs over time.</p>
 <h3>Your requests</h3><p>For a request to access, correct or remove information, or for questions about processing, contact our team through the official <Link href="/contact">Contact page</Link>. Some requests may require identity verification.</p>
 <p style={{fontSize:13,color:'#607d6a'}}>Effective 30 October 2026. This notice describes the website’s current intake mechanisms and is subject to review for applicable Nigerian data-protection requirements.</p>
 </div></article></ContentShell>}