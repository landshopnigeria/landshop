'use client';
import {useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import './customer-navigation.css';
function Icon({name}:{name:string}){
 const common={width:23,height:23,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true as const};
 switch(name){
 case 'home':return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg>;
 case 'users':return <svg {...common}><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 6a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5"/></svg>;
 case 'chart':return <svg {...common}><path d="M4 20V9m6 11V4m6 16v-8m4 8V7"/></svg>;
 case 'file':return <svg {...common}><path d="M7 3h8l4 4v14H5V3h2Zm7 0v5h5M8 13h8m-8 4h8"/></svg>;
 case 'wallet':return <svg {...common}><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 9V5a2 2 0 0 1 2-2h13m-1 10h4m-5 0h1"/></svg>;
 case 'support':return <svg {...common}><path d="M4 14v-3a8 8 0 0 1 16 0v3M4 14H2v5h4v-6H4Zm16 0h2v5h-4v-6h2ZM19 20a5 5 0 0 1-5 2h-2"/></svg>;
 case 'check':return <svg {...common}><path d="M12 22s9-4 9-11V5l-9-3-9 3v6c0 7 9 11 9 11Z"/><path d="m8 12 3 3 5-6"/></svg>;
 default:return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
 }
}

const links=[['Overview','/dashboard','home'],['Applications','/dashboard/applications','file'],['KYC','/dashboard/kyc','check'],['Properties','https://www.landshopnigeria.com/properties','search'],['Wallet','#referrals','wallet'],['Profile','/dashboard/account','users']];

export default function CustomerNavigation(){
 const [compact,setCompact]=useState(false),[open,setOpen]=useState(false);
 const pathname=usePathname();
 return <>
  <button type="button" className="cd-nav-mobile-toggle" aria-expanded={open} aria-label="Open customer navigation" onClick={()=>setOpen(v=>!v)}>☰ Menu</button>
  {open&&<button type="button" className="cd-nav-scrim" aria-label="Close customer navigation" onClick={()=>setOpen(false)}/>}
  <aside className={'dc-side cd-sidebar '+(compact?'cd-nav-compact ':'')+(open?'cd-nav-open':'')}>
   <div className="cd-nav-brand-row"><a className="dc-side-brand" href="https://www.landshopnigeria.com" aria-label="Landshop homepage"><img src="/media/logo.webp" alt="Landshop" width={128} height={60}/></a><button type="button" className="cd-nav-collapse" aria-label={compact?'Expand sidebar':'Collapse sidebar'} onClick={()=>setCompact(v=>!v)}>{compact?'»':'«'}</button></div>
   <nav aria-label="Customer dashboard">{links.map(([label,to,icon])=><Link key={label} title={label} href={to} className={pathname===to?'active':''} onClick={()=>setOpen(false)}><Icon name={icon}/>{!compact&&<span>{label}</span>}</Link>)}</nav>
   {!compact&&<div className="cd-side-help"><strong>Landshop Support</strong><p>Questions about your property journey?</p><a href="https://portal.landshopnigeria.com/support">Contact our team →</a></div>}
  </aside>
 </>;
}
