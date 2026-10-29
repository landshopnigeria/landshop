import Homepage,{type FeaturedProperty} from '../components/LandshopHome';
import {cleanFilters,listPublished,money} from '../lib/marketplace';
export const dynamic='force-dynamic';
export default async function Page(){
 const {rows}=await listPublished(cleanFilters({purpose:'Buy'}));
 const featured:FeaturedProperty[]=rows.slice(0,6).map(p=>({
  id:p.id,title:p.title,propertyType:p.property_type,
  location:[p.estates?.city,p.estates?.state].filter(Boolean).join(', ')||'Location on enquiry',
  price:money(p.amount_kobo)
 }));
 return <Homepage featured={featured}/>;
}
