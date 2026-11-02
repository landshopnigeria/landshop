'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {excelWorkbook,wordDocument} from '../reports/export-openxml';
import {createBrowserClient} from '@supabase/ssr';
import catalog from './catalog.json';
import './communications.css';

type Journey=keyof typeof catalog.flows;
type Scenario=(typeof catalog.templates)[number];
type Channel='Email'|'WhatsApp'|'SMS';
type Run={id:string;workflow:string;status:string;started_at:string;mode:string};
type Tab='journeys'|'templates'|'reporting'|'exports'|'safeguards';
const journeyNames:Journey[]=['Xtra','Beta','Invest','Estate Pro','Develop','Dev Pro'];
const labels:Record<Journey,string>={Xtra:'Mortgage Xtra',Beta:'Beta Mortgage',Invest:'Invest / Incubate','Estate Pro':'Estate Pro',Develop:'Develop','Dev Pro':'Dev Pro'};
const photos:Record<Journey,string>={Xtra:'/media/famous0.webp',Beta:'/media/maiyegun0.webp',Invest:'/media/deck-investment.webp','Estate Pro':'/media/deck-building.webp',Develop:'/media/famous0.webp','Dev Pro':'/media/deck-building.webp'};
const sample:Record<string,string>={
 first_name:'Amina',plan:'Mortgage Xtra',property:'Selected Landshop property',application_ref:'LNS-REVIEW-001',
 payment_amount:'Amount from verified agreement',payment_ref:'Verified transaction reference',
 payment_date:'Verified settlement date',balance_due:'Account statement balance',inspection_date:'Confirmed inspection date',
 inspection_time:'Confirmed local time',inspection_type:'Physical or virtual',booking_ref:'Confirmed booking reference',
 account_officer:'Assigned Landshop officer',officer_contact:'Verified staff contact',staff_owner:'Assigned Landshop officer',
 staff_phone:'Verified staff contact',due_date:'Contractual due date',contract_year:'Contract year',
 annual_rate:'Contractual rate',equity_rate:'Signed equity requirement',payment_period:'Approved payment period',
 investment_status:'Verified investment status',reporting_period:'Approved reporting period',
 document_stage:'Verified document milestone',loan_status:'Verified lender status',milestone:'Verified payment milestone',
 allocation_ref:'Approved allocation reference',estimate:'Illustrative estimate',
};
function personalize(value:string){return value.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi,(_all,key:string)=>sample[key]||'Pending verification');}
function safeCsv(value:unknown){const raw=String(value??'');const v=/^\s*[=+\-@]/.test(raw)?"'"+raw:raw;return '"'+v.replaceAll('"','""')+'"';}
function escapeHtml(value:unknown){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char));}
function downloadBlob(filename:string,blob:Blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function channelIcon(channel:Channel){
 if(channel==='Email')return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#364D5D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>;
 if(channel==='WhatsApp')return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#25D366"/><path fill="#fff" d="M9.2 24.2 10.4 20a9 9 0 1 1 3.5 3.2zm7-15.8a7.6 7.6 0 0 0-6.5 11.4l.3.5-.8 2.8 2.9-.8.5.3a7.6 7.6 0 1 0 3.6-14.8zm-4 4.2c.1-.3.4-.5.6-.5h.5c.2 0 .4.1.5.5l.9 2.2c.1.2.1.4-.1.7l-.5.7c-.1.1-.2.3-.1.5.4.8 1.5 2 2.8 2.6.2.1.4.1.5-.1l.9-1c.2-.2.4-.2.6-.1l2 1c.3.2.4.3.3.5l-.2 1c-.1.5-1.2 1.1-1.8 1.2-1 .1-2.7-.5-4.8-2.4-2.2-2-3.1-3.9-3-5.1.1-.4.5-1.1.9-1.5z"/></svg>;
 return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#364D5D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M7 9h10M7 13h7"/></svg>;
}
function channelClass(channel:Channel){return channel.toLowerCase();}
function inJourney(t:Scenario,j:Journey){return t.flow===j||(t.flow==='Both'&&(j==='Xtra'||j==='Beta'))}
export default function CommunicationCenter({runs,evidenceAvailable}:{runs:Run[];evidenceAvailable:boolean}){
 const [tab,setTab]=useState<Tab>('journeys');
 const [journey,setJourney]=useState<Journey>('Xtra');
 const [stageId,setStageId]=useState('xc');
 const [templateId,setTemplateId]=useState('C01');
 const [channel,setChannel]=useState<Channel>('Email');
 const [query,setQuery]=useState('');
 const [typeFilter,setTypeFilter]=useState('All');
 const [reviewed,setReviewed]=useState<string[]>([]);
 const [runSelected,setRunSelected]=useState<string[]>([]);
 const [runFilter,setRunFilter]=useState('');
 const [exportScope,setExportScope]=useState<'one'|'selected'|'all'>('all');
 const [exportFormat,setExportFormat]=useState<'csv'|'html'|'xlsx'|'docx'|'pdf'>('csv');
 const [notice,setNotice]=useState('');
 const [savingDraft,setSavingDraft]=useState(false);
 const flow=catalog.flows[journey];
 const stages=flow as typeof catalog.flows.Xtra;
 const stage=(stages as unknown as Array<{id:string;name:string;phase:string;note:string;next:string;templates:string[]}>).find(s=>s.id===stageId)||stages[0];
 const template=catalog.templates.find(t=>t.id===templateId)||catalog.templates[0];
 const templates=useMemo(()=>catalog.templates.filter(t=>inJourney(t,journey)&&
   (typeFilter==='All'||t.intent===typeFilter)&&
   (t.title+' '+t.stage+' '+t.body+' '+t.source).toLowerCase().includes(query.toLowerCase())),[journey,query,typeFilter]);
 const filteredRuns=useMemo(()=>runs.filter(r=>(r.workflow+' '+r.status+' '+r.id).toLowerCase().includes(runFilter.toLowerCase())),[runs,runFilter]);
 function pickJourney(j:Journey){setJourney(j);const f=catalog.flows[j] as Array<{id:string}>;setStageId(f[0]?.id||'');setTemplateId(catalog.templates.find(t=>inJourney(t,j))?.id||'C01');setChannel('Email');setQuery('');setTypeFilter('All')}
 function openTemplate(id:string){setTemplateId(id);setChannel('Email');setTab('templates')}
 function toggleReview(id:string){setReviewed(items=>items.includes(id)?items.filter(x=>x!==id):[...items,id])}
 function toggleRun(id:string){setRunSelected(items=>items.includes(id)?items.filter(x=>x!==id):[...items,id])}
 const rows=filteredRuns.map(r=>({Run_ID:r.id,Timestamp_UTC:r.started_at,Workflow:r.workflow,Mode:r.mode,Status:r.status,
   Channel:'Not reported by workflow run',Geography:'Unavailable in this source',Customer_Intent:'Unavailable in this source'}));
 function chosenRows(){if(exportScope==='all')return rows;if(exportScope==='one')return rows.slice(0,1);return rows.filter(row=>runSelected.includes(row.Run_ID))}
 async function createManualDraft(){
  if(savingDraft)return;
  setSavingDraft(true);
  try{
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!key)throw Error('The authorized automation database is not configured.');
   const db=createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'}});
   const nodes=[
    {id:'com-trigger',type:'trigger',label:'Verified '+template.stage,x:80,y:160,config:{event:'communication.source_event',notes:template.id}},
    {id:'com-check',type:'condition',label:'Validate consent and business event',x:300,y:160,config:{notes:template.gate.slice(0,260)}},
    {id:'com-approval',type:'approval',label:'Authorize communication template',x:540,y:160,config:{approvalRole:template.intent==='Marketing'?'Marketing':'Operations'}},
    {id:'com-message',type:'notification',label:template.title.slice(0,78),x:780,y:160,config:{channel:'email',notes:'Template '+template.id+' · draft only · provider disabled'}},
    {id:'com-end',type:'end',label:'Audit and complete',x:1020,y:160,config:{notes:'Delivery requires separate authorized activation'}}
   ];
   const edges=nodes.slice(1).map((n,i)=>({from:nodes[i].id,to:n.id}));
   const {data,error}=await db.rpc('landshop_automation_create',{p_name:(template.id+' · '+template.title).slice(0,100),p_description:'Landshop communication draft: '+template.stage+' | '+template.timing+' | '+template.gate,p_graph:{nodes,edges}});
   if(error||!data)throw Error('Not saved. '+(error?.message||'Management authorization required.'));
   setNotice('Saved draft '+String(data).slice(0,8)+' in NEXUS. No email, SMS or WhatsApp was sent. Open the builder to inspect it.');
  }catch(e){setNotice(e instanceof Error?e.message:'Draft could not be saved.');}
  finally{setSavingDraft(false);}
 }
 function exportReport(){
  const selected=chosenRows();if(!selected.length){setNotice('No authorized records available for this export.');return}
  const date=new Date().toISOString().slice(0,10),base='landshop-communication-runs-'+date;
  const headers=Object.keys(selected[0]) as Array<keyof typeof selected[number]>;
  if(exportFormat==='csv'){
   const csv=[headers.map(safeCsv).join(','),...selected.map(row=>headers.map(h=>safeCsv(row[h])).join(','))].join('\r\n');
   downloadBlob(base+'.csv',new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
  }else if(exportFormat==='xlsx'){
   downloadBlob(base+'.xlsx',new Blob([new Uint8Array(excelWorkbook(selected))],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  }else if(exportFormat==='docx'){
   downloadBlob(base+'.docx',new Blob([new Uint8Array(wordDocument(selected,'Landshop Communication Run Records'))],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
  }else{
   const body='<html><head><meta charset="utf-8"><title>Landshop Communications Report</title><style>body{font:14px Arial;color:#073f34;padding:25px}th,td{border:1px solid #ccc;padding:8px;text-align:left}table{border-collapse:collapse;width:100%}h1{font-size:22px}</style></head><body><h1>Landshop Communication Run Records</h1><p>Verified workflow run metadata. Channel, geography and customer intent are not available in this source.</p><table><thead><tr>'+
   headers.map(h=>'<th>'+escapeHtml(h)+'</th>').join('')+'</tr></thead><tbody>'+
   selected.map(row=>'<tr>'+headers.map(h=>'<td>'+escapeHtml(row[h])+'</td>').join('')+'</tr>').join('')+'</tbody></table></body></html>';
   if(exportFormat==='html')downloadBlob(base+'.html',new Blob([body],{type:'text/html;charset=utf-8'}));
   else{const printWindow=window.open('','_blank');if(!printWindow){setNotice('Please allow the print window for PDF export.');return}printWindow.document.write(body);printWindow.document.close();printWindow.focus();printWindow.print();}
  }
  setNotice('Prepared '+selected.length+' authorized run record(s). No synthetic activity exported.');
 }
 const countForJourney=catalog.templates.filter(t=>inJourney(t,journey)).length;
 return <main className="comm-center">
  <header className="comm-top"><div className="comm-top-inner">
   <Link href="/admin" className="comm-back">← Command Center</Link>
   <div className="comm-identity"><img src="/media/logo.webp" alt="Official Landshop logo" width={105} height={52}/><div><strong>Enterprise Communications</strong><span>Internal management workspace · six product journeys</span></div></div>
   <div className="comm-top-actions"><span className="comm-lock">Management only · Sending disabled</span><Link href="/admin/automation" className="comm-builder">Open NEXUS Builder ↗</Link></div>
  </div></header>
  <div className="comm-container">
   <section className="comm-hero"><div><small>LANDSHOP · COMMUNICATION OPERATIONS</small><h1>Every customer moment, connected.</h1>
    <p>One unified experience for mortgage, investment, onboarding and property development. Review 70 event-based messages, follow decision branches and inspect authorized workflow run records.</p>
    <p className="comm-warning">Draft review and real workflow run visibility only. Provider sends, legal notices and unverified financial events remain disabled.</p></div>
    <div className="comm-stats"><div><strong>6</strong><span>Product journeys</span></div><div><strong>70</strong><span>Message scenarios</span></div><div><strong>{runs.length}</strong><span>Recorded run entries</span></div><div><strong>{reviewed.length}</strong><span>Templates reviewed locally</span></div></div></section>
   <nav className="comm-tabs" aria-label="Communication workspace sections">
    {([['journeys','Workflow canvas'],['templates','Email & message studio'],['reporting','Management reporting'],['exports','Exports & manual automation'],['safeguards','Approval gates']] as [Tab,string][]).map(([id,label])=><button type="button" key={id} className={tab===id?'active':''} onClick={()=>setTab(id)} aria-current={tab===id?'page':undefined}>{label}</button>)}
   </nav>
   {tab==='journeys'&&<div className="comm-panel">
    <div className="comm-titleline"><div><h2>Six connected customer journeys</h2><p>Select a product and click any stage to review the conditions and outgoing messages.</p></div><span className="comm-label">{countForJourney} matching messages</span></div>
    <div className="comm-journey-tabs">{journeyNames.map(j=><button key={j} className={journey===j?'active':''} onClick={()=>pickJourney(j)}>{labels[j]}</button>)}</div>
    <div className="comm-two"><div className="comm-phase-list">{[...new Set(stages.map(s=>s.phase))].map(phase=><div key={phase} className="comm-phase"><h3>{phase}</h3><div className="comm-stage-grid">{stages.filter(s=>s.phase===phase).map(s=><button key={s.id} onClick={()=>setStageId(s.id)} className={'comm-stage '+(stage.id===s.id?'active ':'')+(s.type==='bad'?'danger':'')}><b>{s.name}</b><small>{s.templates.length} linked messages</small></button>)}</div></div>)}</div>
     <aside className="comm-stage-detail"><small>SELECTED WORKFLOW STAGE</small><h2>{stage.name}</h2><p>{stage.note}</p><h4>Next action</h4><p>{stage.next}</p><h4>Connected templates</h4>{stage.templates.length?stage.templates.map(id=>{const t=catalog.templates.find(v=>v.id===id);return t?<button className="comm-linked" key={id} onClick={()=>openTemplate(id)}>{t.title}<span>View →</span></button>:null}):<p>This is a process stage. No outbound message is scheduled at this step.</p>}</aside>
    </div></div>}
   {tab==='templates'&&<div className="comm-panel">
    <div className="comm-titleline"><div><h2>Branded messaging studio</h2><p>Official Landshop logo, genuine archive photography, personal greetings, footer contacts and channel-specific content.</p></div><span className="comm-label">{reviewed.length} of 70 reviewed</span></div>
    <div className="comm-controls"><label>Journey<select value={journey} onChange={e=>pickJourney(e.target.value as Journey)}>{journeyNames.map(j=><option key={j} value={j}>{labels[j]}</option>)}</select></label><label>Message type<select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option>All</option><option>Transactional</option><option>Marketing</option></select></label><label className="comm-search">Search<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search scenarios, events or content"/></label></div>
    <div className="comm-library"><div className="comm-list">{templates.length?templates.map(t=><button className={template.id===t.id?'active':''} key={t.id} onClick={()=>{setTemplateId(t.id);setChannel('Email')}}><small>{t.id} · {t.flow} · {t.intent}</small><strong>{t.title}</strong><span>{t.stage}</span></button>):<p>No messages match this filter.</p>}</div>
     <div className="comm-preview"><div className="comm-templatehead"><div><small>{template.id} · {template.source}</small><h3>{template.title}</h3><p>{template.timing}</p></div><div className="comm-channels">{(['Email','WhatsApp','SMS'] as Channel[]).filter(ch=>template.channels.includes(ch)).map(ch=><button key={ch} className={(channel===ch?'active ':'')+channelClass(ch)} onClick={()=>setChannel(ch)}>{channelIcon(ch)} {ch}</button>)}</div></div>
      {channel==='Email'?<div className="comm-email"><div className="comm-email-head"><img src="/media/logo.webp" alt="Landshop logo" width={132} height={60}/><span>{labels[journey]} · Customer Experience</span></div>
       <div className="comm-email-photo"><img src={photos[journey]} alt="Illustrative photograph from the Landshop property archive" loading="lazy"/><small>Illustrative Landshop photo archive. Production messages use only verified, property-matched imagery.</small></div>
       <div className="comm-email-body"><small>LANDSHOP CUSTOMER UPDATE</small><h2>{personalize(template.subject)}</h2><p className="comm-email-copy">{personalize(template.body)}</p>
        <a href="https://www.landshopnigeria.com" onClick={e=>e.preventDefault()} className="comm-email-button">View your secure Landshop account</a><p className="comm-email-tip">Preview only. No message is being transmitted.</p></div>
       <footer className="comm-email-footer"><img src="/media/logo.webp" alt="Landshop logo" width={102} height={45}/><strong>Landshop Limited</strong><p>Suite 1, 3rd Floor, King's Deck, Alternative Route, Chevron Drive, Lekki-Epe Expressway, Lagos, Nigeria.</p><p>Phone: +234 1 888 0063 · WhatsApp: +234 818 886 6772<br/>Email: care@landshopnigeria.com · www.landshopnigeria.com</p><p>{template.intent==='Marketing'?'Preferences and unsubscribe link supplied by the real messaging provider.':'Official notifications never request passwords, OTPs or unverified account transfers.'}</p><small>© {new Date().getFullYear()} Landshop Limited. All rights reserved.</small></footer>
      </div>:<div className={'comm-message '+(channel==='WhatsApp'?'comm-wa':'comm-sms')}><div className="comm-message-header">{channel==='WhatsApp'?'WhatsApp Business · Landshop':'Landshop SMS'}</div><p>{personalize(channel==='WhatsApp'?template.wa:template.sms)}</p><small>Channel preview only. Actual delivery requires opt-in and provider verification.</small></div>}
      <div className="comm-message-meta"><div><b>Trigger</b><span>{template.stage}</span></div><div><b>Required check</b><span>{template.gate}</span></div><div><b>Timing</b><span>{template.timing}</span></div></div>
      <div className="comm-actions"><button onClick={()=>toggleReview(template.id)}>{reviewed.includes(template.id)?'✓ Reviewed · Undo':'Mark reviewed'}</button><button disabled={savingDraft} onClick={()=>void createManualDraft()}>{savingDraft?'Saving draft…':'Create NEXUS draft from template'}</button><button onClick={()=>{const body=channel==='Email'?template.subject+'\n\n'+template.body:channel==='WhatsApp'?template.wa:template.sms;navigator.clipboard?.writeText(body);setNotice('Template text copied for review.')}}>Copy message draft</button></div>
     </div></div></div>}
   {tab==='reporting'&&<div className="comm-panel"><div className="comm-titleline"><div><h2>Actual Command Center workflow activity</h2><p>Records read from authorized automation runs. No synthetic delivery, location, customer identity or conversion figures.</p></div><span className="comm-label">{runs.length} recent entries · max 200</span></div>
    {!evidenceAvailable?<p className="comm-warning">Live workflow run records are currently unavailable for this role. This is not a zero-activity claim.</p>:null}
    <div className="comm-stats small"><div><strong>{runs.filter(r=>r.status==='completed').length}</strong><span>Completed runs</span></div><div><strong>{runs.filter(r=>r.status==='running').length}</strong><span>Running</span></div><div><strong>{runs.filter(r=>/fail|error/i.test(r.status)).length}</strong><span>Failed</span></div><div><strong>{runs.filter(r=>r.mode==='rehearsal').length}</strong><span>Rehearsals</span></div></div>
    <div className="comm-table-wrap"><table><thead><tr><th>Timestamp (UTC)</th><th>Workflow</th><th>Mode</th><th>Status</th><th>Run reference</th></tr></thead><tbody>{runs.map(r=><tr key={r.id}><td>{r.started_at}</td><td>{r.workflow}</td><td>{r.mode}</td><td>{r.status}</td><td>{r.id.slice(0,12)}</td></tr>)}{runs.length===0?<tr><td colSpan={5}>No authorized workflow run records currently available.</td></tr>:null}</tbody></table></div>
    <p className="comm-footnote">Future message delivery reports require a verified provider-event ledger containing consented channel, acceptance, delivery, click, bounce, reply, location where lawfully available, and source event. Email-open pixels are unreliable and are not treated as proof of reading.</p>
   </div>}
   {tab==='exports'&&<div className="comm-panel"><div className="comm-titleline"><div><h2>Selective data exports & manual automation</h2><p>Export one record, selected records, or all authorized records loaded by this workspace.</p></div><Link href="/admin/automation" className="comm-builder">Open manual workflow builder →</Link></div>
    <div className="comm-two"><div><div className="comm-controls"><label>Search recorded runs<input value={runFilter} onChange={e=>setRunFilter(e.target.value)} placeholder="Workflow, status, reference"/></label><label>Scope<select value={exportScope} onChange={e=>setExportScope(e.target.value as 'one'|'selected'|'all')}><option value="one">One filtered record</option><option value="selected">Checked records only</option><option value="all">All filtered records</option></select></label><label>Format<select value={exportFormat} onChange={e=>setExportFormat(e.target.value as typeof exportFormat)}><option value="csv">CSV</option><option value="html">HTML</option><option value="xlsx">Excel (.xlsx)</option><option value="docx">Microsoft Word (.docx)</option><option value="pdf">Print / Save PDF</option></select></label></div>
      <div className="comm-checklist">{filteredRuns.slice(0,200).map(r=><label key={r.id}><input type="checkbox" checked={runSelected.includes(r.id)} onChange={()=>toggleRun(r.id)}/><span>{r.started_at} · {r.workflow} · {r.status}</span></label>)}{!filteredRuns.length?<p>No available records for this filter.</p>:null}</div>
      <div className="comm-actions"><button onClick={exportReport}>Export verified records</button><span>{runSelected.length} selected</span></div></div>
      <aside className="comm-stage-detail"><h3>Manual automation connection</h3><p>Build and test custom workflows inside the existing NEXUS workflow builder. Approved templates and channels remain separate from provider activation.</p><Link href="/admin/automation" className="comm-linked">Go to existing manual automation studio <span>Open →</span></Link><h4>Recorded export fields</h4><p>Timestamp, workflow, execution mode, status and run reference. Contact identity, geographic inference and messaging intent will only appear after a properly authorized event ledger is implemented.</p><h4>Security</h4><p>Exports are scoped to records returned under management access and database policies. No credential or service-role key is included.</p></aside></div>
   </div>}
   {tab==='safeguards'&&<div className="comm-panel"><div className="comm-titleline"><div><h2>Source details & implementation approval gates</h2><p>Terms and communications must be verified before they become customer-facing or executable.</p></div><span className="comm-label">{catalog.assumptions.length} outstanding source questions</span></div>
    <div className="comm-approval"><div><h3>Requirements before sending</h3><p>Verified provider credentials and sender domain, consent records, approved WhatsApp templates, audited message outbox and idempotency, financial reconciliation, legal sign-off for notices, and management QA.</p><p>Anonymous visits cannot be used to discover a person's email address. Opt-outs and stop conditions must be respected.</p></div><div><h3>Source terminology</h3><p>The uploaded graphic was titled Invest but its filename said Incubate. Both labels are preserved pending product-team confirmation.</p><p>The seven original Word communication themes are included among the 70 scenarios, with historical payment amounts removed.</p></div></div>
    <div className="comm-issues">{catalog.assumptions.map((a,i)=><details key={i}><summary>{a[0]} · {a[1]}</summary><p>{a[2]}</p><small>Approval owner: {a[3]}</small></details>)}</div>
   </div>}
   {notice&&<p role="status" className="comm-notice">{notice}</p>}
  </div>
 </main>;
}
