import {requireLandshopStaff} from '../../../lib/admin-access';
import AllocationManager from './AllocationManager';
export const dynamic='force-dynamic';
export const metadata={title:'Land Survey & Plot Allocation | Landshop'};
export default async function Page(){const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);const [p,c,s]=await Promise.all([db.from('allocation_programmes').select('*').order('name'),db.from('allocation_cases').select('*').order('created_at',{ascending:false}).limit(500),db.from('allocation_sites').select('*').order('name')]);return <AllocationManager programmes={p.data||[]} initial={c.data||[]} initialSites={s.data||[]} error={Boolean(p.error||c.error||s.error)}/>}
