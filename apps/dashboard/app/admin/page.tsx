import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {createServerClient} from '@supabase/ssr';
import Link from 'next/link';
import './command.css';
export const dynamic='force-dynamic';
export const metadata={title:'Landshop Global Command Center'};
const links=[
 ['Overview','/admin','⌂'],['Property Management','/admin/properties','▦'],
 ['Property Import','/admin/properties/import/advanced','⇧'],
 ['Import Approval','/admin/properties/import/review','✓'],
 ['KYC Review','/admin/kyc','◉'],['Applications','/admin/applications','▣'],
 ['Seven Cities Allocation','/admin/seven-cities','⌖'],
 ['Workflow Automation','/admin/automation','⌘'],
 ['Customer Support','/admin/support','☏'],['Reports & Analytics','/admin/reports','▥'],
 ['Roles & Permissions','/admin/staff','♙']];
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
 const allowed=members.filter(m=>['owner','admin','executive','operations','legal','finance','sales','hr','marketing'].includes(m.role));
 if(!allowed.length)return <main className="command-denied">Your account is not authorized for management access.</main>;
 const {data:orgs}=await db.from('organizations').select('id').eq('kind','landshop').in('id',allowed.map(m=>m.organization_id));
 if(!orgs?.length)return <main className="command-denied">No active Landshop management assignment found.</main>;
 const [properties,apps,kyc,imports,staff,allocations]=await Promise.all([
  count(db,'properties'),count(db,'applications'),count(db,'kyc_submissions'),
  count(db,'property_import_batches'),count(db,'organization_members'),count(db,'allocation_cases')
 ]);
 const {data:recent}=await db.from('properties').select('id,title,status,property_type,created_at').order('created_at',{ascending:false}).limit(8);
 const {data:latestApplications}=await db.from('applications').select('id,kind,status,created_at').order('created_at',{ascending:false}).limit(8);
 const statList=[['Properties',properties,'▦'],['Applications',apps,'▣'],['KYC Submissions',kyc,'◉'],['Import Batches',imports,'⇧'],['Staff Records',staff,'♙'],['Allocation Cases',allocations,'⌖']];
 return <div className="command-shell">
  <aside className="command-side"><div className="command-brand"><strong>Landshop</strong><small>GLOBAL COMMAND CENTER</small></div>
   <nav aria-label="Global Command Center navigation">{links.map(([name,url,icon])=><Link href={url} className={url==='/admin'?'active':''} key={url}><span aria-hidden="true">{icon}</span> {name}</Link>)}</nav>
   <div className="command-side-note"><strong>Landshop Enterprise</strong><p>Develop · Incubate · Grow</p><small>Permissions enforced per department.</small></div>
  </aside>
  <div className="command-main"><header className="command-top"><div><strong>Global Command Center</strong><small>Manage · Monitor · Automate · Grow</small></div><span>Landshop Nigeria</span><div><Link href="/dashboard">Account</Link> · {user.email||'Authenticated employee'}</div></header>
   <main className="command-content">
    <section className="command-banner"><div><span>Welcome to the</span><h1>Landshop Global Command Center</h1><p>Complete control. Greater visibility. Accelerated growth.</p></div></section>
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
   </main>
  </div>
 </div>;
}