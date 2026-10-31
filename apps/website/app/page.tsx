import Homepage,{type FeaturedProperty} from '../components/LandshopHome';
import {cleanFilters,listPublished,propertyPrice,propertyHref} from '../lib/marketplace';
import {loadPropertyMedia} from '../lib/property-showcase';
export const dynamic='force-dynamic';
export const metadata={
 title:'Landshop Nigeria | Everyone Deserves Affordable Property',
 description:'Explore Landshop Nigeria estates, Famous Gardens homes, Prime and Luxury selections and clear acquisition or home-financing pathways.',
 alternates:{canonical:'/'},
 openGraph:{title:'Landshop Nigeria | Everyone Deserves Affordable Property',url:'https://www.landshopnigeria.com/',
 description:'Explore Nigeria property estates, projects and homeownership solutions with Landshop.'}
};
export default async function Page(){
 const {rows}=await listPublished(cleanFilters({purpose:'Buy'}));
 const selected=rows.slice(0,3);
 const gallery=await loadPropertyMedia(selected.map(p=>p.id));
 const featured:FeaturedProperty[]=selected.map(p=>({
  id:p.id,href:propertyHref(p),title:p.title,propertyType:p.property_type,
  location:[p.estates?.city,p.estates?.state].filter(Boolean).join(', ')||'Location on enquiry',
  price:propertyPrice(p),collection:p.collection_verified_at?p.collection_type||undefined:undefined,
  image:gallery[p.id]?.find(m=>m.kind==='photo')?.src
 }));
 return <Homepage featured={featured}/>;
}
