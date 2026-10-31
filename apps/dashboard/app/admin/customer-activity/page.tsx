import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
import ExportRecords from '../reports/ExportRecords';
export const dynamic='force-dynamic';
export const metadata={title:'Customer Activity | Landshop Global Command Center'};
type Activity={activity_type:string;record_id:string;customer_id:string|null;stage:string;happened_at:string};
const names:Record<string,string>={application:'Application',kyc_submission:'KYC Submission',support_ticket:'Support Ticket',website_enquiry:'Website Enquiry'};
const targets:Record<string,string>={application:'/admin/applications',kyc_submission:'/admin/kyc',support_ticket:'/admin/support',website_enquiry:'/admin/enquiries'};
export default async function CustomerActivity(){
 const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const {data,error}=await db.rpc('landshop_management_customer_activity',{p_limit:250});
 const rows=(data||[]) as Activity[];
 const counts=rows.reduce<Record<string,number>>((totals,item)=>({...totals,[item.activity_type]:(totals[item.activity_type]||0)+1}),{});
 return <main style={{minHeight:'100vh',background:'#f3f8f5',color:'#173e31',padding:'clamp(18px,5vw,64px)'}}>
  <div style={{maxWidth:1180,margin:'auto'}}>
   <Link href="/admin" style={{color:'#138662'}}>← Global Command Center</Link>
   <p style={{fontSize:12,fontWeight:800,color:'#e66d13',letterSpacing:1,marginTop:22}}>CUSTOMER OPERATIONS</p>
   <h1 style={{fontSize:'clamp(28px,4vw,44px)',margin:'8px 0'}}>Customer Activity Monitor</h1>
   <p style={{lineHeight:1.7,maxWidth:850}}>A permission-checked operational feed of recorded applications, KYC submissions, support tickets and website enquiries. It displays only the status and reference of each record, not private identity documents or form answers.</p>
   {error?<p role="alert" style={{padding:17,background:'#fff1eb',borderRadius:12}}>Customer activity is unavailable: {error.message}</p>:<>
    <section aria-label="Activity by type" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14,margin:'24px 0'}}>
     {Object.entries(names).map(([type,label])=><article key={type} style={{background:'white',padding:18,border:'1px solid #d6e8db',borderRadius:14}}><small>{label}</small><div style={{fontSize:32,fontWeight:750}}>{counts[type]||0}</div><small>In loaded activity feed</small></article>)}
    </section>
    <div style={{marginBottom:18}}>
     <ExportRecords basename="landshop-customer-activity" rows={rows.map(r=>({activity_type:r.activity_type,record_id:r.record_id,customer_id:r.customer_id,stage:r.stage,happened_at:r.happened_at}))}/>
    </div>
    <div style={{overflowX:'auto',background:'white',border:'1px solid #d3e6d9',borderRadius:16}}>
     <table style={{width:'100%',borderCollapse:'collapse',minWidth:650}}>
      <thead><tr>{['Activity','Reference','Customer ID','Status','Recorded','Manage'].map(h=><th key={h} style={{padding:14,textAlign:'left',background:'#e8f2ec'}}>{h}</th>)}</tr></thead>
      <tbody>{rows.map(r=><tr key={r.activity_type+r.record_id}>
       <td style={{padding:13,borderTop:'1px solid #edf1ef'}}>{names[r.activity_type]||r.activity_type}</td>
       <td style={{padding:13,borderTop:'1px solid #edf1ef',fontFamily:'monospace'}}>{r.record_id.slice(0,12)}…</td>
       <td style={{padding:13,borderTop:'1px solid #edf1ef',fontFamily:'monospace'}}>{r.customer_id?r.customer_id.slice(0,12)+'…':'Unlinked'}</td>
       <td style={{padding:13,borderTop:'1px solid #edf1ef'}}>{r.stage}</td>
       <td style={{padding:13,borderTop:'1px solid #edf1ef'}}>{new Date(r.happened_at).toLocaleString('en-NG',{timeZone:'Africa/Lagos'})}</td>
       <td style={{padding:13,borderTop:'1px solid #edf1ef'}}><Link href={targets[r.activity_type]||'/admin'}>Open queue</Link></td>
      </tr>)}</tbody>
     </table>
     {rows.length===0&&<p style={{padding:22}}>No customer activity recorded in these operational sources yet.</p>}
    </div>
    <p style={{fontSize:12,color:'#5e7c68',marginTop:18}}>Latest {rows.length} recorded events, capped at 250. Counts represent only the loaded feed, not all-time database totals. For individual records use the appropriate access-controlled queue.</p>
   </>}
  </div>
 </main>;
}