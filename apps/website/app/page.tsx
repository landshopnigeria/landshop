import Homepage,{type FeaturedProperty} from '../components/LandshopHome';
import {cleanFilters,listPublished,money} from '../lib/marketplace';
import {loadPropertyMedia} from '../lib/property-showcase';
export const dynamic='force-dynamic';
export default async function Page(){
 const {rows}=await listPublished(cleanFilters({purpose:'Buy'}));
 const selected=rows.slice(0,3);
 const gallery=await loadPropertyMedia(selected.map(p=>p.id));
 const featured:FeaturedProperty[]=selected.map(p=>({
  id:p.id,title:p.title,propertyType:p.property_type,
  location:[p.estates?.city,p.estates?.state].filter(Boolean).join(', ')||'Location on enquiry',
  price:money(p.amount_kobo),
  image:gallery[p.id]?.find(m=>m.kind==='photo')?.src
 }));
 return <Homepage featured={featured}/>;
}
