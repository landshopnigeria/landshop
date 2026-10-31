import Link from 'next/link';
import {notFound} from 'next/navigation';
import ContentShell from '../../../components/ContentShell';
import ContactForm from '../../contact/ContactForm';
import V22ArticleComments from '../../../components/V22ArticleComments';
import {guides,findGuide} from '../../../lib/guides';
export function generateStaticParams(){return guides.map(g=>({slug:g.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const g=findGuide(slug);
 return g?{title:g.title+' | Landshop Insights',description:g.summary,alternates:{canonical:'/insights/'+g.slug},
 openGraph:{title:g.title,description:g.summary,images:[g.image]}}:{title:'Article Not Found | Landshop'};
}
export default async function GuidePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const g=findGuide(slug);if(!g)notFound();
 const related=guides.filter(a=>a.slug!==g.slug && a.category===g.category).slice(0,3);
 const categories=[...new Set(guides.map(a=>a.category))];
 return <ContentShell eyebrow={'INSIGHTS / '+g.category} title={g.title} intro={g.summary} image={g.image} imageAlt={g.imageAlt}>
 <div className="v22-root v22-article-layout">
 <div className="v22-article-primary">
  <nav className="v22-article-nav" aria-label="Article navigation"><Link href="/insights">← All Insights</Link><span>{g.readingMinutes} min read</span></nav>
  <article className="v22-article-body" itemScope itemType="https://schema.org/Article">
   <span className="v22-eyebrow">{g.category}</span>
   {g.photoNote&&<p className="ls-owner-article-photo-note"><strong>What this real photograph illustrates:</strong> {g.photoNote}</p>}
   {g.sections.map(section=><section key={section.heading}><h2>{section.heading}</h2><p>{section.paragraph}</p>{section.points&&<ul>{section.points.map(point=><li key={point}>{point}</li>)}</ul>}</section>)}
   <aside className="v22-article-disclaimer"><strong>Information note:</strong> This article provides general educational guidance. Verify individual property records, applicable laws, financial terms and lender or investment arrangements against current authoritative documentation. Seek independent professional advice where appropriate.</aside>
  </article>
  <V22ArticleComments slug={slug}/>
  {related.length>0&&<section className="v22-article-related"><h2>Related reading</h2>{related.map(r=><Link key={r.slug} href={'/insights/'+r.slug}>{r.title} <span>→</span></Link>)}</section>}
 </div>
 <aside className="v22-article-sidebar" aria-label="Article sidebars">
  <div className="v22-sidebar-box"><h3>Explore categories</h3>{categories.map(c=><Link key={c} href={'/insights?category='+encodeURIComponent(c)}>{c}</Link>)}</div>
  <div className="v22-sidebar-box"><h3>Article tags</h3><div className="v22-taglist">{(g.tags?.length?g.tags:[g.category,'Property guidance','Landshop']).map(t=><span key={t}>{t}</span>)}</div></div>
  <div className="v22-sidebar-box"><h3>Ask Landshop</h3><p>Have a question about a property, product or service? Send it to our team.</p><ContactForm/></div>
  <div className="v22-sidebar-box"><h3>About Landshop</h3><p>Landshop helps people make better-informed property decisions through Develop, Incubate and Grow.</p><Link className="v22-text-link" href="/about">Learn more about us →</Link></div>
 </aside></div></ContentShell>;
}
