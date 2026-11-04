'use client';
import {useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import './customer-navigation.css';
import SecureSignOut from './account/SecureSignOut';
type Item={label:string;href:string;icon:string};
const groups:{title:string;items:Item[]}[]=[
 {title:'My Properties',items:[{label:'My Investments',href:'/dashboard#investor-portfolio',icon:'chart'},{label:'My Properties',href:'/dashboard#investor-portfolio',icon:'house'},{label:'My Applications',href:'/dashboard/applications',icon:'file'},{label:'Payment History',href:'/dashboard#payment-timeline',icon:'wallet'}]},
 {title:'My Network',items:[{label:'My Referrals',href:'/dashboard#referrals',icon:'users'},{label:'My Network',href:'/dashboard#referrals',icon:'network'},{label:'My Earnings',href:'/dashboard#referrals',icon:'wallet'}]},
 {title:'My Services',items:[{label:'Inspections',href:'https://www.landshopnigeria.com/visit',icon:'calendar'},{label:'Mortgage Calculator',href:'/dashboard#mortgage-calculator',icon:'chart'},{label:'Browse Properties',href:'https://www.landshopnigeria.com/properties',icon:'house'}]},
 {title:'My Account',items:[{label:'My Profile',href:'/dashboard/account',icon:'user'},{label:'Verification',href:'/dashboard/kyc',icon:'shield'},{label:'Support',href:'https://portal.landshopnigeria.com/support',icon:'help'}]}
];
function Icon({name}:{name:string}){const paths:Record<string,string>={home:'m3 10 9-7 9 7v10H3z M9 21v-7h6v7',house:'m3 10 9-7 9 7v10H3z',chart:'M4 20V9m6 11V4m6 16v-8m4 8V7',file:'M7 3h8l4 4v14H5V3h2Zm7 0v5h5M8 13h8m-8 4h8',wallet:'M3 7h18v14H3z M3 10V4h16m-2 10h4',users:'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-3a7 7 0 0 1 14 0v3M18 7a4 4 0 0 1 0 8m0 2a5 5 0 0 1 4 4',network:'M5 5h14v14H5z M5 12h14M12 5v14',calendar:'M3 5h18v16H3z M7 3v5m10-5v5M3 11h18',user:'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM3 22v-2a9 9 0 0 1 18 0v2',shield:'M12 22s9-4 9-11V5l-9-3-9 3v6c0 7 9 11 9 11Z',help:'M4 14v-3a8 8 0 0 1 16 0v3M4 14H2v5h4v-6H4Zm16 0h2v5h-4v-6h2'};return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]||paths.home}/></svg>}
export default function CustomerNavigation(){
 const [compact,setCompact]=useState(false),[open,setOpen]=useState(false),[expanded,setExpanded]=useState<string|null>('My Properties');
 const pathname=usePathname();
 const close=()=>setOpen(false);
 return <>
  <button type="button" className="cd-nav-mobile-toggle" aria-expanded={open} aria-label="Open customer navigation" onClick={()=>setOpen(v=>!v)}>☰ Menu</button>
  {open&&<button type="button" className="cd-nav-scrim" aria-label="Close customer navigation" onClick={close}/>}
  <aside className={'dc-side cd-sidebar '+(compact?'cd-nav-compact ':'')+(open?'cd-nav-open':'')}>
   <div className="cd-nav-brand-row"><Link className="dc-side-brand" href="/dashboard" onClick={close} aria-label="Customer dashboard"><img src="/media/logo-transparent.png" alt="Landshop" width={128} height={60}/></Link><button type="button" className="cd-nav-collapse" aria-label={compact?'Expand sidebar':'Collapse sidebar'} onClick={()=>setCompact(v=>!v)}>{compact?'»':'«'}</button></div>
   <nav aria-label="Customer dashboard">
    <Link href="/dashboard" title="Overview" className={pathname==='/dashboard'?'active':''} onClick={close}><Icon name="home"/>{!compact&&<span>Overview</span>}</Link>
    {groups.map(g=><div className="cd-nav-group" key={g.title}>
      <button type="button" className="cd-nav-group-trigger" aria-expanded={expanded===g.title} aria-label={g.title} onClick={()=>{setExpanded(expanded===g.title?null:g.title);if(compact)setCompact(false)}}><span>{g.title}</span><span aria-hidden="true">{expanded===g.title?'⌃':'⌄'}</span></button>
      {expanded===g.title&&<div className="cd-nav-group-items">{g.items.map(item=><Link key={item.label} href={item.href} title={item.label} className={pathname===item.href?'active':''} onClick={close}><Icon name={item.icon}/>{!compact&&<span>{item.label}</span>}</Link>)}</div>}
     </div>)}
   </nav>
   {!compact&&<div className="cd-side-help"><strong>Landshop Support</strong><p>Need help with your property journey?</p><a href="https://portal.landshopnigeria.com/support">Contact our team</a></div>}
  </aside>
 </>;
}

export function CustomerAccountMenu({initial}:{initial:string}){
 const [open,setOpen]=useState(false);
 return <div className="cd-account-menu"><button type="button" className="cd-avatar" aria-expanded={open} aria-label="Open customer profile menu" onClick={()=>setOpen(v=>!v)}>{initial}</button>
 {open&&<div className="cd-account-dropdown" role="menu"><Link href="/dashboard/account" onClick={()=>setOpen(false)} role="menuitem">My Profile</Link><Link href="/dashboard/kyc" onClick={()=>setOpen(false)} role="menuitem">Verification & Settings</Link><SecureSignOut/></div>}</div>;
}
