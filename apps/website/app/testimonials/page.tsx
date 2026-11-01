import ApprovedArrow from '../../components/ApprovedArrow';
import Link from 'next/link';
import {landshopTestimonials} from '../../lib/testimonials';
import {editorialImages} from '../../lib/editorial-imagery';
import ContentShell from '../../components/ContentShell';
export const metadata={title:'What Our Clients Say About Us | Landshop Nigeria',description:'Customer feedback and testimonials from Landshop Nigeria.',alternates:{canonical:'/testimonials'}};
export default function Testimonials(){
 return <ContentShell eyebrow="OUR CUSTOMERS" title="What our clients say about us." intro="Read customer feedback and find out how Landshop supports the property ownership journey." image={editorialImages.team.src} imageAlt="Landshop editorial photograph, not an identified testimonial portrait">
  <section className="v22-root v22-section ls29-testimonials"><div className="v22-container"><h2>What our clients say about us.</h2>
   <div className="v22-products">{landshopTestimonials.filter(x=>x.status==='approved').map(t=><article key={t.id} className="v22-action-panel"><blockquote style={{fontSize:20,lineHeight:1.5,margin:0,color:'#234d39'}}>“{t.quote}”</blockquote><strong>{t.name}</strong><small>{t.location}</small></article>)}</div>
  </div></section>
  <section className="v22-root v22-section v22-muted"><div className="v22-container v22-two"><div><span className="v22-eyebrow">YOUR PROPERTY JOURNEY</span><h2>Start a conversation with Landshop.</h2><p>Ask our team for current properties, appointment availability and documented application processes.</p></div><Link className="v22-btn" href="/contact">Contact Landshop <ApprovedArrow /></Link></div></section>
 </ContentShell>;
}