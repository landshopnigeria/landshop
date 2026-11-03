 'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {commandNavigation} from './navigation';
export default function CommandWorkspace({children,email}:{children:React.ReactNode;email:string}){
 const [compact,setCompact]=useState(false),[mobile,setMobile]=useState(false),[focus,setFocus]=useState(false),[search,setSearch]=useState(''),[open,setOpen]=useState(false);
 const path=usePathname(),router=useRouter(),input=useRef<HTMLInputElement>(null);
 const items=commandNavigation.flatMap(g=>g.items);const current=items.filter(x=>path===x[1]||(x[1]!=='/admin'&&path.startsWith(x[1]+'/'))).sort((a,b)=>b[1].length-a[1].length)[0];
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setOpen(true);input.current?.focus()}if(e.key==='Escape'){setOpen(false);setMobile(false)}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[]);
 useEffect(()=>{setMobile(false);setOpen(false)},[path]);
 useEffect(()=>{const listener=(e:Event)=>setFocus((e as CustomEvent).detail===true);window.addEventListener('landshop-canvas-focus',listener);return()=>window.removeEventListener('landshop-canvas-focus',listener)},[]);
 return <div className={'cc-workspace '+(compact?'cc-compact ':'')+(focus?'cc-focus ':'')+(mobile?'cc-mobile-open':'')}>
 {mobile&&<button className="cc-scrim" onClick={()=>setMobile(false)} aria-label="Close navigation"/>}
 <aside className="cc-sidebar"><Link href="/admin" className="cc-brand"><img src="/media/logo.webp" width="74" height="45" alt="Landshop"/><span>COMMAND CENTER<small>Enterprise workspace</small></span></Link>
 <div className="cc-company"><span className="cc-avatar">L</span><span>Landshop Nigeria<small>Global operations</small></span><button onClick={()=>setCompact(v=>!v)} aria-label={compact?'Expand sidebar':'Collapse sidebar'}>{compact?'»':'«'}</button></div>
 <nav aria-label="Command Center">{commandNavigation.map(g=><section key={g.group}><small className="cc-nav-group">{g.group}</small>{g.items.map(([name,href,icon])=><Link key={href} title={name} href={href} aria-current={current?.[1]===href?'page':undefined}><span className="cc-nav-icon" aria-hidden="true">{icon}</span><span className="cc-nav-label">{name}</span></Link>)}</section>)}</nav>
 <div className="cc-sidebar-foot"><Link href="/staff?workspace=personal">Personal staff workspace →</Link><small>Authenticated management</small></div></aside>
 <div className="cc-main"><header className="cc-topbar"><button className="cc-menu" onClick={()=>setMobile(v=>!v)} aria-label="Open navigation">☰</button><span className="cc-crumb">Workspace <span>/</span> <strong>{current?.[0]||'Record details'}</strong></span>
 <div className="cc-search"><input ref={input} aria-label="Search Command Center" placeholder="Search pages or customers…" value={search} onFocus={()=>setOpen(true)} onChange={e=>{setSearch(e.target.value);setOpen(true)}} onKeyDown={e=>{if(e.key==='Enter'&&search.trim()){router.push('/admin/users?search='+encodeURIComponent(search.trim()));setOpen(false)}}}/><kbd>⌘ K</kbd>
 {open&&<div className="cc-search-results"><button onClick={()=>setOpen(false)} aria-label="Close search">×</button>{items.filter(x=>!search||x[0].toLowerCase().includes(search.toLowerCase())).slice(0,8).map(x=><Link href={x[1]} key={x[1]} onClick={()=>setOpen(false)}>{x[0]} <span>→</span></Link>)}{search&&<Link href={'/admin/users?search='+encodeURIComponent(search)}>Search customer & staff records for “{search}” →</Link>}</div>}</div>
 <div className="cc-account"><span className="cc-live">● Connected workspace</span><Link href="/admin/audit" title="Activity & audit trail" aria-label="Activity and audit trail">◷</Link><Link href="/admin/users" className="cc-avatar" title={email}>{email.slice(0,2).toUpperCase()}</Link></div></header>
 {focus&&<button className="cc-exit-focus" onClick={()=>{setFocus(false);window.dispatchEvent(new CustomEvent('landshop-canvas-restore'))}}>↙ Exit full canvas</button>}
 <div className="cc-page" key={path}>{children}</div></div></div>
}
