import Link from 'next/link';
import {notFound} from 'next/navigation';
const units={
 '2-bedroom-terrace':{name:'2-bedroom terrace',price:80,reference:85,equity:16,gap:14},
 '3-bedroom-apartment':{name:'3-bedroom apartment',price:90,reference:95,equity:18,gap:22},
 '3-bedroom-terrace':{name:'3-bedroom terrace',price:125,reference:130,equity:25,gap:50}
} as const;
const archiveContext:Record<string,{src:string;alt:string}>={
 '2-bedroom-terrace':{src:'/owner/2026/famous-completed-homes.webp',alt:'Famous Gardens project-wide completed housing photograph, not verified as the selected two-bedroom unit'},
 '3-bedroom-apartment':{src:'/owner/2026/famous-exterior.webp',alt:'Project-level Famous Gardens estate photograph, not verified as the selected apartment'},
 '3-bedroom-terrace':{src:'/owner/2026/estate-residential.webp',alt:'Nigerian estate architectural photo from the Landshop owner archive; exact selected terrace unverified'}
};
export async function generateMetadata({params}:{params:Promise<{unitType:string}>}){const {unitType}=await params;const item=units[unitType as keyof typeof units];return {title:item?item.name+' at Famous Gardens | Landshop':'Home not found'};}
export default async function Home({params}:{params:Promise<{unitType:string}>}){const {unitType}=await params;const v=units[unitType as keyof typeof units];if(!v)notFound();return <main className="ls26-page"><div className="ls26-container"><nav className="ls26-crumb"><Link href="/">Home</Link> / <Link href="/projects/famous-gardens">Famous Gardens</Link> / {v.name}</nav><section className="ls26-plan-hero"><div><span className="ls26-eyebrow">FAMOUS GARDENS · IBEREKODO, IBEJU-LEKKI</span><h1>Explore the {v.name}.</h1><p className="ls26-lead">See the home, check its current stage and understand what ownership would involve.</p><div className="ls26-hero-actions"><Link className="ls26-button" href={'/visit?home='+unitType}>Book a viewing →</Link><Link className="ls26-outline" href={'/contact?topic=Property%20Acquisition&home='+unitType}>Request specifications →</Link></div></div><div className="ls26-hero-photo ls-owner-fg-hero"><img src={archiveContext[unitType].src} alt={archiveContext[unitType].alt} loading="eager"/><span className="ls26-photo-number">FG</span><div><span>REAL PROJECT ARCHIVE · EXACT UNIT NOT VERIFIED</span><strong>{v.name}</strong><small>The image gives project context only; request an inspection and images of your exact unit before committing.</small></div></div></section>
 <section className="ls26-section ls-owner-fg-gallery-section"><span className="ls26-eyebrow">PROJECT ARCHIVE · INTERIOR REFERENCES</span><h2>See real rooms, then verify the selected unit.</h2><p>These genuine owner-provided property photographs show completed residential interiors. They have not been authenticated as photographs of the particular unit offered on this page, and no floor area, finish or availability is implied.</p>
  <div className="ls-owner-project-gallery">
   {[
    ['/owner/2026/famous-bedroom.webp','Bedroom from the Famous Gardens owner archive'],
    ['/owner/2026/famous-living.webp','Finished sitting room in the property archive'],
    ['/owner/2026/famous-kitchen.webp','Fitted kitchen from the owner-provided photography']
   ].map(([src,caption])=><figure key={src}><img src={src} alt={caption} loading="lazy" decoding="async"/><figcaption>{caption} · verify exact-unit specifications</figcaption></figure>)}
  </div>
 </section>
 <section className="ls26-two"><div className="ls26-prose"><span className="ls26-eyebrow">PURCHASE PLAN</span><h2>Your plan at a glance.</h2><p>Selected units only. Promotion valid from 26 October 2026 to 23 January 2027, while qualifying units remain available.</p><div className="ls26-steps"><article><span>01</span><p>Promotional price: ₦{v.price} million (reference ₦{v.reference} million).</p></article><article><span>02</span><p>20% equity: ₦{v.equity} million.</p></article><article><span>03</span><p>Illustrative additional balance: ₦{v.gap} million after an approved ₦50 million loan.</p></article></div><p>The additional balance may be payable over 12 months at 9% under written terms. A smaller mortgage creates a larger balance. Applicable rent and other charges are separate. Loan approval and occupation are not guaranteed.</p></div><div className="ls26-aside"><span>KNOW THE HOME</span><h3>Request verified specifications.</h3><p>Floor area, bathrooms, included finishes, title information, current stage and delivery terms must be confirmed for the exact unit before commitment.</p><Link href={'/contact?topic=Property%20Acquisition&home='+unitType} className="ls26-button">Ask about this home →</Link></div></section></div></main>}
