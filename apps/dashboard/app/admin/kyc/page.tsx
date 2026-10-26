import {redirect} from 'next/navigation';
import Link from 'next/link';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';

export const dynamic='force-dynamic';

export default async function KycQueue(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Landshop management authentication is not configured.</main>;
 const store=await cookies();
 const db=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{
   getAll(){return store.getAll()},
   setAll(changes){try{changes.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}
  }
 });
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:members,error:memberError}=await db.from('organization_members')
  .select('organization_id,role,status').eq('user_id',user.id).eq('status','active');
 if(memberError)return <main>Reviewer permission verification failed.</main>;
 const allowed=(members||[]).filter(m=>['owner','admin','legal','operations'].includes(m.role));
 if(!allowed.length)return <main style={{padding:40}}>Access denied. Landshop management authorization is required.</main>;
 const {data:orgs}=await db.from('organizations').select('id').eq('kind','landshop').in('id',allowed.map(m=>m.organization_id));
 if(!orgs?.length)return <main style={{padding:40}}>Access denied. No verified Landshop management membership.</main>;
 const {data:submissions,error:queueError}=await db.from('kyc_submissions')
  .select('id,kind,status,created_at,applicant_id')
  .in('status',['submitted','review'])
  .order('created_at',{ascending:true}).limit(100);
 return <main style={{fontFamily:'Arial,sans-serif',padding:'clamp(18px,5vw,60px)',background:'#f4faf6',minHeight:'100vh',color:'#073c32'}}>
  <a href="/dashboard">Landshop</a><h1>KYC Review Queue</h1>
  <p>Authorized Landshop staff view. Applications require document review and audited decisions before approval can be activated.</p>
  {queueError?<p role="alert">The KYC review queue is not available. Verify the database migration and access policies.</p>:
   !submissions?.length?<p>No submitted KYC applications are currently visible.</p>:
   <div style={{overflowX:'auto'}}><table style={{borderCollapse:'collapse',width:'100%',background:'white'}}>
    <thead><tr>{['Reference','Account type','Submitted','Status'].map(label=><th key={label} style={{padding:14,textAlign:'left',borderBottom:'1px solid #ddd'}}>{label}</th>)}</tr></thead>
    <tbody>{submissions.map(s=><tr key={s.id}>
      <td style={{padding:14,borderBottom:'1px solid #eee'}}><Link href={'/admin/kyc/'+s.id}>{s.id.substring(0,8)}… Review</Link></td>
      <td style={{padding:14,borderBottom:'1px solid #eee'}}>{s.kind}</td>
      <td style={{padding:14,borderBottom:'1px solid #eee'}}>{new Date(s.created_at).toLocaleDateString('en-NG')}</td>
      <td style={{padding:14,borderBottom:'1px solid #eee'}}>{s.status}</td>
    </tr>)}</tbody>
   </table></div>}
  <p style={{fontSize:13}}>Approval/rejection actions are disabled until authenticated document inspection, reviewer audit and transaction-safe status updates are implemented and verified.</p>
 </main>;
}
