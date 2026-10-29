import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
export const dynamic='force-dynamic';
export const metadata={title:'Support Cases | Landshop Command Center'};
export default async function SupportQueue(){
 const {db}=await requireLandshopStaff(['owner','admin','operations']);
 const {data,error}=await db.from('support_tickets')
  .select('id,subject,category,status,priority,created_at').order('created_at',{ascending:false}).limit(150);
 return <main style={{minHeight:'100vh',background:'#f3f8f4',color:'#113e34',padding:'clamp(22px,5vw,60px)',fontFamily:'Arial,sans-serif'}}>
  <section style={{maxWidth:1150,margin:'auto'}}><Link href="/admin" style={{color:'#07876c'}}>← Global Command Center</Link>
   <h1>Customer Support / Tickets</h1><p>Real support cases from the authenticated Landshop portal. Restricted to approved owner, administrator and operations roles.</p>
   {error?<p role="alert">Ticket records could not be loaded. Confirm the support migration and access policies.</p>:
    !data?.length?<div style={{background:'white',padding:25,borderRadius:15}}>No support cases are visible at present.</div>:
    <div style={{display:'grid',gap:12}}>{data.map(t=><article key={t.id} style={{background:'white',border:'1px solid #dbece2',borderRadius:15,padding:19,display:'flex',flexWrap:'wrap',gap:18,alignItems:'center',justifyContent:'space-between'}}>
     <div><strong>{t.subject}</strong><p style={{fontSize:12,color:'#6b8276'}}>Category: {t.category} · {new Date(t.created_at).toLocaleDateString('en-NG')}</p></div>
     <div><span style={{padding:'8px 12px',borderRadius:999,background:'#e8f6ee',fontSize:12}}>{t.status.replaceAll('_',' ')} / {t.priority}</span>
      <Link href={'/admin/support/'+t.id} style={{display:'inline-block',padding:'0 12px',color:'#07866b'}}>Open Case →</Link></div>
    </article>)}</div>}
  </section>
 </main>;
}