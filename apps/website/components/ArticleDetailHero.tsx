'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import ApprovedArrow from './ApprovedArrow';
import type {ArticleHeroSlide} from '../lib/article-hero-gallery';

type Props={title:string;category:string;summary:string;readingMinutes:number;slides:ArticleHeroSlide[]};

/** Exact approved interactive article-detail preview, without preview toolbar.
 * Only this hero is replaced; article body and sidebars remain server-rendered.
 */
export default function ArticleDetailHero({title,category,summary,readingMinutes,slides}:Props){
 const [index,setIndex]=useState(0);
 const [paused,setPaused]=useState(false);
 const [hovered,setHovered]=useState(false);
 const [focused,setFocused]=useState(false);
 const [reduceMotion,setReduceMotion]=useState(false);
 useEffect(()=>{
  const query=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReduceMotion(query.matches);
  update();
  query.addEventListener('change',update);
  return ()=>query.removeEventListener('change',update);
 },[]);
 useEffect(()=>{
  if(paused||hovered||focused||reduceMotion||slides.length<=1)return;
  const timer=window.setInterval(()=>setIndex(current=>(current+1)%slides.length),6000);
  return ()=>window.clearInterval(timer);
 },[paused,hovered,focused,reduceMotion,slides.length]);
 const move=(delta:number)=>setIndex(current=>(current+delta+slides.length)%slides.length);
 const current=slides[index];
 return <section className="lsah-hero" aria-label={'Article image slider for '+title} aria-roledescription="carousel"
   onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
   onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setFocused(false)}}
   onKeyDown={event=>{if(event.key==='ArrowRight'){event.preventDefault();move(1)}else if(event.key==='ArrowLeft'){event.preventDefault();move(-1)}}}>
  {slides.map((slide,i)=><img key={slide.src} className={'lsah-slide-img'+(i===index?' lsah-slide-active':'')} src={slide.src} alt={slide.alt}
    loading={i===0?'eager':'lazy'} decoding="async" aria-hidden={i!==index} />)}
  <div className="lsah-hero-content">
   <nav className="lsah-crumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/insights">Insights</Link><span>/</span><span>{category}</span></nav>
   <div className="lsah-glass">
    <p className="lsah-eyebrow">INSIGHTS / {category.toUpperCase()}</p>
    <h1 className="lsah-title">{title}</h1>
    <p className="lsah-desc">{summary}</p>
    <div className="lsah-actions"><Link className="lsah-primary-cta" href="/contact">Contact Us <ApprovedArrow/></Link><Link className="lsah-ghost-cta" href="/insights">Explore Insights</Link></div>
   </div>
   <div className="lsah-hero-meta">{readingMinutes} min read · Landshop Insights</div>
  </div>
  <div className="lsah-slide-progress" aria-label="Choose an article photograph">
   {slides.map((slide,i)=><button type="button" key={slide.src} className={'lsah-slide-dot'+(i===index?' lsah-slide-dot-active':'')}
    onClick={()=>setIndex(i)} aria-label={'View photograph '+(i+1)} aria-pressed={i===index}/>)}
  </div>
  <div className="lsah-slide-caption" aria-live="polite">{current.alt} · Owner-supplied Landshop archive</div>
  <div className="lsah-hero-controls">
   <span className="lsah-slide-count">{String(index+1).padStart(2,'0')} / {String(slides.length).padStart(2,'0')}</span>
   <div className="lsah-carousel-controls">
    <button type="button" className="lsah-circle-arrow" onClick={()=>move(-1)} aria-label="Previous photograph"><ApprovedArrow direction="left"/></button>
    <button type="button" className="lsah-circle-arrow" onClick={()=>move(1)} aria-label="Next photograph"><ApprovedArrow/></button>
   </div>
   <button type="button" className="lsah-pause-control" onClick={()=>setPaused(v=>!v)} aria-pressed={paused}>{paused?'Play':'Pause'}</button>
  </div>
 </section>;
}
