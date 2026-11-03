'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import ApprovedArrow from './ApprovedArrow';
import {landshopProductCards} from '../lib/landshop-brand-media';
import {editorialImages} from '../lib/editorial-imagery';
import {useCarouselPlayback} from './useCarouselPlayback';

type Item={title:string;category:string;description:string;href:string;image:string;alt:string;logo?:string;icon?:string};
const serviceIcons:Record<string,string>={
 advisory:'M3 20V8l9-5 9 5v12H3Zm5 0v-8h8v8M3 9h18',
 acquisition:'m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5',
 mortgage:'M3 11 12 3l9 8v10h-7v-7h-4v7H3V11Z',
 credit:'M6 2h9l4 4v16H6V2Zm9 0v5h4M9 12h7m-7 4h7',
 cooperative:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6M2 21v-2a6 6 0 0 1 12 0v2H2Zm14 0h6v-2a5 5 0 0 0-5-5',
 inspection:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Zm-8-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6'
};
const productFallback:Record<string,string>={
 devpro:'/owner/2026/garden-construction.webp',
 estatepro:'/owner/2026/garden-building-workers.webp'
};
const products:Item[]=landshopProductCards.map(item=>({
 title:item.name,category:item.category,description:item.description,href:item.href,
 image:item.photo||productFallback[item.slug]||'/owner/2026/estate-residential.webp',
 alt:item.photoAlt||'Original Landshop Nigerian estate and construction archive',
 logo:item.logo
}));
const services:Item[]=[
 {title:'Real Estate Advisory',category:'EXPERT GUIDANCE',description:'Expert guidance to help you make confident property decisions.',href:'/services/advisory',icon:'advisory',image:editorialImages.team.src,alt:editorialImages.team.alt},
 {title:'Property Acquisition Support',category:'PURCHASE SUPPORT',description:'End-to-end help to find, evaluate and acquire the right property.',href:'/services/property-acquisition',icon:'acquisition',image:editorialImages.develop.src,alt:editorialImages.develop.alt},
 {title:'Mortgage Guidance',category:'HOME FINANCING',description:'Practical support to explore and access suitable mortgage options.',href:'/services/mortgage',icon:'mortgage',image:editorialImages.grow.src,alt:editorialImages.grow.alt},
 {title:'Construction Credit',category:'DEVELOPMENT SUPPORT',description:'Learn about eligibility for construction and estate infrastructure finance.',href:'/services/construction-credit',icon:'credit',image:editorialImages.architecture.src,alt:editorialImages.architecture.alt},
 {title:'Cooperative Solutions',category:'GROUP OWNERSHIP',description:'Explore structured group ownership and cooperative enquiries.',href:'/services/cooperatives',icon:'cooperative',image:editorialImages.residential.src,alt:editorialImages.residential.alt},
 {title:'Property Inspections',category:'BOOK A VISIT',description:'Request a development visit with a confirmed appointment.',href:'/services/inspection',icon:'inspection',image:editorialImages.develop.src,alt:editorialImages.develop.alt}
];

function ShowcaseRail({items,label}:{items:Item[];label:string}){
 const track=useRef<HTMLDivElement>(null);
 const scrollTimer=useRef<number|null>(null);
 const [index,setIndex]=useState(0);
 const [columns,setColumns]=useState(3);
 const isService=label==='Landshop services';
 useEffect(()=>{
  const update=()=>setColumns(window.innerWidth<=720?1:window.innerWidth<=1000?2:3);
  update();
  window.addEventListener('resize',update,{passive:true});
  return()=>window.removeEventListener('resize',update);
 },[]);
 const last=Math.max(0,items.length-columns);
 const active=Math.min(index,last);
 useEffect(()=>{
  const el=track.current;
  const first=el?.firstElementChild as HTMLElement|null;
  const target=el?.children[active] as HTMLElement|undefined;
  if(!el||!first||!target)return;
  el.scrollTo({left:target.offsetLeft-first.offsetLeft,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 },[active,columns]);
 useEffect(()=>()=>{if(scrollTimer.current!==null)window.clearTimeout(scrollTimer.current)},[]);
 const syncScroll=()=>{
  if(scrollTimer.current!==null)window.clearTimeout(scrollTimer.current);
  scrollTimer.current=window.setTimeout(()=>{
   const el=track.current;
   const first=el?.children[0] as HTMLElement|undefined;
   const second=el?.children[1] as HTMLElement|undefined;
   if(!el||!first||!second)return;
   const step=second.offsetLeft-first.offsetLeft;
   if(step>0){
    const next=Math.max(0,Math.min(last,Math.round(el.scrollLeft/step)));
    setIndex(current=>current===next?current:next);
   }
  },180);
 };
 const advance=(dir:number)=>setIndex(current=>{
  const next=Math.min(current,last)+dir;
  return next>last?0:next<0?last:next;
 });
 const playback=useCarouselPlayback({count:items.length,delay:5600,onAdvance:()=>advance(1)});
 return <div className="ls-about-carousel" aria-label={label} aria-roledescription="carousel" {...playback.handlers}>
  <div className="ls-about-carousel-track" ref={track} onScroll={syncScroll} tabIndex={0} role="region" aria-label={label+' cards; swipe or scroll to explore'}>
   {items.map(item=><article className="ls-about-carousel-card" key={item.href}>
    {isService?<span className="ls-about-service-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={serviceIcons[item.icon||'advisory']}/></svg></span>
    :<Link href={item.href} className="ls-about-carousel-image" aria-label={'Explore '+item.title}>
     <img src={item.image} alt={item.alt} loading="lazy" decoding="async"/>
    </Link>}
    <div className="ls-about-carousel-copy">
     {item.logo&&<img className="ls-about-product-logo" src={item.logo} alt={item.title+' brand mark'} loading="lazy" decoding="async"/>}
     <span className="ls-about-carousel-category">{item.category}</span>
     <h3><Link href={item.href}>{item.title}</Link></h3>
     <p>{item.description}</p>
     <Link href={item.href} className="ls-about-card-link">Explore Service <ApprovedArrow /></Link>
    </div>
   </article>)}
  </div>
  <div className="ls-about-carousel-controls">
   <div className="ls-about-carousel-pagination">
    <span aria-live="off">{String(active+1).padStart(2,'0')} / {String(last+1).padStart(2,'0')}</span>
    <div className="ls-about-carousel-dots" role="group" aria-label={label+' pages'}>
     {Array.from({length:last+1},(_,n)=><button key={n} type="button" className={n===active?'is-active':''} aria-label={'Show '+label+' page '+(n+1)} aria-current={n===active?'step':undefined} onClick={()=>setIndex(n)}/>)}
    </div>
   </div>
   <div>
    <button type="button" aria-label={'Previous '+label+' cards'} onClick={()=>advance(-1)}><ApprovedArrow direction="left"/></button>
    <button type="button" aria-label={'Next '+label+' cards'} onClick={()=>advance(1)}><ApprovedArrow/></button>
   </div>
  </div>
 </div>;
}
export function AboutProductsCarousel(){return <ShowcaseRail items={products} label="Landshop products"/>}
export function AboutServicesCarousel(){return <ShowcaseRail items={services} label="Landshop services"/>}
