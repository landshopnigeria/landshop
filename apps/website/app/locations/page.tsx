import LocationDiscovery from '../../components/LocationDiscovery';
import {cleanFilters,type Params} from '../../lib/marketplace';
import './location-discovery.css';

export const metadata={
 title:'Find Property by Location | Landshop Nigeria',
 description:'Filter verified Landshop listings by Nigerian state, property type, price and more, then open the right financial planning calculator.',
 alternates:{canonical:'/locations'}
};
type Search=Params&{goal?:string};
export default async function Locations({searchParams}:{searchParams:Promise<Search>}){
 const raw=await searchParams;
 const filters=cleanFilters(raw||{});
 const initialGoal=['investment','mortgage','loan'].includes(raw?.goal||'')?raw.goal as 'investment'|'mortgage'|'loan':'browse';
 return <LocationDiscovery initial={filters} initialGoal={initialGoal}/>;
}
