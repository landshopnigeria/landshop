
import Link from 'next/link';
import {notFound} from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import {MarketFooter} from '../../../components/MarketChrome';
import {guides,findGuide} from '../../../lib/editorial';
import '../../properties/property-market.css';
export function generateStaticParams(){return guides.map(g=>({slug:g.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,guide=findGuide(slug);
 return guide?{title:guide.title+' | Landshop Insights',description:guide.description,alternates:{canonical:'https://www.landshopnigeria.com/insights/'+guide.slug}}:{title:'Guide not found | Landshop'};
}
export default async function GuidePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,guide=findGuide(slug);if(!guide)notFound();
 const related=guides.filter(g=>g.slug!==guide.slug);
 const schema={"@context":"https://schema.org","@type":"Article",headline:guide.title,description:guide.description,
 author:{"@type":"Organization",name:"Landshop"},publisher:{"@type":"Organization",name:"Landshop",url:"https://www.landshopnigeria.com"},
 mainEntityOfPage:"https://www.landshopnigeria.com/insights/"+guide.slug,about:guide.tags.join(', ')};
 return <main className="v16-editorial"><SiteHeader/><article>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>
  <header className="v16-article-heading"><nav className="content-breadcrumb" aria-label="Breadcrumb" style={{color:'#6d8378'}}><Link href="/">Home</Link> / <Link href="/insights">Insights</Link> / {guide.category}</nav><span className="v16-overline">{guide.category.toUpperCase()} · LANDSHOP INSIGHTS</span><h1>{guide.title}</h1><p>{guide.description}</p><small>Landshop Editorial Team · Educational guide · {guide.product} pathway</small></header>
  <div className="v16-article-cover"><img src={guide.image} alt={'Landshop property illustration for '+guide.title} width={1250} height={480}/></div>
  <div className="v16-article-layout"><div className="v16-article-copy">
   <p>Always review current estate documentation, eligibility and contractual terms independently before making a financial commitment.</p>
   {guide.sections.map(section=><section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map(p=><p key={p}>{p}</p>)}{section.points&&<ul>{section.points.map(point=><li key={point}>{point}</li>)}</ul>}</section>)}
   <section className="content-band"><h2>Ready for a more informed next step?</h2><p>Find the Landshop product that matches your enquiry. Request written terms before committing to any offer.</p><Link href={guide.ctaHref} className="content-cta">{guide.cta} ↗</Link></section>
   <section style={{marginTop:40}}><h2>Related insights</h2><div className="v16-tag-row">{related.map(g=><Link href={'/insights/'+g.slug} key={g.slug} className="v16-read-link">{g.title} ↗</Link>)}</div></section>
  </div><aside className="v16-article-sidebar"><span className="v16-overline">EXPLORE MORE</span><h2>Categories & guides</h2>{guides.map(g=><Link key={g.slug} href={'/insights/'+g.slug}>{g.title} ↗</Link>)}<h2>Tags</h2><div className="v16-tag-row">{guide.tags.map(t=><span key={t}>{t}</span>)}</div><h2>Need help?</h2><p style={{fontSize:13,color:'#6f8277',lineHeight:1.65}}>Request current property details or guidance from the Landshop team.</p><Link href="/contact">Contact our team ↗</Link></aside>
  </div></article>
  <div className="mk-layout" style={{minHeight:'auto'}}><div className="mk-wrap"><MarketFooter/></div></div>
 </main>;
}
