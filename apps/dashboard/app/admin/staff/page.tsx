import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
export const dynamic='force-dynamic';
export const metadata={title:'Staff Directory | Landshop'};
export default async function Staff(){
 const {db,organizationIds}=await requireLandshopStaff(['owner','admin','hr','operations']);
 const {data,error}=await db.from('organization_members').select('user_id,role,status,organization_id')
  .in('organization_id',organizationIds).eq('status','active').order('role',{ascending:true}).limit(150);
 return <main style={{minHeight:'100vh',background:'#f3f9f5',padding:'clamp(22px,5vw,64px)',color:'#123e33',fontFamily:'Arial,sans-serif'}}>
   <section style={{maxWidth:1050,margin:'auto'}}><Link href="/admin" style={{color:'#087d62'}}>← Global Command Center</Link>
    <h1>Staff & Role Directory</h1><p style={{maxWidth:780,lineHeight:1.65}}>Authorized company members and their assigned access roles. Sensitive personal employment records are managed separately; this view does not disclose employee identity documents.</p>
    {error?<p role="alert">Employee records are not available with your current permissions.</p>:
     !data?.length?<p>No active workforce memberships are visible.</p>:
      <div style={{display:'grid',gap:12}}>{data.map((item,i)=><article key={item.user_id+item.organization_id} style={{display:'flex',justifyContent:'space-between',gap:20,flexWrap:'wrap',background:'white',border:'1px solid #dbebdf',borderRadius:15,padding:18}}>
       <div><strong>Member {String(i+1).padStart(2,'0')}</strong><p style={{fontSize:12,color:'#668474',marginBottom:0}}>Internal ID · {item.user_id.slice(0,8)}…</p></div>
       <div style={{textTransform:'capitalize'}}><strong>{item.role.replaceAll('_',' ')}</strong><p style={{fontSize:12,color:'#087a63',marginBottom:0}}>{item.status}</p></div>
      </article>)}</div>}
    <p style={{fontSize:12,color:'#5e7968',marginTop:23}}>Membership and role changes require authorized administrative actions and audit logging. Changes cannot be made through this read-only directory.</p>
   </section></main>;
}