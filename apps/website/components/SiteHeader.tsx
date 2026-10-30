'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import SiteIcon,{IconChip,type SiteIconName} from './SiteIcon';

type Entry={title:string,href:string,icon:SiteIconName,description:string};
type Group={label:string,eyebrow:string,description:string,items:Entry[]};
const groups:Group[]=[
 {label:'Products',eyebrow:'LANDSHOP PRODUCTS',description:'Explore three clear pathways to property acquisition, investment and home financing.',items:[
  {title:'Develop',href:'/develop',icon:'building',description:'Land, houses, inspections and ownership'},
  {title:'Incubate',href:'/incubate',icon:'chart',description:'Property-linked investment applications'},
  {title:'Grow',href:'/grow',icon:'key',description:'Beta Mortgage and Mortgage Xtra'},
  {title:'All Applications',href:'/applications',icon:'document',description:'Seven secure guided product forms'}]},
 {label:'Projects',eyebrow:'LANDSHOP PROJECTS',description:'Explore our current sales focus and previous estate projects.',items:[
  {title:'All Projects',href:'/projects',icon:'grid',description:'Current opportunities and past projects'},
  {title:'Famous Gardens',href:'/projects/famous-gardens',icon:'home',description:'Explore homes in Iberekodo, Ibeju-Lekki'},
  {title:'Merit Park',href:'/projects/merit-park',icon:'building',description:'Project videos and subscriber support'},
  {title:'Green Island',href:'/projects/green-island',icon:'building',description:'Project videos and subscriber support'},
  {title:'Maiyegun Beach Estate',href:'/projects/maiyegun-beach-estate',icon:'building',description:'Project videos and subscriber support'}]},
 {label:'Careers',eyebrow:'CAREERS AT LANDSHOP',description:'Learn about careers, the team and upcoming programmes at Landshop.',items:[
  {title:'Careers',href:'/careers',icon:'briefcase',description:'Working at Landshop and future openings'},
  {title:'Career Programmes',href:'/careers/programs',icon:'users',description:'Learning and career development enquiries'}]},
 {label:'Company',eyebrow:'DISCOVER LANDSHOP',description:'Learn about our purpose, our team responsibilities and the company behind the experience.',items:[
  {title:'Who We Are',href:'/about#who-we-are',icon:'users',description:'Our company and operating philosophy'},
  {title:'Vision & Mission',href:'/about#vision',icon:'compass',description:'Our long-term direction'},
  {title:'Our Teams',href:'/company/team',icon:'briefcase',description:'People, operations and responsibilities'},
  {title:'Contact Landshop',href:'/contact',icon:'mail',description:'Speak with the right team'}]},
 {label:'Services',eyebrow:'PROPERTY SERVICES',description:'Choose a service or start a guided application. All prices and property terms require verification.',items:[
  {title:'Property Acquisition',href:'/services/property-acquisition',icon:'home',description:'Explore ownership opportunities'},
  {title:'Property Advisory',href:'/services/advisory',icon:'compass',description:'Review property decisions'},
  {title:'Mortgage Guidance',href:'/services/mortgage',icon:'calculator',description:'Plan financial eligibility'},
  {title:'Property Inspection',href:'/applications',icon:'calendar',description:'Book a documented inspection'},
  {title:'Construction Credit',href:'/services/construction-credit',icon:'building',description:'Development funding enquiries'},
  {title:'Cooperatives & Thrift',href:'/thrift',icon:'wallet',description:'Collective property planning'}]}
];
const portal='https://portal.landshopnigeria.com';
const groupsByLabel=Object.fromEntries(groups.map(group=>[group.label,group]));
export default function SiteHeader(){
 const pathname=usePathname()||'/';
 const [menuOpen,setMenuOpen]=useState(false);
 const [expanded,setExpanded]=useState<string|null>(null);
 const [focused,setFocused]=useState<string|null>(null);
 const frame=useRef<HTMLDivElement>(null);
 const activeGroup=expanded?groupsByLabel[expanded]:null;
 const selected=activeGroup?.items.find(i=>i.title===focused)||activeGroup?.items[0];
 useEffect(()=>{setMenuOpen(false);setExpanded(null);setFocused(null)},[pathname]);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){setExpanded(null);setMenuOpen(false)}};
  const onPointer=(event:PointerEvent)=>{if(frame.current&&!frame.current.contains(event.target as Node)){setExpanded(null);setMenuOpen(false)}};
  window.addEventListener('keydown',onKey);
  document.addEventListener('pointerdown',onPointer);
  return()=>{window.removeEventListener('keydown',onKey);document.removeEventListener('pointerdown',onPointer)};
 },[]);
 const toggle=(label:string)=>{setExpanded(previous=>previous===label?null:label);setFocused(null)};
 const topLinks=[{text:'Account',url:portal,icon:'users' as const},{text:'Realtor Portal',url:portal,icon:'key' as const},{text:'Command Center',url:'https://app.landshopnigeria.com/admin',icon:'grid' as const}];
 return <div className="ls-site-chrome" ref={frame}>
  <div className="ls-utility-bar"><div className="ls-utility-inner">
   <span className="ls-tagline">Everyone Deserves Affordable Property.</span>
   <form role="search" action="/search" method="get" className="ls-global-search">
    <SiteIcon name="search" size={20}/><input name="q" type="search" placeholder="Search properties, products, guides…" maxLength={90} aria-label="Search Landshop"/><button type="submit" aria-label="Submit search"><SiteIcon name="arrow" size={18}/></button>
   </form>
   <div className="ls-utility-links">{topLinks.map(x=><a href={x.url} key={x.text}><SiteIcon name={x.icon} size={19}/>{x.text}</a>)}</div>
  </div></div>
  <div className="ls-glass-wrap"><header className="ls-glass-header">
   <Link href="/" className="ls-brand" aria-label="Landshop homepage">
    <img src="/media/logo-transparent.png" alt="Landshop" width={150} height={63} decoding="async" fetchPriority="high" onError={event=>{event.currentTarget.src='/media/logo.webp'}}/>
   </Link>
   <nav className={'ls-primary-nav '+(menuOpen?'ls-nav-mobile-open':'')} aria-label="Site navigation">
    <Link className={'ls-header-link '+(pathname==='/'?'ls-nav-active':'')} href="/" onClick={()=>setMenuOpen(false)}><span>Home</span></Link>
    {groups.map(group=><div className={'ls-header-group '+(expanded===group.label?'ls-group-open':'')} key={group.label}>
     <button type="button" className={'ls-header-link ls-nav-toggle '+(group.items.some(item=>pathname===item.href)?'ls-nav-active':'')} onClick={()=>toggle(group.label)} aria-haspopup="true" aria-expanded={expanded===group.label} aria-controls="ls-site-mega">
      <span>{group.label}</span><SiteIcon name="chevron" size={19}/>
     </button>
     {menuOpen&&expanded===group.label&&<div className="ls-mobile-subnav">{group.items.map(item=><Link key={item.title} href={item.href}><IconChip name={item.icon}/><span><strong>{item.title}</strong><small>{item.description}</small></span><SiteIcon name="arrow" size={22}/></Link>)}</div>}
    </div>)}
    <Link href="/properties" className={'ls-header-link '+(pathname.startsWith('/properties')?'ls-nav-active':'')}>Properties</Link>
    <Link href="/insights" className={'ls-header-link '+(pathname.startsWith('/insights')?'ls-nav-active':'')}>Insights</Link>
    <Link href="/contact" className={'ls-header-link '+(pathname==='/contact'?'ls-nav-active':'')}>Contact</Link>
    <div className="ls-mobile-bottom"><a href={portal}><SiteIcon name="users" size={23}/>Customer / Realtor Account</a><a href="/contact"><SiteIcon name="help" size={23}/>Support</a></div>
   </nav>
   <div className="ls-header-actions"><a className="ls-start" href={portal}><span>Get Started</span><SiteIcon name="external" size={17}/></a>
    <button className="ls-menu-button" type="button" aria-expanded={menuOpen} aria-label={menuOpen?'Close navigation':'Open navigation'} onClick={()=>{setMenuOpen(x=>!x);setExpanded(null)}}>
     <SiteIcon name={menuOpen?'close':'menu'} size={28}/>
    </button>
   </div>
  </header>
  {activeGroup&&!menuOpen&&<section className="ls-mega" id="ls-site-mega" aria-label={activeGroup.label+' menu'}>
   <div className="ls-mega-top"><span>{activeGroup.eyebrow}</span><button type="button" onClick={()=>setExpanded(null)} aria-label="Close menu"><SiteIcon name="close" size={19}/></button></div>
   <div className="ls-mega-layout"><div className="ls-mega-list">{activeGroup.items.map(item=><Link key={item.title} className={(selected?.title===item.title?'ls-selected':'')} href={item.href} onMouseEnter={()=>setFocused(item.title)} onFocus={()=>setFocused(item.title)}><IconChip name={item.icon}/><span>{item.title}</span><SiteIcon name="arrow" size={19}/></Link>)}</div>
   <div className="ls-mega-detail"><span className="ls-mega-eyebrow">{activeGroup.label.toUpperCase()} / EXPLORE</span><h2>{selected?.title}</h2><p>{selected?.description}. {activeGroup.description}</p><div className="ls-mega-quicklinks">{activeGroup.items.filter(item=>item.title!==selected?.title).map(item=><Link key={item.title} href={item.href}>{item.title}<SiteIcon name="arrow" size={16}/></Link>)}</div><Link className="ls-mega-featured" href={selected?.href||'/applications'}>Explore {selected?.title}<SiteIcon name="arrow" size={18}/></Link></div>
   </div>
  </section>}
  </div>
 </div>;
}
