import Link from 'next/link';
import {landshopTestimonials} from '../../lib/testimonials';
import {editorialImages} from '../../lib/editorial-imagery';
import ContentShell from '../../components/ContentShell';
export const metadata={title:'Client Experiences | Landshop Nigeria',description:'Historical customer testimonials in Landshop’s original company deck, with context and the latest property insights.',alternates:{canonical:'/testimonials'}};
export default function Testimonials(){
 return <ContentShell eyebrow="CLIENT EXPERIENCES" title="Stories behind the property journey." intro="Experiences shared in the original Landshop Product Deck. Customer statements are historical; current service terms must be confirmed independently." image={editorialImages.team.src} imageAlt="Landshop editorial photograph, not an identified testimonial portrait">
  <section className="v22-root v22-section"><div className="v22-container"><span className="v22-eyebrow">CLIENT EXPERIENCES</span><h2>Property journeys, in their words.</h2>
   <div className="v22-products">{landshopTestimonials.filter(x=>x.status==='approved').map(t=><article key={t.id} className="v22-action-panel"><span className="v22-eyebrow">HISTORICAL DECK TESTIMONIAL</span><blockquote style={{fontSize:20,lineHeight:1.5,margin:0,color:'#234d39'}}>“{t.quote}”</blockquote><strong>{t.name}</strong><small>{t.location}</small></article>)}</div>
  </div></section>
  <section className="v22-root v22-section v22-muted"><div className="v22-container v22-two"><div><span className="v22-eyebrow">YOUR PROPERTY JOURNEY</span><h2>Start a conversation with Landshop.</h2><p>Ask our team for current properties, appointment availability and documented application processes.</p></div><Link className="v22-btn" href="/contact">Contact Landshop ↗</Link></div></section>
 </ContentShell>;
}