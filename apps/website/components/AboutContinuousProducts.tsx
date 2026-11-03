'use client';
import {useEffect,useRef,useState,type FocusEvent} from 'react';
import Link from 'next/link';
import ApprovedArrow from './ApprovedArrow';
import {landshopProductCards} from '../lib/landshop-brand-media';

const fallbacks:Record<string,string>={devpro:'/owner/2026/garden-construction.webp',estatepro:'/owner/2026/garden-building-workers.webp'};
const cards=landshopProductCards.map(item=>({
 title:item.name,category:item.category,description:item.description,href:item.href,logo:item.logo,
 image:item.photo||fallbacks[item.slug]||'/owner/2026/estate-residential.webp',
 alt:item.photoAlt||'Landshop Nigerian real estate development photograph'
}));
export default function AboutContinuousProducts(){
 const ref=useRef<HTMLDivElement>(null);
 const paused=useRef({hover:false,focus:false,touch:false});
 const [active,setActive]=useState(0);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  let raf=0,prev=0,lastLabel=0,visible=true,reduce=false;
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion=()=>{reduce=mq.matches};
  motion();mq.addEventListener('change',motion);
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting},{threshold:.03});
  observer.observe(el);
  const frame=(now:number)=>{
   if(!prev)prev=now;
   const dt=Math.min(now-prev,70);prev=now;
   const first=el.children[0] as HTMLElement|undefined;
   const twin=el.children[cards.length] as HTMLElement|undefined;
   const second=el.children[1] as HTMLElement|undefined;
   const cycle=twin&&first?twin.offsetLeft-first.offsetLeft:0;
   const step=second&&first?second.offsetLeft-first.offsetLeft:0;
   if(visible&&!document.hidden&&!reduce&&!Object.values(paused.current).some(Boolean)&&cycle>0){
    el.scrollLeft+=dt*.025;
    if(el.scrollLeft>=cycle)el.scrollLeft-=cycle;
   }
   if(now-lastLabel>300&&step>0&&cycle>0){
    const position=((el.scrollLeft%cycle)+cycle)%cycle;
    const next=Math.floor((position+step*.5)/step)%cards.length;
    setActive(cur=>cur===next?cur:next);lastLabel=now;
   }
   raf=requestAnimationFrame(frame);
  };
  raf=requestAnimationFrame(frame);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();mq.removeEventListener('change',motion)};
 },[]);
 const go=(index:number)=>{
  const el=ref.current,first=el?.children[0] as HTMLElement|undefined,second=el?.children[1] as HTMLElement|undefined;
  const step=first&&second?second.offsetLeft-first.offsetLeft:0;
  if(!el||!step)return;
  const normalized=(index+cards.length)%cards.length;
  el.scrollTo({left:normalized*step,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  setActive(normalized);
 };
 const onBlur=(e:FocusEvent<HTMLDivElement>)=>{
  if(!e.currentTarget.contains(e.relatedTarget as Node|null))paused.current.focus=false;
 };
 return <div className="ls-about-carousel ls-about-continuous" aria-label="Landshop products" aria-roledescription="carousel"
  onMouseEnter={()=>{paused.current.hover=true}} onMouseLeave={()=>{paused.current.hover=false}}
  onFocusCapture={()=>{paused.current.focus=true}} onBlurCapture={onBlur}
  onTouchStart={()=>{paused.current.touch=true}} onTouchEnd={()=>{paused.current.touch=false}} onTouchCancel={()=>{paused.current.touch=false}}>
  <div className="ls-about-carousel-track" ref={ref} tabIndex={0} role="region" aria-label="Landshop product cards; automatically scrolling slowly, or explore using arrows">
   {[...cards,...cards].map((item,i)=>{
    const duplicate=i>=cards.length;
    return <article className="ls-about-carousel-card" key={item.href+'-'+i} aria-hidden={duplicate}>
     <Link href={item.href} className="ls-about-carousel-image" aria-label={duplicate?undefined:'Explore '+item.title} tabIndex={duplicate?-1:0}>
      <img src={item.image} alt={duplicate?'':item.alt} loading="lazy" decoding="async"/>
     </Link>
     <div className="ls-about-carousel-copy">
      {item.logo&&<img className="ls-about-product-logo" src={item.logo} alt={duplicate?'':item.title+' brand mark'} loading="lazy" decoding="async"/>}
      <span className="ls-about-carousel-category">{item.category}</span>
      <h3><Link href={item.href} tabIndex={duplicate?-1:0}>{item.title}</Link></h3>
      <p>{item.description}</p>
     </div>
    </article>;
   })}
  </div>
  <div className="ls-about-carousel-controls">
   <div className="ls-about-carousel-pagination">
    <span aria-live="off">{String(active+1).padStart(2,'0')} / {String(cards.length).padStart(2,'0')}</span>
    <div className="ls-about-carousel-dots" role="group" aria-label="Landshop product slides">
     {cards.map((item,i)=><button key={item.href} type="button" aria-label={'Show '+item.title+' slide'} aria-current={i===active?'step':undefined} className={i===active?'is-active':''} onClick={()=>go(i)}/>)}
    </div>
   </div>
   <div>
    <button type="button" aria-label="Previous product slide" onClick={()=>go(active-1)}><ApprovedArrow direction="left"/></button>
    <button type="button" aria-label="Next product slide" onClick={()=>go(active+1)}><ApprovedArrow/></button>
   </div>
  </div>
 </div>;
}
