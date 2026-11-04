import Link from 'next/link';
import {requireLandshopStaff} from '../../../../lib/admin-access';

export const dynamic='force-dynamic';
export const revalidate=0;
export const metadata={title:'Operational Launch Readiness | Landshop',robots:{index:false,follow:false}};

type Property={id:string;title:string;status:string;estate_id:string|null;amount_kobo:number|null;price_last_confirmed_at:string|null};
type Estate={id:string;name:string;status:string};
type Asset={property_id:string;kind:string;status:string};
type Media={property_id:string;kind:string;status:string};
type Showcase={property_id:string;approved_by:string|null;location_verified:boolean};
type Workflow={id:string;name:string;state:string;approved_by:string|null;draft_graph:{nodes?:unknown[];edges?:unknown[]}|null};
type Application={id:string;status:string;kind:string};
type Contact={status:string};
const styles={
 section:{background:'#fff',border:'1px solid #dceae2',borderRadius:18,padding:'clamp(17px,3vw,28px)'} as const,
 link:{color:'#0a7f5f',fontWeight:750,textDecoration:'underline',textUnderlineOffset:3} as const,
 row:{display:'flex',justifyContent:'space-between',flexWrap:'wrap',alignItems:'center',gap:14,padding:'15px 0',borderBottom:'1px solid #e8f1eb'} as const,
 muted:{color:'#5b7869',fontSize:13,lineHeight:1.65} as const
};
function number(value:number|null){return value===null?'Unavailable':value.toLocaleString('en-NG')}
function numberFromResult(result:{count?:number|null;error:unknown;data?:unknown[]|null}){return result.error?null:result.count??result.data?.length??0}

export default async function OperationalReadiness(){
 const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const [properties,estates,assets,media,showcases,workflows,applications,contacts,reconciliations]=await Promise.all([
  db.from('properties').select('id,title,status,estate_id,amount_kobo,price_last_confirmed_at',{count:'exact'}).order('created_at',{ascending:false}).limit(100),
  db.from('estates').select('id,name,status').limit(150),
  db.from('property_assets').select('property_id,kind,status').limit(500),
  db.from('property_showcase_media').select('property_id,kind,status').limit(500),
  db.from('property_showcase').select('property_id,approved_by,location_verified').limit(150),
  db.from('automation_workflows').select('id,name,state,approved_by,draft_graph',{count:'exact'}).order('created_at').limit(100),
  db.from('applications').select('id,status,kind',{count:'exact'}).limit(100),
  db.from('contact_enquiries').select('status',{count:'exact'}).limit(100),
  db.from('audit_events').select('id',{count:'exact',head:true}).eq('event_type','notification.internal_contact_cancelled')
 ]);
 const degraded=[properties,estates,assets,media,showcases,workflows,applications,contacts,reconciliations].some(x=>Boolean(x.error));
 const estateMap=new Map(((estates.data||[]) as Estate[]).map(x=>[x.id,x] as const));
 const approvedAssets=(assets.data||[]) as Asset[],approvedMedia=(media.data||[]) as Media[];
 const detailMap=new Map(((showcases.data||[]) as Showcase[]).map(x=>[x.property_id,x] as const));
 const propertyRows=((properties.data||[]) as Property[]).map(property=>{
  const blockers:string[]=[];
  const estate=estateMap.get(property.estate_id||'');
  if(estate?.status!=='published')blockers.push('Estate and development location approval');
  if(property.amount_kobo===null||property.amount_kobo<=0||!property.price_last_confirmed_at||
    new Date(property.price_last_confirmed_at).getTime()<Date.now()-30*86400000)blockers.push('Independent, current price verification');
  for(const kind of ['title_document','marketing_authority']){
   if(!approvedAssets.some(a=>a.property_id===property.id&&a.kind===kind&&a.status==='verified'))
    blockers.push(kind==='title_document'?'Verified title document':'Verified marketing authority');
  }
  const showcase=detailMap.get(property.id);
  if(!showcase?.approved_by||!showcase.location_verified)blockers.push('Approved description and exact map pin');
  if(!approvedMedia.some(m=>m.property_id===property.id&&m.kind==='photo'&&m.status==='approved'))
   blockers.push('Approved property-specific media');
  return {...property,estate,blockers};
 });
 const wfRows=(workflows.data||[]) as Workflow[],appRows=(applications.data||[]) as Application[];
 const contactRows=(contacts.data||[]) as Contact[];
 const draftProperties=propertyRows.filter(x=>x.status==='draft').length;
 const approvedProperties=propertyRows.filter(x=>x.status==='published').length;
 const draftFlows=wfRows.filter(x=>x.state==='draft').length;
 const liveFlows=wfRows.filter(x=>x.state==='active').length;
 const appSubmitted=appRows.filter(x=>x.status==='submitted').length;
 const cancelled=numberFromResult(reconciliations);
 return <main style={{minHeight:'100vh',background:'#f3f8f5',color:'#163e32',padding:'clamp(17px,3.4vw,42px)',fontFamily:'inherit'}}>
  <div style={{maxWidth:1210,margin:'0 auto',display:'grid',gap:24}}>
   <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:14}}>
    <div>
     <p style={{color:'#f26b10',fontWeight:800,letterSpacing:1.7,fontSize:11,margin:'0 0 8px'}}>PRIVATE MANAGEMENT · PRODUCTION READINESS</p>
     <h1 style={{fontSize:'clamp(26px,3.3vw,40px)',lineHeight:1.15,margin:0}}>Operational launch readiness</h1>
     <p style={{...styles.muted,maxWidth:760,marginTop:12}}>A live, read-only view of publication evidence, workflow approval, contact reconciliation and genuine customer applications. A saved draft is not a published property, an active automation or a submitted application.</p>
    </div>
    <Link href="/admin" style={styles.link}>Command Center overview</Link>
   </div>
   {degraded&&<div role="alert" style={{border:'1px solid #edb784',background:'#fff7ed',padding:16,borderRadius:13,color:'#894b1e'}}>One or more operational datasets could not be read with the current management permissions. Unavailable counts must not be interpreted as zero; verify access before approving a record.</div>}
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,215px),1fr))',gap:13}}>
    {[
     {label:'Property drafts',value:properties.error?null:draftProperties,detail:number(approvedProperties)+' published'},
     {label:'Automation drafts',value:workflows.error?null:draftFlows,detail:number(liveFlows)+' active'},
     {label:'Resolved-event reconciliations',value:cancelled,detail:'Cancelled, not delivered'},
     {label:'Customer submissions',value:applications.error?null:appSubmitted,detail:number(numberFromResult(applications))+' total application records'}
    ].map(item=><div key={item.label} style={{background:'#fff',border:'1px solid #d6e8dc',borderRadius:16,padding:19}}>
     <p style={{margin:0,color:'#5e7868',fontSize:12,fontWeight:750}}>{item.label}</p>
     <strong style={{display:'block',fontSize:32,margin:'8px 0',color:'#087d5b'}}>{number(item.value)}</strong>
     <p style={{...styles.muted,margin:0}}>{item.detail}</p>
    </div>)}
   </div>
   <section style={styles.section} aria-labelledby="readiness-properties">
    <div style={styles.row}><div><h2 id="readiness-properties" style={{fontSize:21,margin:0}}>Property publication</h2><p style={styles.muted}>Six imported estate records require independently verified evidence before being advertised as available.</p></div>
     <Link href="/admin/properties/readiness" style={styles.link}>Full nine-point readiness checks</Link></div>
    {!properties.error&&propertyRows.map(property=><div key={property.id} style={styles.row}>
     <div style={{flex:'1 1 250px',minWidth:0}}>
      <strong style={{display:'block',fontSize:14}}>{property.title}</strong>
      <p style={{...styles.muted,margin:'5px 0'}}>Estate: {property.estate?.name||'Not assigned'} · Status: {property.status}</p>
      {property.blockers.length>0&&<p style={{...styles.muted,margin:0,color:'#a85b1a'}}>{property.blockers.slice(0,3).join(' · ')}{property.blockers.length>3?' · +'+(property.blockers.length-3)+' more':''}</p>}
     </div>
     <Link href={'/admin/properties/'+property.id} style={styles.link}>Verify evidence</Link>
    </div>)}
    {!properties.error&&propertyRows.length===0&&<p style={styles.muted}>No property records exist. Verified owner/developer inventory must be submitted first.</p>}
   </section>
   <section style={styles.section} aria-labelledby="readiness-automation">
    <div style={styles.row}><div><h2 id="readiness-automation" style={{fontSize:21,margin:0}}>Workflow approval and rehearsal</h2>
      <p style={styles.muted}>Draft diagrams are saved for review. They do not send messages, activate payment actions or execute provider integrations.</p></div>
      <Link href="/admin/automation" style={styles.link}>Open Automation Studio</Link></div>
    {!workflows.error&&wfRows.map(flow=><div key={flow.id} style={styles.row}>
      <div style={{flex:'1 1 250px'}}>
       <strong style={{fontSize:14}}>{flow.name}</strong>
       <p style={{...styles.muted,margin:'5px 0'}}>{flow.state} · {Array.isArray(flow.draft_graph?.nodes)?flow.draft_graph.nodes.length:0} nodes · {Array.isArray(flow.draft_graph?.edges)?flow.draft_graph.edges.length:0} connections · {flow.approved_by?'Approved by reviewer':'Reviewer approval outstanding'}</p>
      </div>
      <Link href="/admin/automation" style={styles.link}>Review and rehearse</Link>
     </div>)}
    {!workflows.error&&wfRows.length===0&&<p style={styles.muted}>No automation workflows have been created.</p>}
   </section>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))',gap:16}}>
    <section style={styles.section} aria-labelledby="readiness-contact"><h2 id="readiness-contact" style={{fontSize:20,margin:0}}>Internal notification reconciliation</h2>
     <p style={styles.muted}>The resolved contact-enquiry event was cancelled without external delivery and retained in the audit trail. This is not an email, WhatsApp or SMS delivery confirmation.</p>
     <p style={styles.muted}>Contact enquiries resolved: {contacts.error?'Unavailable':contactRows.filter(x=>x.status==='resolved').length} · Audited reconciliations: {number(cancelled)}</p>
     <p><Link href="/admin/contact" style={styles.link}>Open contact queue</Link> · <Link href="/admin/audit" style={styles.link}>View audit history</Link></p>
    </section>
    <section style={styles.section} aria-labelledby="readiness-applications"><h2 id="readiness-applications" style={{fontSize:20,margin:0}}>Customer applications</h2>
     <p style={styles.muted}>{applications.error?'Application access could not be verified.':appSubmitted===0?'No applications have reached the submitted stage. This does not mean the intake system is broken. A confirmed customer account must complete and submit a real application.':String(appSubmitted)+' genuine submitted application(s) are recorded.'}</p>
     <p style={styles.muted}>Drafts: {applications.error?'Unavailable':appRows.filter(x=>x.status==='draft').length} · Total records: {number(numberFromResult(applications))}</p>
     <p><Link href="/admin/applications" style={styles.link}>Review application queue</Link> · <a href="https://portal.landshopnigeria.com/applications" style={styles.link} target="_blank" rel="noopener noreferrer">Open secure application forms</a></p>
    </section>
   </div>
   <p style={{...styles.muted,margin:0,fontSize:12}}>Protected records remain private. Publication requires verified rights, current pricing, approved photographs and independent review. Live outbound communication requires approved provider settings, opt-in controls and delivery evidence.</p>
  </div>
 </main>;
}
