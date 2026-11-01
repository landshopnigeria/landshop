import Link from 'next/link';
type Metric={label:string;value:number|null;icon:string;url:string;detail?:string};
type Score={score:number|null;date:string};
type Props={
 metrics:Metric[]; tasks:number|null;reports:number|null;drafts:number|null;pendingKyc:number|null;
 scores:Score[];recentProperties:{id:string;title:string;status:string;created_at:string}[];
 verifiedPayments:number|null;verifiedPaymentKobo:number|null
};
const number=(n:number|null)=>n===null?'—':new Intl.NumberFormat('en-NG').format(n);
const money=(kobo:number|null)=>kobo===null?'—':new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(kobo/100);
function scorePeriod(scores:Score[],days:number){
 const cutoff=Date.now()-days*86400000;
 const available=scores.filter(s=>typeof s.score==='number'&&Number.isFinite(s.score)&&new Date(s.date).getTime()>=cutoff);
 if(!available.length)return null;
 return Math.round(available.reduce((sum,s)=>sum+Number(s.score),0)/available.length);
}
export default function CommandOverview({metrics,tasks,reports,drafts,pendingKyc,scores,recentProperties,verifiedPayments,verifiedPaymentKobo}:Props){
 const rollups=[['7 Day Performance',scorePeriod(scores,7)],['30 Day Performance',scorePeriod(scores,30)],['90 Day Performance',scorePeriod(scores,90)],['Yearly Performance',scorePeriod(scores,365)]] as const;
 const actions=[
  {label:'Approvals',detail:'Review & approve',icon:'✓',url:'/admin/properties/import/review'},
  {label:'People & Staff',detail:'Roles, verify, suspend',icon:'♙',url:'/admin/staff'},
  {label:'Customers',detail:'Customer activity',icon:'♧',url:'/admin/customer-activity'},
  {label:'Performance',detail:'Staff reports',icon:'▥',url:'/admin/reports'},
  {label:'Portfolio',detail:'Properties & applications',icon:'▦',url:'/admin/properties'}
 ];
 const exports=[
  {label:'PDF & Reports',detail:'Print to PDF',url:'/admin/reports',icon:'PDF'},
  {label:'Excel & CSV',detail:'Authorized export',url:'/admin/reports',icon:'XLS'},
  {label:'Word',detail:'Authorized export',url:'/admin/reports',icon:'DOC'},
  {label:'Property Import',detail:'Private file staging',url:'/admin/properties/import/advanced',icon:'⇧'}
 ];
 const alerts=[
  {label:'Draft properties awaiting verification',value:drafts,url:'/admin/properties',priority:'Review'},
  {label:'Identity verification queue',value:pendingKyc,url:'/admin/kyc',priority:'Review'},
  {label:'Staff reports needing review',value:reports,url:'/admin/staff',priority:'Review'},
  {label:'Total staff assignments',value:tasks,url:'/admin/staff',priority:'Overview'}
 ];
 return <section className="ls26-command-overview" aria-labelledby="ls26-command-heading">
  <div className="ls26-welcome ls26-command-welcome"><div><small>LANDSHOP ENTERPRISE</small><h1 id="ls26-command-heading">Global Command Center</h1><p>Enterprise operations, staff, customers, estates and verified financial activity in one controlled workspace.</p></div></div>
  <div className="ls26-command-metrics">
   <div className="ls26-command-metric-title"><strong>Enterprise Overview</strong><span>Live, permission-scoped records</span></div>
   {metrics.map(m=><Link href={m.url} key={m.label} className="ls26-command-metric"><span className="ls26-command-metric-icon" aria-hidden="true">{m.icon}</span><div><small>{m.label}</small><strong>{number(m.value)}</strong>{m.detail&&<span>{m.detail}</span>}</div></Link>)}
  </div>
  <div className="ls26-command-charts">
   <section className="ls26-panel ls26-command-performance"><div className="ls26-panel-heading"><h3>Organization Performance</h3><Link href="/admin/reports">Analytics <span aria-hidden="true">→</span></Link></div>
    <div className="ls26-score-grid">{rollups.map(([name,value],i)=><div className="ls26-score" key={name}><strong>{name}</strong><div className={'ls26-ring '+(i===3?'orange':'')} style={{'--ls26-progress':(value??0)+'%'} as React.CSSProperties}><span>{value===null?'—':value+'%'}<small>{value===null?'Not scored':'Reviewed tasks'}</small></span></div></div>)}</div>
    <p className="ls26-note">Period averages use available manager-reviewed task scores only, not invented company performance or unverified customer KPIs.</p>
   </section>
   <section className="ls26-panel ls26-command-finance"><div className="ls26-panel-heading"><h3>Verified Payment Snapshot</h3><Link href="/admin/reports">View Reports <span aria-hidden="true">→</span></Link></div>
    <div className="ls26-payment-amount"><small>Verified payment intents</small><strong>{money(verifiedPaymentKobo)}</strong><span>{verifiedPayments===null?'Restricted or unavailable':number(verifiedPayments)+' confirmed records'}</span></div>
    <p className="ls26-note">Payment activity is not represented as recognized revenue. Revenue and ROI require reconciled financial ledgers and approved investments.</p>
   </section>
   <section className="ls26-panel ls26-command-alerts"><div className="ls26-panel-heading"><h3>Operations Alerts</h3><Link href="/admin/kyc">View queues <span aria-hidden="true">→</span></Link></div>
    {alerts.map(a=><Link href={a.url} key={a.label} className="ls26-alert-row"><span aria-hidden="true">●</span><strong>{a.label}</strong><em>{number(a.value)}</em></Link>)}
   </section>
  </div>
  <div className="ls26-command-actions">
   <section className="ls26-panel"><div className="ls26-panel-heading"><h3>Management Actions</h3></div><div className="ls26-action-tiles">{actions.map(a=><Link href={a.url} key={a.label}><span aria-hidden="true">{a.icon}</span><strong>{a.label}</strong><small>{a.detail}</small><b aria-hidden="true">→</b></Link>)}</div></section>
   <section className="ls26-panel"><div className="ls26-panel-heading"><h3>Import & Export Center</h3><Link href="/admin/properties/import/review">Review jobs <span aria-hidden="true">→</span></Link></div><div className="ls26-action-tiles ls26-import-tiles">{exports.map(a=><Link href={a.url} key={a.label}><span aria-hidden="true">{a.icon}</span><strong>{a.label}</strong><small>{a.detail}</small></Link>)}</div><p className="ls26-note">Document extraction requires an active worker and authorized draft approval. A file upload alone never publishes a property.</p></section>
  </div>
  <div className="ls26-command-lower">
   <section className="ls26-panel"><div className="ls26-panel-heading"><h3>Properties & Listings</h3><Link href="/admin/properties">Manage Properties <span aria-hidden="true">→</span></Link></div>
    {recentProperties.length?<div className="ls26-portfolio-table"><table><thead><tr><th>Property</th><th>Status</th><th>Record</th></tr></thead><tbody>{recentProperties.map(x=><tr key={x.id}><td><strong>{x.title}</strong></td><td><span className="ls26-pill">{x.status}</span></td><td><Link href={'/admin/properties/'+x.id}>Manage <span aria-hidden="true">→</span></Link></td></tr>)}</tbody></table></div>:<p className="ls26-empty">No accessible property records.</p>}
   </section>
   <section className="ls26-panel"><div className="ls26-panel-heading"><h3>Operational Queues</h3><Link href="/admin/staff">Staff Management <span aria-hidden="true">→</span></Link></div><div className="ls26-queue-list">
    <Link href="/admin/kyc"><strong>{number(pendingKyc)}</strong><span>KYC cases requiring review</span><b aria-hidden="true">→</b></Link>
    <Link href="/admin/staff"><strong>{number(reports)}</strong><span>Staff submissions awaiting review</span><b aria-hidden="true">→</b></Link>
    <Link href="/admin/properties"><strong>{number(drafts)}</strong><span>Draft property records</span><b aria-hidden="true">→</b></Link>
    <Link href="/admin/staff"><strong>{number(tasks)}</strong><span>Staff tasks</span><b aria-hidden="true">→</b></Link>
   </div></section>
  </div>
 </section>;
}
