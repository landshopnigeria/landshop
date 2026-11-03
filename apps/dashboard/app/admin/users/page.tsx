import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
import AccountDirectory from './AccountDirectory';
import ManagementAssignments from './ManagementAssignments';
export const dynamic='force-dynamic';
export const metadata={title:'Users & Customer Records | Landshop Command Center'};
export default async function Page(){
 const {db,user,organizationIds}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const {data:owner}=await db.from('organization_members').select('user_id').eq('user_id',user.id).eq('role','owner').eq('status','active').in('organization_id',organizationIds).limit(1).maybeSingle();
 return <main style={{padding:'clamp(18px,4vw,56px)',background:'#f4f8f6',minHeight:'100vh',color:'#073f34'}}>
  <div style={{maxWidth:1280,margin:'auto'}}><Link href="/admin">← Global Command Center</Link><h1>Users & Customer Records</h1>
  <p>Search registered management, staff and customers. Open submitted records, edit contact details and export the displayed page.</p><AccountDirectory/>{owner&&<ManagementAssignments/>}</div>
 </main>;
}
