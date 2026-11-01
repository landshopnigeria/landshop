import ApprovedArrow from '../../components/ApprovedArrow';
import ContentShell from '../../components/ContentShell';
import Link from 'next/link';
import {editorialImages} from '../../lib/editorial-imagery';
import {guides} from '../../lib/guides';
import V22InsightsList from '../../components/V22InsightsList';
export const metadata={title:'Landshop Insights | Property, Finance, Lifestyle & Marketing',description:'Twenty Landshop articles covering property ownership, mortgage planning, investment risk, location research, lifestyle and property marketing.'};
export default async function Insights({searchParams}:{searchParams:Promise<{category?:string}>}){const {category}=await searchParams;
 return <ContentShell eyebrow="THE LANDSHOP JOURNAL" title="Insights for better property decisions." intro="Explore property ownership, investment, finance, Nigeria locations, lifestyle and honest marketing through practical guides." image={editorialImages.skyline.src} imageAlt={editorialImages.skyline.alt}>
  <V22InsightsList articles={guides.map(g=>({slug:g.slug,title:g.title,category:g.category,summary:g.summary,image:g.image,imageAlt:g.imageAlt,readingMinutes:g.readingMinutes,tags:g.tags}))} initialCategory={category||'All'}/>
  <section className="v22-root v22-section v22-muted"><div className="v22-container v22-two"><div><span className="v22-eyebrow">FIND YOUR PATHWAY</span><h2>From reading to a clearer next step.</h2><p>Our educational articles do not replace professional advice or current project documents. Explore the relevant Landshop product, or ask our team for verified details.</p></div><div className="v22-action-panel"><Link href="/develop" className="v22-text-link">Develop <ApprovedArrow /></Link><Link href="/incubate" className="v22-text-link">Incubate <ApprovedArrow /></Link><Link href="/grow" className="v22-text-link">Grow <ApprovedArrow /></Link><Link href="/contact" className="v22-btn">Contact Landshop <ApprovedArrow /></Link></div></div></section>
 </ContentShell>;
}
