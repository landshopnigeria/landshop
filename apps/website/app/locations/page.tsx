import Link from 'next/link';
import ContentShell from '../../components/ContentShell';
import {editorialImages} from '../../lib/editorial-imagery';
import {landshopLocations} from '../../lib/v22-locations';
export const metadata={title:'Landshop Property Locations Across Nigeria',description:'Explore historical Landshop estate references across Lagos, Abuja, Ogun, Oyo, Delta, Edo, Akwa Ibom and Anambra.'};
export default function Locations(){return <ContentShell eyebrow="PROPERTY LOCATIONS" title="Find the location that suits your future." intro="Explore Nigerian property contexts and the original Landshop estate directory. Historical projects are not automatically current available listings." image={editorialImages.skyline.src} imageAlt={editorialImages.skyline.alt}>
 <div className="v22-root"><section className="v22-section"><div className="v22-container">
  <span className="v22-eyebrow">EXPLORE NIGERIA</span><h2>Eight destinations. Local property insights.</h2>
  <div className="v22-location-cards">{landshopLocations.map((l,i)=><Link key={l.slug} href={'/locations/'+l.slug} className="v22-location-card"><span>{String(i+1).padStart(2,'0')} / LOCATION</span><h3>{l.name}</h3><p>{l.intro}</p><b>{l.prime.length+l.luxury.length} historic estate references</b><em>Explore {l.name} ↗</em></Link>)}</div>
 </div></section><section className="v22-section v22-muted"><div className="v22-container v22-two"><div><span className="v22-eyebrow">CURRENT AVAILABILITY</span><h2>Published properties, not archival claims.</h2><p>Individual listing availability and pricing must be confirmed through the property marketplace. Historical estate names are useful for discovery but are not proof of a currently available unit.</p><Link className="v22-btn" href="/properties">Explore live properties ↗</Link></div><img className="v22-cover-photo" src={editorialImages.architecture.src} alt={editorialImages.architecture.alt}/></div></section></div>
 </ContentShell>}
