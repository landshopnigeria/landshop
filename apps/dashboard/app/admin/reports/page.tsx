import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
export const dynamic='force-dynamic';
export const metadata={title:'Operational Reports | Landshop'};
export default async function Reports(){
 const {db}=await requireLandshopStaff(['owner','admin','executive','operations','legal','finance']);
 const categories=[['Property Inventory','properties'],['Applications','applications'],['KYC Submissions','kyc_submissions'],['Property Imports','property_import_batches'],['Allocation Cases','allocation_cases'],['Automation Runs','automation_runs']];
 const counts=await Promise.all(categories.map(async ([label,table])=>{
  const {count,error}=await db.from(table).select('*',{count:'exact',head:true});
  return {label,count:error?null:count};
 }));
 return <main style={{minHeight:'100vh',background:'#f3f8f5',color:'#113e34',padding:'clamp(22px,5vw,65px)',fontFamily:'Arial,sans-serif'}}>
  <section style={{maxWidth:1100,margin:'auto'}}><Link href="/admin" style={{color:'#078267'}}>← Global Command Center</Link>
   <h1 style={{fontSize:'clamp(30px,4vw,48px)'}}>Operational Reports</h1>
   <p style={{maxWidth:760,lineHeight:1.6}}>Database-backed operational record counts. A restricted or unavailable metric appears as unavailable rather than fabricated zero. Revenue, customer balances and profit are not displayed until a reconciled finance ledger exists.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16,marginTop:30}}>
    {counts.map(item=><article key={item.label} style={{background:'white',border:'1px solid #d6e9df',borderRadius:18,padding:23}}><small>{item.label}</small><h2 style={{fontSize:36,margin:'12px 0'}}>{item.count===null?'—':item.count.toLocaleString('en-NG')}</h2><span style={{fontSize:12,color:'#557a69'}}>{item.count===null?'Restricted or unavailable':'Records visible to your role'}</span></article>)}
   </div><p style={{fontSize:12,color:'#547566',marginTop:32}}>Scope: current authorized Landshop records. Date-based performance, cash collections and financial recognition require separately defined and reconciled source data.</p>
  </section>
 </main>;
}