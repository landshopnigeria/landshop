import ApprovedArrow from '../../components/ApprovedArrow';

import ContentShell from '../../components/ContentShell';
import Link from 'next/link';
import {editorialImages} from '../../lib/editorial-imagery';
export const metadata={title:'Thrift & Cooperatives | Landshop',description:'Understand Landshop cooperative and collective property interest pathways and request verified programme information.'};
export default function Thrift(){return <ContentShell eyebrow="Thrift & Cooperatives" title="Build towards property goals, together." intro="Explore the role of collective planning and cooperative structures in property acquisition. Programme availability and financial terms must be established through current documentation." image={editorialImages.grow.src} imageAlt={editorialImages.grow.alt}>
 <section><h2>What to review before joining</h2><div className="content-grid">
 <div className="content-tile"><span className="number">01</span><h3>Membership and governance</h3><p>Review the legal entity, registration, decision-making rules, eligibility criteria and how members are represented.</p></div>
 <div className="content-tile"><span className="number">02</span><h3>Contributions and protection</h3><p>Confirm the contribution schedule, fees, custody of funds, documentation, and the written rules for withdrawals and refunds.</p></div>
 <div className="content-tile"><span className="number">03</span><h3>Property and allocation</h3><p>Check the specific estate or product, title documentation, eligibility for allocation and the obligations of all parties.</p></div>
 </div></section>
 <aside className="content-band"><h2>Request the latest approved programme details.</h2><p>Do not make contributions based on a website description alone. Landshop will need to provide verified current terms and a suitable customer application pathway.</p><Link className="content-cta" href="/contact">Ask about cooperatives <ApprovedArrow /></Link></aside>
 </ContentShell>}
