'use client';
import {useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import './command-navigation.css';
type Props={links:string[][];isOwner:boolean};
export default function CommandSideNavigation({links,isOwner}:Props){
 const [compact,setCompact]=useState(false),[mobileOpen,setMobileOpen]=useState(false);
 const path=usePathname();
 return <>
  <button type="button" className="command-nav-mobile" aria-expanded={mobileOpen} aria-controls="command-enterprise-nav" onClick={()=>setMobileOpen(v=>!v)}>☰ <span>Command Center Menu</span></button>
  {mobileOpen&&<button type="button" className="command-nav-overlay" aria-label="Close Command Center menu" onClick={()=>setMobileOpen(false)}/>}
  <aside id="command-enterprise-nav" className={'command-side '+(compact?'is-collapsed ':'')+(mobileOpen?'is-mobile-open':'')}>
   <div className="command-brand"><img src="/media/logo.webp" alt="Landshop official logo" width={139} height={65}/>{!compact&&<small>GLOBAL COMMAND CENTER</small>}<button type="button" className="command-nav-collapse" aria-label={compact?'Expand sidebar':'Collapse sidebar'} aria-expanded={!compact} onClick={()=>setCompact(v=>!v)}>{compact?'»':'«'}</button></div>
   <nav aria-label="Global Command Center navigation">{links.map(([name,url,icon],i)=><Link title={name} href={url} className={path===url?'active':''} key={url+'-'+i} onClick={()=>setMobileOpen(false)}><span aria-hidden="true">{icon}</span>{!compact&&<span className="command-link-label">{name}</span>}</Link>)}</nav>
   {!compact&&<div className="command-side-note"><strong>{isOwner?'Landshop Owner · Authorized Management':'Landshop Enterprise'}</strong><p>Develop · Incubate · Grow</p><small>Role-based authorization and audit controls remain enforced.</small><Link href="/staff" className="command-staff-back">← Back to Staff Dashboard</Link></div>}
  </aside>
 </>;
}
