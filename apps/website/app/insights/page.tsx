import ContentShell from '../../components/ContentShell';
import Link from 'next/link';
import {guides} from '../../lib/guides';
export const metadata={title:'Property Insights & Guides | Landshop Nigeria',description:'Practical Landshop guides to property due diligence, mortgage pre-qualification and inspections in Nigeria.'};
export default function Insights(){return <ContentShell eyebrow="Insights & Education" title="Better property decisions start with better questions." intro="Explore practical Landshop education on acquisition, inspections and mortgage planning. These guides are informational, not a substitute for project-specific contracts or independent advice." image="/media/deck-infrastructure.webp">
 <section><h2>Explore our knowledge center</h2><p className="content-subhead">Choose an article to read the full guide, including important checks to make before taking the next step.</p>
 <div className="content-grid">{guides.map((guide,i)=><article className="content-tile insight-card" key={guide.slug}>
  <Link href={'/insights/'+guide.slug} aria-label={'Read '+guide.title}><img src={guide.image} alt="" loading="lazy" className="insight-card-image"/></Link>
  <span className="number">0{i+1} / {guide.category} · {guide.readingMinutes} MIN READ</span><h3><Link href={'/insights/'+guide.slug}>{guide.title}</Link></h3><p>{guide.summary}</p>
  <Link href={'/insights/'+guide.slug}>Read the full guide →</Link>
 </article>)}</div>
 </section>
 <aside className="content-aside"><strong>Editorial note:</strong><p>Actual property availability, title status, mortgage terms and financial eligibility must be verified from current project or lender documentation. No outcome or return is promised.</p></aside>
 <aside className="content-band"><h2>Move from reading to the right application.</h2><p>Choose Develop, Incubate or Grow and complete a secure product-specific application.</p><Link href="/applications" className="content-cta">Explore applications →</Link></aside>
 </ContentShell>}
