'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import {guides} from '../lib/guides';

/**
 * One approved editorial row across every public page.
 * Homepage already includes its own instance in V22HomeSections, so this
 * layout instance is suppressed only there. All twenty+ guides remain linked.
 */
const articles=guides.map(({slug,title,category,summary,image})=>({slug,title,category,summary,image,href:'/insights/'+slug}));
export default function GlobalArticleCarousel(){
 const pathname=usePathname();
 const [index,setIndex]=useState(0);
 const [paused,setPaused]=useState(false);
 const [reducedMotion,setReducedMotion]=useState(true);
 useEffect(()=>{setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)},[]);
 useEffect(()=>{if(paused||reducedMotion||articles.length<2||pathname==='/')return;
  const timer=window.setInterval(()=>{if(!document.hidden)setIndex(v=>(v+1)%articles.length)},6200);
  return()=>window.clearInterval(timer);
 },[paused,reducedMotion,pathname]);
 if(pathname==='/'||articles.length===0)return null;
 const step=(delta:number)=>setIndex(v=>(v+delta+articles.length)%articles.length);
 return <section className="v22-root v22-section ls27-journal ls29-global-articles" aria-labelledby="ls29-global-articles-title"><div className="v22-container">
  <div className="v22-heading"><div><span className="v22-eyebrow">LANDSHOP INSIGHTS</span><h2 id="ls29-global-articles-title"><span className="ls26-heading-green">Insights</span> &amp; Updates<span className="v22-accent">.</span></h2></div><Link href="/insights" className="v22-text-link">Explore all articles →</Link></div>
  <div role="region" aria-label="Explore the published Landshop articles" aria-roledescription="carousel"
    onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
    onFocusCapture={()=>setPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setPaused(false)}}>
   <div className="ls27-articles" aria-live="off">{[0,1,2].map(offset=>{
    const article=articles[(index+offset)%articles.length];
    return <article className="ls27-article" key={article.slug+'-'+offset}>
     <Link className="ls27-article-photo" href={article.href}><img src={article.image} alt={'Editorial photograph for '+article.title} loading="lazy" decoding="async"/></Link>
     <div className="ls27-article-body"><span>{article.category}</span><h3>{article.title}</h3><p>{article.summary}</p><Link className="v22-text-link" href={article.href}>Read article →</Link></div>
    </article>})}</div>
   <div className="ls27-article-actions"><div className="v22-carousel-buttons">
    <button type="button" onClick={()=>step(-1)} aria-label="Previous Landshop articles">←</button>
    <span aria-label={'Starting article '+(index+1)+' of '+articles.length}>{index+1} / {articles.length}</span>
    <button type="button" onClick={()=>step(1)} aria-label="Next Landshop articles">→</button>
   </div><Link href="/insights" className="v22-btn">View All Articles →</Link></div>
  </div></div></section>;
}
