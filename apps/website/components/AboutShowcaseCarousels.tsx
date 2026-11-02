'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import ApprovedArrow from './ApprovedArrow';
import {landshopProductCards} from '../lib/landshop-brand-media';
import {editorialImages} from '../lib/editorial-imagery';
import {useCarouselPlayback} from './useCarouselPlayback';

type Item={title:string;category:string;description:string;href:string;image:string;alt:string;logo?:string};
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
 {title:'Property Acquisition',category:'PURCHASE SUPPORT',description:'Review property options, title documentation and inspection steps before deciding.',href:'/services/property-acquisition',image:editorialImages.develop.src,alt:editorialImages.develop.alt},
 {title:'Property Advisory',category:'EXPERT GUIDANCE',description:'Get practical help with property goals, due diligence and the buying process.',href:'/services/advisory',image:editorialImages.team.src,alt:editorialImages.team.alt},
 {title:'Mortgage Guidance',category:'HOME FINANCING',description:'Explore financing pathways, affordability and application requirements.',href:'/services/mortgage',image:editorialImages.grow.src,alt:editorialImages.grow.alt},
 {title:'Construction Credit',category:'DEVELOPMENT SUPPORT',description:'Enquire about eligibility for construction or estate infrastructure finance.',href:'/services/construction-credit',image:editorialImages.architecture.src,alt:editorialImages.architecture.alt},
 {title:'Cooperative Solutions',category:'GROUP OWNERSHIP',description:'Learn about structured and cooperative real estate enquiries.',href:'/services/cooperatives',image:editorialImages.residential.src,alt:editorialImages.residential.alt},
 {title:'Property Inspections',category:'BOOK A VISIT',description:'Request a property inspection and receive a confirmed appointment.',href:'/services/inspection',image:editorialImages.develop.src,alt:editorialImages.develop.alt}
];

function ShowcaseRail({items,label}:{items:Item[];label:string}){
 const track=useRef<HTMLDivElement>(null);
 const [index,setIndex]=useState(0);
 const [columns,setColumns]=useState(3);
 useEffect(()=>{
  const update=()=>setColumns(window.innerWidth<=640?1:window.innerWidth<=1000?2:3);
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
 const advance=(dir:number)=>setIndex(current=>{
  const next=Math.min(current,last)+dir;
  return next>last?0:next<0?last:next;
 });
 const playback=useCarouselPlayback({count:items.length,delay:5600,onAdvance:()=>advance(1)});
 return <div className="ls-about-carousel" aria-label={label} aria-roledescription="carousel" {...playback.handlers}>
  <div className="ls-about-carousel-track" ref={track} tabIndex={0} role="region" aria-label={label+' cards; swipe or scroll to explore'}>
   {items.map(item=><article className="ls-about-carousel-card" key={item.href}>
    <Link href={item.href} className="ls-about-carousel-image" aria-label={'Explore '+item.title}>
     <img src={item.image} alt={item.alt} loading="lazy" decoding="async"/>
    </Link>
    <div className="ls-about-carousel-copy">
     {item.logo&&<img className="ls-about-product-logo" src={item.logo} alt={item.title+' brand mark'} loading="lazy" decoding="async"/>}
     <span className="ls-about-carousel-category">{item.category}</span>
     <h3><Link href={item.href}>{item.title}</Link></h3>
     <p>{item.description}</p>
     <Link href={item.href} className="ls-about-card-link">Explore More <ApprovedArrow /></Link>
    </div>
   </article>)}
  </div>
  <div className="ls-about-carousel-controls">
   <span aria-live="off">{String(active+1).padStart(2,'0')} / {String(last+1).padStart(2,'0')}</span>
   <div>
    <button type="button" aria-label={'Previous '+label+' cards'} onClick={()=>advance(-1)}><ApprovedArrow direction="left"/></button>
    <button type="button" aria-label={'Next '+label+' cards'} onClick={()=>advance(1)}><ApprovedArrow/></button>
   </div>
  </div>
 </div>;
}
export function AboutProductsCarousel(){return <ShowcaseRail items={products} label="Landshop products"/>}
export function AboutServicesCarousel(){return <ShowcaseRail items={services} label="Landshop services"/>}
