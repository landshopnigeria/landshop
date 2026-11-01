import ApprovedArrow from '../../../components/ApprovedArrow';
import Link from 'next/link';import {notFound} from 'next/navigation';
import {cleanFilters,listPublished,propertyHref,propertyPrice} from '../../../lib/marketplace';
import {loadPropertyMedia} from '../../../lib/property-showcase';
import LandshopVideo from '../../../components/LandshopVideo';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{tier:string}>}){const {tier}=await params;return {title:(tier==='luxury'?'Luxury':'Prime')+' Estates | Landshop Nigeria',description:'Explore Landshop '+(tier==='luxury'?'Luxury':'Prime')+' estate listings with approved property photographs, current locations and verified details.',alternates:{canonical:'/collections/'+tier}};}
export default async function Collection({params}:{params:Promise<{tier:string}>}){const {tier}=await params;if(!['prime','luxury'].includes(tier))notFound();const name=tier==='prime'?'Prime':'Luxury';const {rows}=await listPublished(cleanFilters({purpose:'Buy',collection:name}));const gallery=await loadPropertyMedia(rows.map(p=>p.id));return <main className="ls26-page"><div className="ls26-container"><nav className="ls26-crumb"><Link href="/">Home</Link> / <Link href="/estates">Estates</Link> / {name}</nav><div className="ls26-intro"><span className="ls26-eyebrow">LANDSHOP ESTATE COLLECTION</span><h1>{name} Estates.</h1><p>{name==='Prime'?'Explore considered property selections in locations that fit your plans.':'Discover distinctive estates with additional amenities and premium design where verified.'} Only approved classification and original listing information are shown.</p></div>
 <section className="ls29-collection-hero" aria-label={name+' estates editorial photography'}>
  <img src={tier==='prime'?'/editorial/2026/modern-duplex.jpg':'/editorial/2026/ikate-exterior.jpg'}
       alt={tier==='prime'?'Modern residential duplex, illustrative Prime editorial reference':'Modern detached duplex, illustrative Luxury editorial reference'} />
  <div className="ls29-collection-hero-info"><img src="/media/logo.webp" alt="Landshop" />
   <strong>{name} Estates</strong><span>Property possibilities, thoughtfully presented.</span>
   <small>Editorial reference photography · View individual listings for verified current photos</small>
  </div>
 </section>
 {tier==='prime'&&<section className="ls26-section ls27-collection-film" aria-labelledby="ls27-prime-collection-film">
  <div className="ls27-film-layout">
   <div><span className="ls26-eyebrow">LANDSHOP PRIME</span><h2 id="ls27-prime-collection-film">Explore <span className="ls26-heading-green">Prime Estates</span> in motion<span className="v22-accent">.</span></h2>
   <p>See the Landshop Prime presentation in a full landscape player. For individual estates, check current listings, verified media, specifications and pricing before enquiry.</p></div>
   <LandshopVideo video="prime"/>
  </div>
 </section>}
 <section className="ls26-section"><div className="ls26-grid-three">{rows.length?rows.map(p=>{const photo=gallery[p.id]?.find(m=>m.kind==='photo')?.src;return <article className="ls26-estate-card" key={p.id}><div className="ls26-estate-visual">{photo?<img src={photo} alt={'Approved estate photo of '+p.title}/>:<span>ACTUAL ESTATE PHOTO PENDING</span>}</div><div className="ls26-estate-content"><span className="ls26-collection-badge">{name}</span><h3>{p.title}</h3><p>{[p.estates?.city,p.estates?.state].filter(Boolean).join(', ')}</p><strong>{propertyPrice(p)}</strong><p><Link href={propertyHref(p)}>View Estate <ApprovedArrow /></Link></p></div></article>}):<article className="ls26-aside"><h2>Verified {name.toLowerCase()} listings are being updated.</h2><p>Ask our team for current estate options. We will not label an estate {name} without an approved record.</p><Link className="ls26-button" href={'/contact?topic=Property%20Acquisition'}>Request current options <ApprovedArrow /></Link></article>}</div></section></div></main>}
