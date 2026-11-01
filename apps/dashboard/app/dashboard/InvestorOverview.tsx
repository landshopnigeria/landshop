import Link from 'next/link';
import MortgageCalculator from './MortgageCalculator';

type Application={id:string;kind:string;status:string;created_at:string;answers?:unknown};
type Payment={id:string;amount_kobo:number;currency:string;purpose:string;purpose_reference:string|null;status:string;verified_at:string|null;created_at:string};
type Document={id:string;document_type:string;created_at:string;application_id:string};
type Props={firstname:string;kyc:string;applications:Application[];payments:Payment[];documents:Document[];applicationCount:number|null;supportCount:number|null};
const money=(kobo:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(kobo/100);
const date=(iso:string)=>new Date(iso).toLocaleDateString('en-NG',{timeZone:'Africa/Lagos',day:'numeric',month:'short',year:'numeric'});
const readable=(value:string)=>value.replaceAll('_',' ').replace(/\b\w/g,s=>s.toUpperCase());
function ring(label:string,value:number|null,description:string,accent=false){
 const percentage=value===null?0:Math.min(100,Math.max(0,value));
 return <div className="ls26-invest-ring" key={label}><strong>{label}</strong><div className={'ls26-ring '+(accent?'orange':'')} style={{'--ls26-progress':percentage+'%'} as React.CSSProperties}>
  <span>{value===null?'—':Math.round(value)+'%'}<small>{description}</small></span></div></div>;
}
function answerValue(answers:unknown,fields:string[]){
 if(!answers||typeof answers!=='object'||Array.isArray(answers))return null;
 const a=answers as Record<string,unknown>;
 for(const field of fields){const v=a[field];if((typeof v==='string'&&v.trim().length>0)||(typeof v==='number'&&Number.isFinite(v)))return String(v).slice(0,120)}
 return null;
}
export default function InvestorOverview({firstname,kyc,applications,payments,documents,applicationCount,supportCount}:Props){
 const verifiedPayments=payments.filter(p=>p.currency==='NGN'&&Boolean(p.verified_at)&&['successful','success','paid','completed','confirmed'].includes(p.status.toLowerCase()));
 const paid=verifiedPayments.reduce((sum,p)=>sum+Number(p.amount_kobo||0),0);
 const latest=applications[0];
 const requested=latest?answerValue(latest.answers,['investment_amount','amount','budget','property_budget','requested_amount']):null;
 const amountRequested=requested?Number(requested.replace(/[₦,\s]/g,'')):NaN;
 const requestKobo=Number.isFinite(amountRequested)&&amountRequested>0?amountRequested*100:null;
 // A customer's requested application amount is NOT an approved investment contract.
 const percent=requestKobo&&paid>0?Math.min(100,100*paid/requestKobo):null;
 const property=latest?answerValue(latest.answers,['project_name','project','estate','property','property_type','property_id']):null;
 const tenor=latest?answerValue(latest.answers,['tenor','duration','investment_duration','duration_months','loan_tenor']):null;
 const location=latest?answerValue(latest.answers,['location','state','preferred_location']):null;
 return <div className="ls26-investor">
  <section className="ls26-welcome ls26-investor-welcome"><div><small>MY LANDSHOP INVESTMENT DASHBOARD</small><h1>Good day, {firstname}</h1><p>Track submitted investment decisions, verified payments, documents and property opportunities in one place.</p></div></section>
  <div className="ls26-investor-upper">
   <section id="roi-forecast" className="ls26-panel ls26-invest-scores" aria-label="Investment progress rings"><div className="ls26-score-grid">
    {ring('Paid',percent,percent===null?'Not yet calculated':'Of requested amount')}
    {ring('ROI',null,'No approved forecast')}
    {ring('Progress',percent,percent===null?'No approved schedule':'Payment progress')}
    {ring('Duration',null,tenor||'Not contracted',true)}
   </div><p className="ls26-note">Payment progress compares verified payments with the latest *requested* amount, not an approved investment or signed contract. ROI and maturity await documented investment terms.</p></section>
   <section className="ls26-panel ls26-invest-status"><div className="ls26-panel-heading"><h3>Your Investment Workspace</h3><span className="ls26-pill">{latest?readable(latest.status):'No application yet'}</span></div>
    <p>Your investment terms and payment schedule will appear when Landshop records and approves them.</p>
    <div className="ls26-buttons"><Link href="/dashboard/applications">View My Applications <span aria-hidden="true">→</span></Link><Link href="https://www.landshopnigeria.com/properties">Browse Properties <span aria-hidden="true">→</span></Link></div>
   </section>
  </div>
  <div className="ls26-investor-main">
   <div className="ls26-investor-left">
    <section className="ls26-panel"><div className="ls26-panel-heading"><h3>Investment Overview</h3><Link href="/dashboard/applications">View Details <span aria-hidden="true">→</span></Link></div>
     <div className="ls26-kpis ls26-invest-kpis"><div><strong>{requestKobo?money(requestKobo):'—'}</strong><span>Latest requested investment</span></div><div><strong>{money(paid)}</strong><span>Verified payments</span></div><div><strong>{requestKobo?money(Math.max(0,requestKobo-paid)):'—'}</strong><span>Difference vs. requested amount</span></div><div><strong>—</strong><span>Contractual ROI</span></div></div>
     <p className="ls26-note">A requested amount does not establish an amount owed. The balance and ROI shown in an executed investment contract are authoritative.</p>
    </section>
    <section id="payment-timeline" className="ls26-panel"><div className="ls26-panel-heading"><h3>Payment Timeline</h3><Link href="/dashboard/applications">My Applications <span aria-hidden="true">→</span></Link></div>
     {verifiedPayments.length?<div className="ls26-transaction-list">{verifiedPayments.slice(0,4).map(p=><div key={p.id}><span aria-hidden="true">●</span><div><strong>{money(p.amount_kobo)} verified</strong><small>{readable(p.purpose)} · {date(p.verified_at||p.created_at)}</small></div></div>)}</div>:<p className="ls26-empty">No verified payment events are recorded yet. An approved payment schedule will show future installments once available.</p>}
    </section>
    <section id="investor-portfolio" className="ls26-panel"><div className="ls26-panel-heading"><h3>My Portfolio & Applications</h3><Link href="/dashboard/applications">View All <span aria-hidden="true">→</span></Link></div>
     {applications.length?<div className="ls26-portfolio-table"><table><thead><tr><th>Application / Investment Type</th><th>Submitted</th><th>Status</th><th>Details</th></tr></thead><tbody>{applications.map(a=><tr key={a.id}><td><strong>{readable(a.kind)}</strong></td><td>{date(a.created_at)}</td><td><span className="ls26-pill">{readable(a.status)}</span></td><td><Link href="/dashboard/applications">Open <span aria-hidden="true">→</span></Link></td></tr>)}</tbody></table></div>:<div className="ls26-empty"><p>Your investment portfolio will appear when you submit or acquire a documented investment.</p><Link href="https://www.landshopnigeria.com/properties">Explore real estate opportunities <span aria-hidden="true">→</span></Link></div>}
    </section>
    <section className="ls26-panel"><div className="ls26-panel-heading"><h3>Recent Transactions</h3><span>Verified activity</span></div>
     {verifiedPayments.length?<div className="ls26-transaction-list">{verifiedPayments.slice(0,6).map(p=><div key={p.id}><span aria-hidden="true">↙</span><div><strong>{readable(p.purpose||'Payment')}</strong><small>{date(p.verified_at||p.created_at)}</small></div><strong>{money(p.amount_kobo)}</strong></div>)}</div>:<p className="ls26-empty">No verified transactions to display.</p>}
    </section>
   </div>
   <div className="ls26-investor-center">
    <section className="ls26-panel"><div className="ls26-panel-heading"><h3>Investment Details</h3><Link href="/dashboard/applications">Forms <span aria-hidden="true">→</span></Link></div>
     <dl className="ls26-detail-list"><div><dt>Investment / Application Type</dt><dd>{latest?readable(latest.kind):'—'}</dd></div><div><dt>Selected project / property</dt><dd>{property||'Not submitted'}</dd></div><div><dt>Preferred location</dt><dd>{location||'Not submitted'}</dd></div><div><dt>Requested duration</dt><dd>{tenor||'Not specified'}</dd></div><div><dt>Application status</dt><dd>{latest?readable(latest.status):'No application'}</dd></div><div><dt>Identity verification</dt><dd>{readable(kyc)}</dd></div></dl>
    </section>
    <section id="investment-documents" className="ls26-panel"><div className="ls26-panel-heading"><h3>Documents & Forms</h3><Link href="/dashboard/applications">All Applications <span aria-hidden="true">→</span></Link></div>
     {documents.length?<div className="ls26-docs">{documents.map(d=><div key={d.id}><span aria-hidden="true">▤</span><div><strong>{readable(d.document_type)}</strong><small>Submitted {date(d.created_at)}</small></div><Link href="/dashboard/applications">View <span aria-hidden="true">→</span></Link></div>)}</div>:<p className="ls26-empty">No application documents uploaded yet. Submit documents through the secure applications and KYC sections.</p>}
    </section>
    <section className="ls26-panel"><div className="ls26-panel-heading"><h3>Customer Activity</h3></div>
     {applications.slice(0,4).map(a=><div className="ls26-activity-item" key={a.id}><span aria-hidden="true">●</span><div><strong>{readable(a.kind)} application</strong><small>{date(a.created_at)} · {readable(a.status)}</small></div></div>)}
     {!applications.length&&<p className="ls26-empty">Your submitted applications and verified updates will appear here.</p>}
     <div className="ls26-kpis ls26-account-summary"><div><strong>{applicationCount===null?'—':applicationCount}</strong><span>Applications</span></div><div><strong>{supportCount===null?'—':supportCount}</strong><span>Support cases</span></div></div>
    </section>
   </div>
   <div className="ls26-investor-right">
    <MortgageCalculator/>
    <section className="ls26-panel ls26-advisor"><h3>Speak to an Advisor</h3><p>Questions about financing, your application or payment reconciliation? Our team can help.</p><Link href="https://portal.landshopnigeria.com/support">Contact an Advisor <span aria-hidden="true">→</span></Link></section>
   </div>
  </div>
 </div>;
}
