import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
import ActivityTimeline,{type Activity} from './ActivityTimeline';
export const dynamic='force-dynamic';
export const metadata={title:'Enterprise Activity | Landshop Command Center'};

export default async function ActivityPage(){
 const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const queries=[
  ['applications','Applications','/admin/applications','id,kind,status,created_at','created_at'],
  ['kyc_submissions','KYC','/admin/kyc','id,kind,status,created_at','created_at'],
  ['referral_edges','Referrals','/admin/reports','referee_id,created_at','created_at'],
  ['landshop_staff_routed_reports','Staff Reports','/admin/workforce/reports','id,recipient_role,cadence,status,created_at','created_at'],
  ['staff_tasks','Staff Tasks','/admin/workforce','id,title,status,created_at','created_at'],
  ['support_tickets','Support','/admin/support','id,subject,status,created_at','created_at'],
  ['contact_enquiries','Enquiries','/admin/enquiries','id,created_at','created_at'],
  ['landshop_payment_transactions','Payments','/admin/subscriptions','id,status,amount_kobo,created_at','created_at'],
  ['landshop_customer_subscriptions','Subscriptions','/admin/subscriptions','id,status,updated_at','updated_at'],
  ['automation_runs','Automation','/admin/automation','id,status,started_at','started_at'],
  ['audit_events','Security Audit','/admin/reports','id,event_type,created_at','created_at']
 ] as const;
 const results=await Promise.all(queries.map(async ([table,title,href,cols,sort])=>{
  const {data,error}=await db.from(table).select(cols).order(sort,{ascending:false}).limit(45);
  const items=((data||[]) as unknown as Record<string,unknown>[]);
  return {table,title,href,error:Boolean(error),rows:items.map((item):Activity=>{
   const id=String(item.id||item.referee_id||'');
   const kind=String(item.kind||item.recipient_role||item.event_type||item.title||item.subject||title);
   const status=String(item.status||item.cadence||'recorded').replaceAll('_',' ');
   const time=String(item.created_at||item.updated_at||item.started_at||'');
   const name=title==='Payments'?'Paystack payment event':title==='Security Audit'?kind:
    kind.length>85?kind.slice(0,82)+'...':kind;
   return {id:table+':'+id,category:title,title:name,status,time,href:href};
  })};
 }));
 const activities=results.flatMap(x=>x.rows).filter(x=>!Number.isNaN(new Date(x.time).getTime()))
  .sort((a,b)=>new Date(b.time).getTime()-new Date(a.time).getTime()).slice(0,250);
 const restricted=results.filter(x=>x.error).map(x=>x.title);
 return <main style={{minHeight:'100vh',background:'#f1f8f3',padding:'clamp(18px,4vw,60px)',color:'#123e32'}}>
  <section style={{maxWidth:1300,margin:'auto'}}>
   <Link href="/admin" style={{color:'#0a8064',fontWeight:800}}>← Global Command Center</Link>
   <p style={{fontSize:11,letterSpacing:2,color:'#de7221',fontWeight:800,marginTop:25}}>LANDSHOP ENTERPRISE INTELLIGENCE</p>
   <h1 style={{fontSize:'clamp(30px,4vw,47px)',letterSpacing:'-.04em',margin:'8px 0'}}>Enterprise Activity Center</h1>
   <p style={{fontSize:14,lineHeight:1.8,color:'#667f71',maxWidth:920}}>A live, role-authorized view of customer applications, KYC status, staff reports, property enquiries, payment verification, referrals, support and automation activity. Read-only operational evidence; all edits and approvals stay inside their protected modules.</p>
   {restricted.length>0&&<p role="status" style={{padding:14,borderRadius:12,background:'#fff4e7',color:'#965915'}}>Some modules are unavailable or restricted: {restricted.join(', ')}. Missing records are not represented as zero.</p>}
   <ActivityTimeline activities={activities} categories={queries.map(x=>x[1])}/>
   <p style={{fontSize:12,color:'#6c8777',marginTop:20}}>Showing up to 250 recent, authorized records from 11 operational sources. For complete owner-authorized exports, open <Link href="/admin/reports" style={{fontWeight:800,color:'#088563'}}>Reports & Analytics</Link>.</p>
  </section>
 </main>;
}
