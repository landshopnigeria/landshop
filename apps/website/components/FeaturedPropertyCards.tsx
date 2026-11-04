import Link from 'next/link';
import ApprovedArrow from './ApprovedArrow';
import {estatePortfolio} from '../lib/estate-portfolio';
import type {FeaturedProperty} from './LandshopHome';
const archiveHomes=estatePortfolio.map(e=>({title:e.name,kind:'ESTATE PORTFOLIO',note:e.summary,image:e.images[0].src,url:'/properties/'+e.slug}));
export default function FeaturedPropertyCards({featured}:{featured:FeaturedProperty[]}){
 return <div className="lsap-estate-grid">{featured.length?featured.slice(0,3).map((p,i)=><Link className="lsap-estate-card" href={p.href} key={p.id}>
    <div className="lsap-estate-photo">{p.image?<img src={p.image} alt={'Approved photo of '+p.title} loading="lazy"/>:<div className="lsap-estate-photo-pending">Original unit photo pending approval</div>}<small>PUBLISHED / {String(i+1).padStart(2,'0')}</small></div><div className="lsap-estate-body"><p>{p.propertyType} / {p.location}</p><h3>{p.title}</h3><p>{p.price}</p><strong>View Property <ApprovedArrow/></strong></div>
   </Link>):archiveHomes.map((item,i)=><Link className="lsap-estate-card" href={item.url} key={item.title}>
    <div className="lsap-estate-photo"><img src={item.image} alt={item.note} loading="lazy"/><small>{item.kind}</small></div><div className="lsap-estate-body"><p>FAMOUS GARDENS / IBEJU-LEKKI</p><h3>{item.title}</h3><p>{item.note}</p><strong>Explore Estate Archive <ApprovedArrow/></strong></div>
   </Link>)}</div>;
}
