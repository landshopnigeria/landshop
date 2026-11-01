import Link from 'next/link';
import {notFound} from 'next/navigation';
const past={
 'merit-park':{name:'Merit Park',story:'Take a look at Merit Park through project videos and updates. For questions about an existing subscription, our customer team can help you find the right next step.'},
 'green-island':{name:'Green Island',story:'Watch the available Green Island project videos and updates. Existing subscribers can contact the customer team for information about their own next step.'},
 'maiyegun-beach-estate':{name:'Maiyegun Beach Estate',story:'See Maiyegun Beach Estate through its project history and verified updates. Existing subscribers can contact Landshop about individual enquiries.'}
} as const;
/** Only evidence-backed project associations belong here.
 * Other historical projects deliberately have no photograph until matched.
 */
const historicalMedia:Record<string,{src:string;alt:string;caption:string}>={
 'maiyegun-beach-estate':{
   src:'/media/maiyegun0.webp',
   alt:'Owner-provided Maiyegun Beach Estate project archive depicting historical site or event activity, not verified construction progress or an available home',
   caption:'Archival photograph from Landshop’s Maiyegun project materials. The photo does not establish completion, allocation, present condition or availability.'
 }
};
const houseArchive:Record<string,string>={
 '2-bedroom-terrace':'/owner/2026/famous-completed-homes.webp',
 '3-bedroom-apartment':'/owner/2026/famous-exterior.webp',
 '3-bedroom-terrace':'/owner/2026/estate-residential.webp'
};
const siteGallery=[
 ['/owner/2026/famous-exterior.webp','Real completed estate façades'],
 ['/owner/2026/famous-gate.webp','Famous Gardens estate entrance'],
 ['/owner/2026/famous-bedroom.webp','Interior bedroom from the owner property archive'],
 ['/owner/2026/famous-living.webp','Interior living room from the owner property archive'],
 ['/owner/2026/garden-construction.webp','Documented construction activity'],
 ['/owner/2026/garden-site-team.webp','Landshop-branded site team and workers']
];
const homes=[['2-bedroom-terrace','2-bedroom terrace','₦80 million','₦16 million'],['3-bedroom-apartment','3-bedroom apartment','₦90 million','₦18 million'],['3-bedroom-terrace','3-bedroom terrace','₦125 million','₦25 million']];
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const name=slug==='famous-gardens'?'Famous Gardens':past[slug as keyof typeof past]?.name;return {title:name?name+' | Landshop project portfolio':'Project not found',description:name?'Explore '+name+' through Landshop’s official portfolio, available project information and verified updates.':'Landshop project information.',alternates:name?{canonical:'/projects/'+slug}:undefined};}
export default async function Project({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=past[slug as keyof typeof past];if(!p&&slug!=='famous-gardens')notFound();
 if(slug==='famous-gardens')return <main className="ls26-page"><div className="ls26-container"><nav className="ls26-crumb"><Link href="/">Home</Link> / <Link href="/projects">Projects</Link> / Famous Gardens</nav>
 <section className="ls26-plan-hero"><div><span className="ls26-eyebrow">FAMOUS GARDENS · IBEREKODO, IBEJU-LEKKI</span><h1>A home for the future you are planning.</h1><p className="ls26-lead">Discover Famous Gardens in Iberekodo, Ibeju-Lekki. Explore the home, understand the location and choose your next step.</p><div className="ls26-hero-actions"><Link className="ls26-button" href="#homes">Explore the homes →</Link><Link className="ls26-outline" href="/visit?project=famous-gardens">Request a tour →</Link></div></div><div className="ls26-hero-photo ls-owner-fg-hero"><img src="/owner/2026/famous-exterior.webp" alt="Owner-provided photographic archive showing Famous Gardens residential buildings" loading="eager"/><span className="ls26-photo-number">FG.</span><div><span>PROJECT MEDIA</span><strong>Famous Gardens</strong><small>Real Famous Gardens photographs from the owner archive. Verify the date and exact unit before purchasing.</small></div></div></section>
 <section className="ls26-section" id="homes"><span className="ls26-eyebrow">SELECT YOUR HOME</span><h2>Find your fit.</h2><p>Selected qualifying homes currently carry a ₦5 million promotional reduction through 23 January 2027, subject to eligibility and availability.</p><div className="ls26-grid-three">{homes.map(([id,name,price,equity])=><article className="ls26-estate-card" key={id}><div className="ls26-estate-visual ls-owner-fg-unit-visual"><img src={houseArchive[id]} alt={'Project-level Famous Gardens archival photograph for context, not verified as the exact '+name+' unit'} loading="lazy"/><small>Project archive · verify exact unit</small></div><div className="ls26-estate-content"><h3>{name}</h3><p>Promotional price: {price}</p><p>20% equity: {equity}. Mortgage, remaining balance, rent and other charges are separate.</p><Link href={'/homes/famous-gardens/'+id}>Explore this home →</Link></div></article>)}</div></section>
 <section className="ls26-section ls-owner-fg-gallery-section" aria-labelledby="ls-owner-fg-gallery-title"><span className="ls26-eyebrow">FAMOUS GARDENS · REAL PHOTOGRAPHY</span><h2 id="ls-owner-fg-gallery-title">See the place, people and progress.</h2>
 <p>These are owner-supplied documentary and project photographs, not generated illustrations. Construction-stage images come from the historical archive; specific unit readiness, delivery dates and allocation must be verified separately.</p>
 <div className="ls-owner-project-gallery">{siteGallery.map(([src,caption])=><figure key={src}><img src={src} alt={caption} loading="lazy" decoding="async"/><figcaption>{caption}</figcaption></figure>)}</div>
 </section>
 <section className="ls26-section"><h2>Understand the whole plan.</h2><p>Check the current stage, permitted use, title information, specifications and full written payment terms before you decide. No online enquiry reserves a unit.</p><div className="ls26-hero-actions"><Link href="/offers/plot-your-future" className="ls26-button">Explore the offer →</Link><Link href="/mortgage-review" className="ls26-outline">Review payment options →</Link></div></section></div></main>;
 const historical=historicalMedia[slug];
 return <main className="ls26-page"><div className="ls26-container"><nav className="ls26-crumb"><Link href="/">Home</Link> / <Link href="/projects">Projects</Link> / {p.name}</nav><div className="ls26-intro"><span className="ls26-eyebrow">PAST PROJECT · PROJECT STATUS ON ENQUIRY</span><h1>Explore {p.name}.</h1><p>{p.story}</p></div>
 {historical&&<section className="ls26-section ls-owner-historical-media" aria-label="Historical project photograph">
  <span className="ls26-eyebrow">ORIGINAL LANDSHOP PROJECT ARCHIVE</span>
  <h2>A photograph from the project record.</h2>
  <p>Historical evidence belongs to the project's story, but cannot confirm today's construction status or ownership. For a specific plot, subscription or allocation, please request current verified records from Landshop.</p>
  <figure><img src={historical.src} alt={historical.alt} loading="lazy" decoding="async"/><figcaption>{historical.caption}</figcaption></figure>
 </section>}
 <section className="ls26-section"><h2>Watch the project story.</h2><p>Dated project videos, availability, allocation and construction status will appear when verified. Historical sales status does not confirm completion or handover.</p><div className="ls26-hero-actions"><Link className="ls26-button" href={'/contact?topic=Customer%20Support&project='+slug}>Get support for {p.name} →</Link><Link className="ls26-outline" href="/coming-soon">Explore future opportunities →</Link></div></section></div></main>;
}
