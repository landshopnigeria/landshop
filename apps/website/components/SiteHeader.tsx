
'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

type MenuItem={title:string;description:string;href:string;icon:string};
const menus:{label:string;intro:string;groups:{label:string;items:MenuItem[]}[]}[]=[
 {label:'Product',intro:'Three purposeful pathways. One connected Landshop experience.',groups:[
  {label:'Our products',items:[
   {title:'Develop',description:'Documented land, estate and housing opportunities.',href:'/develop',icon:'⌂'},
   {title:'Incubate',description:'Explore appropriate property-linked opportunities.',href:'/incubate',icon:'◇'},
   {title:'Grow',description:'Mortgage guidance and ownership pathways.',href:'/grow',icon:'↗'}]}]},
 {label:'Company',intro:'The people, values and mission behind Landshop.',groups:[
  {label:'Discover Landshop',items:[
   {title:'Who We Are',description:'Building a more accessible Nigeria.',href:'/about',icon:'⌂'},
   {title:'Vision & Mission',description:'Our long-term purpose and commitments.',href:'/about#vision',icon:'◎'},
   {title:'Leadership & Team',description:'Explore the people behind our work.',href:'/company/team',icon:'♙'}]}]},
 {label:'Services',intro:'Professional support for each important property decision.',groups:[
  {label:'Property services',items:[
   {title:'Property Acquisition',description:'Select and assess suitable property options.',href:'/services/property-acquisition',icon:'⌂'},
   {title:'Property Advisory',description:'Request expert guidance before committing.',href:'/services/advisory',icon:'✧'},
   {title:'Inspection & Verification',description:'Book guided property enquiries and inspections.',href:'/applications',icon:'◎'},
   {title:'Construction Finance',description:'Review available construction-credit pathways.',href:'/services/construction-credit',icon:'▤'}]}]},
 {label:'Properties',intro:'Discover current, management-published property opportunities.',groups:[
  {label:'Explore property',items:[
   {title:'All Properties',description:'Search published inventory and compare details.',href:'/properties',icon:'⌂'},
   {title:'For Sale',description:'Browse purchasing opportunities.',href:'/properties?purpose=Buy',icon:'▦'},
   {title:'For Rent',description:'Browse rental opportunities where available.',href:'/properties?purpose=Rent',icon:'⌑'},
   {title:'Shortlet',description:'Find verified short-stay opportunities.',href:'/properties?purpose=Shortlet',icon:'◇'}]}]},
 {label:'Mortgage',intro:'Calculate first. Apply with a clear understanding of the terms.',groups:[
  {label:'Mortgage & finance',items:[
   {title:'Mortgage Calculator',description:'Estimate equity, tenure and monthly repayments.',href:'https://portal.landshopnigeria.com/calculator',icon:'▤'},
   {title:'Beta Mortgage',description:'Review eligibility and required documentation.',href:'/grow/beta-mortgage',icon:'⌂'},
   {title:'Mortgage Xtra',description:'Explore the additional mortgage pathway.',href:'/grow/mortgage-xtra',icon:'↗'},
   {title:'Mortgage Applications',description:'Proceed to the correct guided application.',href:'/applications',icon:'◈'}]}]}
];
export default function SiteHeader(){
 const [open,setOpen]=useState<string|null>(null);
 const [mobile,setMobile]=useState(false);
 const ref=useRef<HTMLElement|null>(null);
 const path=usePathname();
 useEffect(()=>{setOpen(null);setMobile(false)},[path]);
 useEffect(()=>{
  const outside=(event:PointerEvent)=>{if(!ref.current?.contains(event.target as Node)){setOpen(null);setMobile(false)}};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(null);setMobile(false)}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)};
 },[]);
 return <div className="v16-header-wrap" ref={ref as React.RefObject<HTMLDivElement>}>
  <div className="v16-topbar"><span>Everyone Deserves Affordable Property.</span><form action="/search" method="get" role="search"><label className="v16-sr" htmlFor="v16-search">Search Landshop</label><input id="v16-search" name="q" type="search" maxLength={90} placeholder="Search property, mortgage and insights…"/><button aria-label="Search Landshop" type="submit">⌕</button></form><div><a href="https://portal.landshopnigeria.com">Account</a><a href="https://portal.landshopnigeria.com/support">Support</a></div></div>
  <header className="v16-header">
   <div className="v16-header-inner">
    <Link href="/" className="v16-brand" aria-label="Landshop homepage"><img src="/media/logo.webp" width={145} height={57} alt="Landshop official logo"/></Link>
    <button type="button" className="v16-mobile-trigger" aria-controls="v16-mainnav" aria-expanded={mobile} aria-label={mobile?'Close navigation':'Open navigation'} onClick={()=>{setMobile(v=>!v);setOpen(null)}}>{mobile?'✕':'☰'}</button>
    <nav id="v16-mainnav" className={'v16-nav '+(mobile?'v16-nav-open':'')} aria-label="Main navigation">
     <Link href="/" className={path==='/'?'v16-active':''}>Home</Link>
     {menus.map(menu=><div key={menu.label} className={'v16-nav-group '+(open===menu.label?'v16-group-open':'')}
       onMouseEnter={()=>{if(window.matchMedia('(hover: hover)').matches)setOpen(menu.label)}}
       onMouseLeave={()=>{if(window.matchMedia('(hover: hover)').matches)setOpen(null)}}>
       <button type="button" aria-expanded={open===menu.label} aria-controls={'v16-panel-'+menu.label}
        onClick={()=>setOpen(v=>v===menu.label?null:menu.label)}>
        {menu.label} <span aria-hidden="true" className="v16-chevron">⌄</span>
       </button>
       {open===menu.label&&<div className="v16-mega" id={'v16-panel-'+menu.label} role="region" aria-label={menu.label+' menu'}>
        <div className="v16-mega-intro"><span className="v16-overline">{menu.label.toUpperCase()}</span><h2>{menu.label==='Mortgage'?'Make the numbers clear.':menu.label==='Product'?'Develop. Incubate. Grow.':'Explore '+menu.label.toLowerCase()+'.'}</h2><p>{menu.intro}</p><Link href={menu.label==='Mortgage'?'https://portal.landshopnigeria.com/calculator':'/applications'} className="v16-action">{menu.label==='Mortgage'?'Calculate Mortgage':'Get Started'} ↗</Link></div>
        <div className="v16-menu-content">{menu.groups.map(group=><div key={group.label}><span className="v16-overline">{group.label}</span>{group.items.map(item=><Link href={item.href} key={item.href+item.title} onClick={()=>{setOpen(null);setMobile(false)}} className="v16-menu-link"><span className="v16-menu-icon" aria-hidden="true">{item.icon}</span><span><strong>{item.title}</strong><small>{item.description}</small></span><span aria-hidden="true" className="v16-menu-arrow">↗</span></Link>)}</div>)}</div>
       </div>}
      </div>)}
     <Link href="/insights" className={path?.startsWith('/insights')?'v16-active':''}>Insights</Link>
     <Link href="/contact" className={path?.startsWith('/contact')?'v16-active':''}>Contact</Link>
    </nav>
    <a className="v16-get-started" href="https://portal.landshopnigeria.com">Get Started <span aria-hidden="true">↗</span></a>
   </div>
  </header>
 </div>;
}
