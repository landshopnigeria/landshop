import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
export const dynamic='force-dynamic';
export const metadata={title:'Staff Directory | Landshop'};
export default async function Staff(){
 const {db,organizationIds}=await requireLandshopStaff(['owner','admin','hr','operations']);
 const {data,error}=await db.from('organization_members').select('user_id,role,status,organization_id')
  .in('organization_id',organizationIds).eq('status','active').order('role',{ascending:true}).limit(150);
 const {data:details}=await db.from('landshop_staff_profiles').select('user_id,username,staff_number,requested_role,kyc_state,employment_state').limit(500);
 const names=new Map((details||[]).map(x=>[x.user_id,x] as const));
 return <main style={{minHeight:'100vh',background:'#f3f9f5',padding:'clamp(22px,5vw,64px)',color:'#123e33',fontFamily:'Arial,sans-serif'}}>
   <section style={{maxWidth:1050,margin:'auto'}}><Link href="/admin" style={{color:'#087d62'}}>← Global Command Center</Link>
    <h1>Staff & Role Directory</h1><p><Link href="/admin/workforce" style={{color:'#087d62',fontWeight:850}}>Open Workforce Command Center: KYC, roles, attendance and tasks →</Link></p><p style={{maxWidth:780,lineHeight:1.65}}>Authorized company members and their assigned access roles. Sensitive personal employment records are managed separately; this view does not disclose employee identity documents.</p>
    {error?<p role="alert">Employee records are not available with your current permissions.</p>:
     !data?.length?<p>No active workforce memberships are visible.</p>:
      <div style={{display:'grid',gap:12}}>{data.map((item,i)=><article key={item.user_id+item.organization_id} style={{display:'flex',justifyContent:'space-between',gap:20,flexWrap:'wrap',background:'white',border:'1px solid #dbebdf',borderRadius:15,padding:18}}>
       <div><strong>{names.get(item.user_id)?.username||'Owner / Member '+String(i+1).padStart(2,'0')}</strong><p style={{fontSize:12,color:'#668474',marginBottom:0}}>Employee ID · {names.get(item.user_id)?.staff_number||'Pending identity verification'}</p><p style={{fontSize:12}}>KYC: {names.get(item.user_id)?.kyc_state||'Not submitted'}</p></div>
       <div style={{textTransform:'capitalize'}}><strong>{item.role.replaceAll('_',' ')}</strong><p style={{fontSize:12,color:'#087a63',marginBottom:0}}>{item.status}</p></div>
      </article>)}</div>}
    <p style={{fontSize:12,color:'#5e7968',marginTop:23}}>Membership and role changes require authorized administrative actions and audit logging. Changes cannot be made through this read-only directory.</p>
   </section></main>;
}