import '../properties/property-market.css';

import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import InsightsExplorer from '../../components/InsightsExplorer';
import {MarketFooter} from '../../components/MarketChrome';
export const metadata={title:'Insights & Property Guides | Landshop Nigeria',description:'Explore trusted property acquisition, mortgage and estate inspection guidance from Landshop.'};
export default function Insights(){
 return <main className="v16-editorial"><SiteHeader/>
  <section className="v16-editorial-hero"><span className="v16-overline">LANDSHOP INSIGHTS & EDUCATION</span><h1>Better property decisions start with better questions.</h1><p>Expertly structured guidance to help you understand documentation, financing, property inspections and the choices ahead. Informational only; project-specific terms require verification.</p></section>
  <InsightsExplorer/>
  <section className="v16-editorial-commit"><div><span className="v16-overline">THE NEXT STEP</span><h2>Move from reading to the right application.</h2><p>Develop, Incubate and Grow have distinct guided decision journeys.</p></div><Link href="/applications">Choose an application ↗</Link></section>
  <div className="mk-layout" style={{minHeight:'auto'}}><div className="mk-wrap"><MarketFooter/></div></div>
 </main>;
}
