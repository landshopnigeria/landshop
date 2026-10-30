
import Link from 'next/link';
import SiteFooter from './SiteFooter';
export function MarketHeader(){return null}
export function MarketFooter({includeUpdates=true}:{includeUpdates?:boolean}={}){return <>{includeUpdates&&<section className="mk-newsletter"><div><span>LANDSHOP UPDATES</span><h2>Move forward with better property information.</h2><p>Ask for documented opportunities and property news. We never subscribe you without your consent.</p></div><Link className="mk-btn" href="/contact?topic=Property%20Updates#enquiry">Request Updates ↗</Link></section>}<SiteFooter/></>}
