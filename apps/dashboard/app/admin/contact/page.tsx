import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
import ContactDecision from './ContactDecision';
export const dynamic='force-dynamic';
export const metadata={title:'Contact Enquiries | Landshop Command Center'};
export default async function ContactQueue({searchParams}:{searchParams:Promise<{department?:string}>}){
 const {db}=await requireLandshopStaff(['owner','executive','admin','operations','sales','marketing']);
 const requested=(await searchParams).department||'';
 const departments=['property','investment','mortgage','customer_care','marketing'];
 let query=db.from('contact_enquiries')
 .select('id,full_name,email,phone,topic,message,department,status,created_at,updated_at')
 .order('created_at',{ascending:false}).limit(150);
 if(departments.includes(requested))query=query.eq('department',requested);
 const {data,error}=await query;
 return <main style={{fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif',padding:'clamp(20px,5vw,60px)',minHeight:'100vh',background:'#f5faf6',color:'#144434'}}>
  <section style={{maxWidth:1210,margin:'auto'}}>
   <Link href="/admin" style={{color:'#0a8a65'}}>← Landshop Command Center</Link>
   <h1 style={{fontSize:'clamp(30px,4vw,45px)',margin:'14px 0 9px'}}>Customer Enquiry Queue</h1>
   <p style={{fontSize:14,color:'#687f70',lineHeight:1.7}}>Real submitted customer enquiries, routed by the chosen subject. Authorized staff can record processing decisions; any email notification remains subject to the configured delivery service.</p>
   <nav aria-label="Department filters" style={{display:'flex',gap:8,flexWrap:'wrap',margin:'23px 0'}}>
    <Link href="/admin/contact" style={{padding:'10px 13px',background:!requested?'#2ba47a':'#fff',color:!requested?'#fff':'#19644b',borderRadius:8}}>All departments</Link>
    {departments.map(d=><Link key={d} href={'/admin/contact?department='+d} style={{padding:'10px 13px',background:d===requested?'#2ba47a':'#fff',color:d===requested?'#fff':'#19644b',borderRadius:8,border:'1px solid #d9e8de'}}>{d.replaceAll('_',' ')}</Link>)}
   </nav>
   {error?<p role="alert">Contact queue unavailable. Check access permissions and migration status.</p>:!data?.length?<section style={{padding:26,background:'#fff',borderRadius:15}}>No enquiries in this category yet.</section>:
    <div style={{display:'grid',gap:15}}>{data.map(e=><article key={e.id} style={{background:'#fff',border:'1px solid #d7e9dd',borderRadius:15,padding:24}}>
     <div style={{display:'flex',justifyContent:'space-between',gap:20,flexWrap:'wrap'}}>
      <div style={{minWidth:0,maxWidth:750}}><small style={{color:'#e66e16',fontWeight:850}}>LS-C-{e.id.slice(0,8).toUpperCase()} · {e.department.replaceAll('_',' ')}</small>
       <h2 style={{margin:'9px 0 3px',fontSize:21}}>{e.topic}</h2>
       <strong style={{fontSize:14}}>{e.full_name}</strong> <p style={{fontSize:13,color:'#4f6d60'}}><a href={'mailto:'+e.email}>{e.email}</a>{e.phone&&' · '+e.phone}</p>
       <p style={{whiteSpace:'pre-wrap',fontSize:13,lineHeight:1.7}}>{e.message}</p></div>
      <div style={{minWidth:140}}><strong style={{color:'#0a8a6a',textTransform:'capitalize'}}>{e.status.replaceAll('_',' ')}</strong><p style={{fontSize:12,color:'#688172'}}>{new Date(e.created_at).toLocaleString('en-NG')}</p></div>
     </div>
     {e.status!=='closed'&&<ContactDecision id={e.id}/>}
    </article>)}</div>}
  </section>
 </main>;
}
