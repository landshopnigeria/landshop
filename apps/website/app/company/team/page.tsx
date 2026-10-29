
import ContentShell from '../../../components/ContentShell';
import Link from 'next/link';
import {editorialImages} from '../../../lib/editorial-imagery';
export const metadata={title:'Our Teams & Responsibilities | Landshop',description:'Understand how Landshop customer experience, property, legal, operations and finance teams support property decisions.'};
const groups=[
 ['Customer Experience','Guides enquiries, records application questions and coordinates communication.'],
 ['Property & Development','Coordinates estate information, inspections and project documentation with authorized property teams.'],
 ['Legal & Documentation','Reviews supporting property and application records through the company approval process.'],
 ['Finance & Operations','Supports documented payment and financing processes, subject to approved business terms.']
];
export default function Team(){return <ContentShell eyebrow="Company / Our People" title="The work behind every decision." intro="Landshop brings together customer support, property operations, finance and legal review so that customers can follow a clearer process." image={editorialImages.team.src} imageAlt={editorialImages.team.alt}>
  <section><h2>Our responsibility areas</h2><p className="content-subhead">We do not publish individual staff profiles until names, roles, portraits and permission to display them are verified. These descriptions explain the teams customers may interact with.</p><div className="content-grid two">{groups.map(([name,desc],i)=><article className="content-tile" key={name}><span className="number">0{i+1}</span><h3>{name}</h3><p>{desc}</p></article>)}</div></section>
  <aside className="content-band"><h2>Connect with the right team.</h2><p>Tell us which Landshop product or service you need help with, and we will direct your enquiry.</p><Link href="/contact" className="content-cta">Contact Landshop →</Link></aside>
 </ContentShell>}
