import Link from 'next/link';
import {notFound} from 'next/navigation';
import ContentShell from '../../../components/ContentShell';
import {guides,findGuide} from '../../../lib/guides';
export function generateStaticParams(){return guides.map(g=>({slug:g.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const guide=findGuide(slug);
 return guide?{title:guide.title+' | Landshop Insights',description:guide.summary,alternates:{canonical:'/insights/'+guide.slug}}:{title:'Article Not Found | Landshop'};
}
export default async function GuidePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const guide=findGuide(slug);if(!guide)notFound();
 return <ContentShell eyebrow={'Insights / '+guide.category} title={guide.title} intro={guide.summary} image={guide.image}>
 <nav aria-label="Article navigation" className="insight-navigation"><Link href="/insights">← All insights</Link><span>{guide.readingMinutes} minute read</span></nav>
 <article className="insight-article">{guide.sections.map(section=><section key={section.heading}><h2>{section.heading}</h2><p>{section.paragraph}</p>{section.points&&<ul>{section.points.map(point=><li key={point}>{point}</li>)}</ul>}</section>)}</article>
 <aside className="content-band"><h2>Need a property-specific answer?</h2><p>For verified project details or a financing discussion, contact Landshop or choose the relevant guided application.</p><div className="content-actions"><Link href="/contact" className="content-cta">Contact our team →</Link><Link href="/applications" className="content-link">Explore applications →</Link></div></aside>
 </ContentShell>;
}
