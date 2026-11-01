import Link from 'next/link';
export const metadata={title:'Landshop Projects | Famous Gardens and Project Portfolio',description:'Explore the owner-provided photographic archives of Famous Gardens in Iberekodo, Ibeju-Lekki, and see Landshop past projects.'};
type Project={name:string;slug:string;kind:string;place:string;description:string;photo?:string;photoAlt?:string;photoNotice?:string};
const projects:Project[]=[
 {name:'Famous Gardens',slug:'famous-gardens',kind:'CURRENT SALES FOCUS',place:'Iberekodo, Ibeju-Lekki',description:'Explore actual photographs from the Famous Gardens development and request verified home specifications.',photo:'/owner/2026/famous-exterior.webp',photoAlt:'Finished estate buildings in the owner-provided Famous Gardens image archive'},
 {name:'Merit Park',slug:'merit-park',kind:'PAST PROJECT',place:'Location on enquiry',description:'Review available project records and request subscriber assistance.'},
 {name:'Green Island',slug:'green-island',kind:'PAST PROJECT',place:'Location on enquiry',description:'Explore the project story and request information on an existing subscription.'},
 {name:'Maiyegun Beach Estate',slug:'maiyegun-beach-estate',kind:'PAST PROJECT',place:'Location on enquiry',description:'Explore the historical project archive and contact customer support to verify your individual property or subscription.',photo:'/media/maiyegun0.webp',photoAlt:'Owner-provided archival photograph associated with Maiyegun Beach Estate project activity; not evidence of construction completion or available units',photoNotice:'Archived project activity · current status unverified'}
];
const scenes=[
 ['/owner/2026/garden-building-workers.webp','Construction work documented at Famous Gardens'],
 ['/owner/2026/estate-architecture.webp','Completed Nigerian residential buildings from the Landshop owner archive'],
 ['/owner/2026/famous-living.webp','Real photographed living room from the supplied property archive']
];
export default function Projects(){return <main className="ls26-page"><div className="ls26-container">
 <div className="ls26-intro"><span className="ls26-eyebrow">LANDSHOP PORTFOLIO</span><h1>Explore the places behind Landshop.</h1><p>See our current sales focus, explore past projects and tell us where you would like to own next.</p></div>
 <section className="ls26-section"><span className="ls26-eyebrow">OUR PROJECTS</span><div className="ls26-grid-three">{projects.map(p=><article key={p.slug} className="ls26-estate-card">
  <div className="ls26-estate-visual">{p.photo?<><img src={p.photo} alt={p.photoAlt||p.name} loading="lazy" decoding="async" className="ls-owner-project-image"/>{p.photoNotice&&<small className="ls-owner-archive-label">{p.photoNotice}</small>}</>:<span>{p.kind} · Project-specific photos awaiting verification</span>}</div>
  <div className="ls26-estate-content"><small className="ls26-eyebrow">{p.kind}</small><h3>{p.name}</h3><p>{p.place}</p><p>{p.description}</p><Link href={'/projects/'+p.slug}>View project →</Link></div></article>)}</div></section>
 <section className="ls26-section ls-owner-project-story"><span className="ls26-eyebrow">REAL LANDSHOP PHOTOGRAPHY</span><h2>From building sites to the spaces people call home.</h2>
  <p>These owner-supplied archival images document real construction, buildings and interiors. They are not proof of current unit availability or a promise that all homes have identical specifications.</p>
  <div className="ls-owner-project-gallery">{scenes.map(([src,caption])=><figure key={src}><img src={src} alt={caption} loading="lazy"/><figcaption>{caption}</figcaption></figure>)}</div>
 </section>
 <section className="ls26-section"><span className="ls26-eyebrow">WHAT COMES NEXT?</span><h2>Where would you own next?</h2><p>Share a preferred state for planned future opportunities. Interest does not reserve a property.</p><Link className="ls26-button" href="/coming-soon">Choose my state →</Link></section>
 </div></main>}
