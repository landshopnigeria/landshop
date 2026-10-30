import type {ReactNode} from 'react';
const main='https://www.landshopnigeria.com';
const nav=[['Home','/'],['Products','/develop'],['Company','/about'],['Services','/services/property-acquisition'],['Properties','/properties'],['Insights','/insights'],['Contact','/contact']];
export function StaffAuthLogo(){return <a className="lsa-form-logo" href={main} aria-label="Landshop official website"><img src="/media/logo-transparent.png" alt="Landshop — Grow Invest Develop" width={164} height={82}/></a>}
export default function StaffAuthShell({children}:{children:ReactNode}){return <div className="lsa-root">
<header className="lsa-site-header">
<div className="lsa-top-strip"><div className="lsa-container lsa-top-inner"><strong>Everyone Deserves Affordable Property.</strong><nav aria-label="Account links" className="lsa-top-links"><a href="https://portal.landshopnigeria.com/">Account</a><a href="https://portal.landshopnigeria.com/">Realtor Portal</a><a href="https://app.landshopnigeria.com/admin">Command Center</a></nav></div></div>
<div className="lsa-nav-shell"><div className="lsa-container lsa-nav-inner"><a href={main} aria-label="Landshop homepage" className="lsa-nav-brand"><img src="/media/logo-transparent.png" alt="Landshop" width={116} height={56}/></a>
<nav aria-label="Website navigation" className="lsa-nav-items">{nav.map(([label,path])=><a key={label} href={main+path}>{label}</a>)}</nav>
<a className="lsa-nav-cta" href={main+'/applications'}>Get Started</a>
<details className="lsa-mobile-menu"><summary aria-label="Open website navigation">☰</summary><nav aria-label="Mobile website navigation">{nav.map(([label,path])=><a key={label} href={main+path}>{label}</a>)}<a href="https://portal.landshopnigeria.com/">Customer Account</a></nav></details></div></div></header>
<main className="lsa-main">{children}</main>
<footer className="lsa-footer"><div className="lsa-container lsa-footer-inner"><div><a href={main} className="lsa-footer-brand">Landshop</a> · Building Wealth Through Real Estate</div><nav className="lsa-footer-links" aria-label="Footer navigation"><a href={main+'/about'}>Company</a><a href={main+'/develop'}>Products</a><a href="https://portal.landshopnigeria.com/">Customer</a><a href={main+'/contact'}>Contact</a><a href="/staff/privacy">Privacy</a><span>© Landshop</span></nav><span className="lsa-mobile-copy">© Landshop</span></div></footer>
</div>}