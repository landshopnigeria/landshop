import CommandSideNavigation from './CommandSideNavigation';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {createServerClient} from '@supabase/ssr';
import Link from 'next/link';
import './command.css';
export const dynamic='force-dynamic';
export const metadata={title:'Landshop Global Command Center'};
const links=[
 ['Dashboard','/admin','⌂'],['Customer Activity','/admin/customer-activity','◷'],['Property Management','/admin/properties','▦'],['Leads & Applications','/admin/applications','▣'],
 ['CRM Application Queue','/admin/applications','↗'],['Mortgage Reviews','/admin/applications','◉'],
 ['Property Import','/admin/properties/import/advanced','⇧'],['Import Approval','/admin/properties/import/review','✓'],
 ['Workflow Automation','/admin/automation','⌘'],['Website Enquiries','/admin/enquiries','✉'],['Article Comments','/admin/comments','☷'],['Daily Newsletter','/admin/newsletter','✉'],['Customer Support','/admin/support','☏'],
 ['Referral Records','/admin/reports','♧'],['Staff & Roles','/admin/staff','♙'],['Workforce & Attendance','/admin/workforce','◷'],
 ['KYC & Compliance','/admin/kyc','◈'],['Survey & Allocation','/admin/seven-cities','⌖'],
 ['Reports & Analytics','/admin/reports','▥'],['Staff Dashboard','/staff','⌂']];
async function count(db:any,table:string){
 const {count,error}=await db.from(table).select('*',{count:'exact',head:true});
 return error?null:count;
}
export default async function Admin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Supabase environment configuration is required.</main>;
 const store=await cookies();
 const db=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'},
  cookies:{getAll(){return store.getAll()},setAll(items){try{items.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}
 });
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:members,error:membershipError}=await db.from('organization_members')
  .select('role,organization_id').eq('user_id',user.id).eq('status','active');
 if(membershipError||!members?.length)return <main className="command-denied">Landshop Global Command Center — staff account required. <Link href="/dashboard">Customer Dashboard</Link></main>;
 const allowed=members.filter(m=>['owner','ceo','founder','admin','technology_officer','technology_consultant'].includes(m.role));
 if(!allowed.length)return <main className="command-denied">Your account is not authorized for management access.</main>;
 // Align the top-level command center with the verified management gate
 // already used in RLS and privileged staff review procedures.
 const {data:verifiedManager,error:managementCheckError}=await db.rpc('landshop_is_management',{p_user:user.id});
 if(managementCheckError||verifiedManager!==true)return <main className="command-denied">Verified management approval is required for Command Center access.</main>;
 const {data:orgs}=await db.from('organizations').select('id').eq('kind','landshop').in('id',allowed.map(m=>m.organization_id));
 if(!orgs?.length)return <main className="command-denied">No active Landshop management assignment found.</main>;
 const isOwner=allowed.some(m=>m.role==='owner'&&orgs.some(o=>o.id===m.organization_id));
 const [properties,apps,kyc,imports,staff,allocations,tickets,enquiries,referrals,workflows,published]=await Promise.all([
  count(db,'properties'),count(db,'applications'),count(db,'kyc_submissions'),
  count(db,'property_import_batches'),count(db,'organization_members'),count(db,'allocation_cases'),
  count(db,'support_tickets'),count(db,'contact_enquiries'),count(db,'referral_edges'),count(db,'automation_workflows'),
  db.from('properties').select('*',{count:'exact',head:true}).eq('status','published').then(result=>result.error?null:result.count)
 ]);
 const {data:recent}=await db.from('properties').select('id,title,status,property_type,created_at').order('created_at',{ascending:false}).limit(8);
 const {data:latestApplications}=await db.from('applications').select('id,kind,status,created_at').order('created_at',{ascending:false}).limit(8);
 const {data:recentTickets}=await db.from('support_tickets').select('id,subject,priority,status,updated_at').order('updated_at',{ascending:false}).limit(6);
 const {data:recentAudits}=await db.from('audit_events').select('id,event_type,created_at').order('created_at',{ascending:false}).limit(6);
 const statList=[['Total Properties',properties,'⌂'],['Published Properties',published,'▦'],['Applications',apps,'▣'],['Support Tickets',tickets,'☏'],['Website Enquiries',enquiries,'✉'],['Staff Records',staff,'♙'],['Import Batches',imports,'⇧'],['Referrals',referrals,'♧'],['Automations',workflows,'⌘']];
 return <div className="command-shell">
  <CommandSideNavigation links={links} isOwner={isOwner}/>
  <div className="command-main"><header className="command-top"><div><strong>Global Command Center</strong><small>{isOwner?'Verified Owner · Full Enterprise Control':'Manage · Monitor · Automate · Grow'}</small></div><span>Landshop Nigeria</span><div><Link href="/staff">Staff Dashboard</Link> · {user.email||'Authenticated employee'}</div></header>
   <main className="command-content">
    <section className="command-banner"><div><span>{isOwner?'Owner access · All Command Center modules':'Welcome to the'}</span><h1>Landshop Global Command Center</h1><p>Complete control. Greater visibility. Accelerated growth.</p></div><blockquote className="command-quote">Turning documented property decisions into opportunity across Africa.</blockquote></section>
    <p className="command-micro">These are live access-controlled database records. No illustrative sales, property or revenue figures are shown.</p>
    <div className="command-stats">{statList.map(([title,value,icon])=><article key={title as string}><div className="command-icon">{icon}</div><small>{title}</small><h2>{value===null?'—':String(value)}</h2><p>{value===null?'Restricted or not available':'Live database count'}</p></article>)}</div>
    <div className="command-panels">
     <section className="command-panel"><div className="panel-top"><h2>Property inventory</h2><Link href="/admin/properties">View all →</Link></div>
      <div className="command-table"><table><thead><tr><th>Property</th><th>Type</th><th>Status</th></tr></thead><tbody>{(recent||[]).map(x=><tr key={x.id}><td><Link href={'/admin/properties/'+x.id}>{x.title}</Link></td><td>{x.property_type}</td><td>{x.status}</td></tr>)}</tbody></table>{!recent?.length&&<p className="empty-note">No verified property records available yet.</p>}</div>
     </section>
     <section className="command-panel"><div className="panel-top"><h2>Applications & mortgage requests</h2><Link href="/admin/applications">View queue →</Link></div>
      <div className="command-table"><table><thead><tr><th>Application</th><th>Product</th><th>Stage</th></tr></thead><tbody>{(latestApplications||[]).map(x=><tr key={x.id}><td>{x.id.slice(0,8)}…</td><td>{x.kind.replaceAll('_',' ')}</td><td>{x.status}</td></tr>)}</tbody></table>{!latestApplications?.length&&<p className="empty-note">No submitted applications visible to this staff role.</p>}</div>
     </section>
     <section className="command-panel"><div className="panel-top"><h2>Bulk Property Import Center</h2><Link href="/admin/properties/import/advanced">Import now →</Link></div><p>Upload CSV, Excel, XML, Word, PDF or ZIP files to private staging. Verify content and approve draft conversion before publication.</p><div className="command-quick"><Link href="/admin/properties/import/advanced">Start Import</Link><Link href="/admin/properties/import/review">Review Batches</Link></div></section>
     <section className="command-panel"><div className="panel-top"><h2>Workflow Automation</h2><Link href="/admin/automation">Open Studio →</Link></div><p>Configure the Beta Mortgage and Mortgage Xtra communication lifecycles, inspections, handovers and milestone notifications. Delivery remains provider-gated.</p><div className="command-flow"><span>Application</span>→<span>Review</span>→<span>Inspection</span>→<span>Funding</span>→<span>Handover</span></div></section>
     <section className="command-panel"><div className="panel-top"><h2>Seven Cities Allocation</h2><Link href="/admin/seven-cities">Manage programme →</Link></div><p>Coordinate CX, Survey, Legal and Finance clearance. Monitor survey layout, invitations, allocation records and outstanding tasks.</p><div className="command-quick"><Link href="/admin/seven-cities">Open Allocation Management</Link></div></section>
     <section className="command-panel"><div className="panel-top"><h2>KYC & Compliance</h2><Link href="/admin/kyc">Open KYC queue →</Link></div><p>Restrict identity-document access to authorized reviewers. View original uploads and log decisions before granting verified status.</p><div className="command-quick"><Link href="/admin/kyc">Review KYC Cases</Link></div></section>
    </div>

    <div className="command-panels command-lower">
     <section className="command-panel"><div className="panel-top"><h2>Customer Support / Tickets</h2><Link href="/admin/support">View all →</Link></div>{recentTickets?.length?<div className="command-table"><table><thead><tr><th>Reference</th><th>Subject</th><th>Priority</th><th>Status</th></tr></thead><tbody>{recentTickets.map(t=><tr key={t.id}><td>{t.id.slice(0,8)}</td><td>{t.subject}</td><td>{t.priority}</td><td>{t.status}</td></tr>)}</tbody></table></div>:<p>No visible support tickets for your management role.</p>}</section>
     <section className="command-panel"><div className="panel-top"><h2>Referral Management</h2><Link href="/admin/reports">Reporting →</Link></div><div className="command-readout"><span>Recorded referral relationships</span><strong>{referrals===null?'—':referrals}</strong></div><p>Commission and payout calculations require approved transaction records; no estimated earnings are shown.</p></section>
     <section className="command-panel"><div className="panel-top"><h2>Communication Automation</h2><Link href="/admin/automation">Manage workflows →</Link></div><div className="command-providers"><div><span>✉</span><strong>Email</strong><small>Provider delivery not verified</small></div><div><span>◉</span><strong>WhatsApp</strong><small>Business API not connected</small></div><div><span>▤</span><strong>SMS</strong><small>Gateway not connected</small></div></div><p>Activation is blocked until provider credentials, consent handling and delivery tests pass.</p></section>
     <section className="command-panel"><div className="panel-top"><h2>CRM & Operational Pipeline</h2><Link href="/admin/applications">Open application queue →</Link></div><div className="command-readout"><span>Actual application records</span><strong>{apps===null?'—':apps}</strong></div><p>Lead qualification, sales conversions and financial reconciliation require dedicated CRM and payment events; no simulated funnel counts are displayed.</p></section>
     <section className="command-panel"><div className="panel-top"><h2>Staff Attendance & Tasks</h2><Link href="/admin/staff">Staff directory →</Link></div><div className="command-readout"><span>Active membership records accessible</span><strong>{staff===null?'—':staff}</strong></div><p>Attendance, punctuality and task-performance figures are unavailable until signed staff events and permissions are implemented.</p></section>
     <section className="command-panel"><div className="panel-top"><h2>Activity & Audit Feed</h2><Link href="/admin/reports">Reports →</Link></div>{recentAudits?.length?<div className="command-timeline">{recentAudits.map(a=><div key={a.id}><strong>{a.event_type.replaceAll('_',' ')}</strong><small>{new Date(a.created_at).toLocaleString('en-NG')}</small></div>)}</div>:<p>No audit events visible to your active staff role.</p>}</section>
     <section className="command-panel"><div className="panel-top"><h2>Roles & Permissions</h2><Link href="/admin/staff">Manage roles →</Link></div><p>Owner, executive, operations, legal, finance, sales and reviewer access are governed by the verified organizational membership database and row-level security.</p><div className="command-quick"><Link href="/admin/staff">Open Directory ↗</Link><Link href="/admin/kyc">Identity Review ↗</Link></div></section>
     <section className="command-panel"><div className="panel-top"><h2>Finance & Payments</h2><Link href="/admin/reports">Operational reporting →</Link></div><p>Production revenue and sales metrics are intentionally not displayed without an approved ledger and payment-provider reconciliation. Actual transaction integrations remain a separate activation milestone.</p></section>
    </div>
   </main>
  </div>
 </div>;
}