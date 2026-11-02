'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '@supabase/ssr';
import {excelWorkbook,wordDocument} from '../../reports/export-openxml';
import './delivery.css';

export type DeliveryChannel={channel:string;provider:string;enabled:boolean;updated_at:string};
export type DeliveryRule={id:string;event_type:string;product:string|null;template_id:string;channel:string;purpose:string;enabled:boolean;delay_seconds:number;whatsapp_template_name:string|null;whatsapp_language:string};
export type DeliveryMessage={id:string;contact_id:string;event_id:string;channel:string;template_id:string;purpose:string;status:string;attempts:number;available_at:string;provider_message_id:string|null;last_error:string|null;created_at:string;accepted_at:string|null;delivered_at:string|null};
export type DeliveryTemplate={id:string;subject:string;state:string};
export type DeliveryEvent={id:string;outbox_id:string;event_name:string;occurred_at:string};
const knownEvents=['contact_submitted','inspection_requested','inspection_confirmed','application_received','payment_verified','marketing_opted_in','mortgage_estimate_requested','loan_approved','contract_signed','allocation_confirmed','investment_statement_approved'];
const db=()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',secure:true,sameSite:'lax'}});
function save(filename:string,content:BlobPart,mime:string){const uri=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.download=filename;a.href=uri;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(uri),1500);}
const csvField=(x:unknown)=>{const s=String(x??'');return '"'+(/^\s*[=+@\-]/.test(s)?"'"+s:s).replaceAll('"','""')+'"';};
const esc=(x:unknown)=>String(x??'').replace(/[&<>"']/g,z=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[z]||z));
export default function DispatchCenter({channels:initialChannels,rules:initialRules,messages:initialMessages,templates,events,ready}:{channels:DeliveryChannel[];rules:DeliveryRule[];messages:DeliveryMessage[];templates:DeliveryTemplate[];events:DeliveryEvent[];ready:boolean}){
 const [channels,setChannels]=useState(initialChannels),[rules,setRules]=useState(initialRules),[messages,setMessages]=useState(initialMessages);
 const [active,setActive]=useState<'rules'|'ledger'|'channels'>('ledger');
 const [busy,setBusy]=useState(''),[notice,setNotice]=useState('');
 const [channelFilter,setChannelFilter]=useState('all'),[statusFilter,setStatusFilter]=useState('all');
 const [selected,setSelected]=useState<string[]>([]),[scope,setScope]=useState<'one'|'selected'|'all'>('all');
 const [format,setFormat]=useState<'csv'|'xlsx'|'docx'|'html'|'pdf'>('csv');
 const [eventType,setEventType]=useState('contact_submitted'),[templateId,setTemplateId]=useState('T00'),[newChannel,setNewChannel]=useState('email');
 const [newPurpose,setNewPurpose]=useState('transactional'),[delay,setDelay]=useState(0),[waName,setWaName]=useState('');
 const filtered=useMemo(()=>messages.filter(m=>(channelFilter==='all'||m.channel===channelFilter)&&(statusFilter==='all'||m.status===statusFilter)),[messages,channelFilter,statusFilter]);
 const approved=useMemo(()=>new Map(templates.map(t=>[t.id,t.state==='approved'])),[templates]);
 const eventCounts=useMemo(()=>{const m=new Map<string,number>();events.forEach(e=>m.set(e.event_name,(m.get(e.event_name)||0)+1));return m},[events]);
 async function changeChannel(channel:string,enabled:boolean){
  if(enabled&&!window.confirm('Enable '+channel+' only after verifying the provider credentials and sender approval in the protected production environment. Continue?'))return;
  setBusy(channel);setNotice('');
  const {error}=await db().from('landshop_comm_channels').update({enabled,updated_at:new Date().toISOString()}).eq('channel',channel);
  setBusy('');
  if(error)setNotice('Channel update rejected: '+error.message);else{setChannels(v=>v.map(c=>c.channel===channel?{...c,enabled}:c));setNotice('Saved '+channel+' channel setting. This alone does not authorize external sending.')}
 }
 async function changeRule(id:string,enabled:boolean){
  const rule=rules.find(r=>r.id===id);if(!rule)return;
  if(enabled&&!approved.get(rule.template_id)){setNotice('Approve this message template first.');return}
  if(enabled&&rule.channel==='whatsapp'&&!rule.whatsapp_template_name){setNotice('WhatsApp requires a provider-approved template name.');return}
  if(enabled&&!window.confirm('Activate this exact customer-event rule? Channel authorization and server credentials are checked again before any sending.'))return;
  setBusy(id);setNotice('');
  const {error}=await db().from('landshop_comm_delivery_rules').update({enabled,updated_at:new Date().toISOString()}).eq('id',id);
  setBusy('');
  if(error)setNotice('Rule update rejected: '+error.message);else{setRules(v=>v.map(r=>r.id===id?{...r,enabled}:r));setNotice('Rule saved. External sending remains governed by worker configuration and customer consent.')}
 }
 async function createRule(){
  if(!approved.get(templateId)){setNotice('Selected template is not approved. Approve its text before creating a delivery rule.');return}
  if(newChannel==='whatsapp'&&!/^[a-z0-9_]{3,120}$/.test(waName)){setNotice('Enter the exact Meta-approved WhatsApp template name.');return}
  if(newPurpose==='marketing'){setNotice('Marketing automation requires a verified unsubscribe workflow. It is not yet activated.');return}
  setBusy('create');setNotice('');
  const payload={event_type:eventType,template_id:templateId,channel:newChannel,purpose:newPurpose,enabled:false,delay_seconds:delay,whatsapp_template_name:newChannel==='whatsapp'?waName:null};
  const {data,error}=await db().from('landshop_comm_delivery_rules').insert(payload).select('id,event_type,product,template_id,channel,purpose,enabled,delay_seconds,whatsapp_template_name,whatsapp_language').single();
  setBusy('');if(error)setNotice('Rule was not created: '+error.message);else{setRules(v=>[data as DeliveryRule,...v]);setNotice('Rule created in paused state for management verification.')}
 }
 async function cancelMessage(id:string){
  if(!window.confirm('Cancel this queued message? This action stops pending delivery only; an accepted provider message cannot be recalled.'))return;
  setBusy(id);setNotice('');
  const {data,error}=await db().from('landshop_comm_outbox').update({status:'cancelled',updated_at:new Date().toISOString()})
   .eq('id',id).in('status',['queued','retry','uncertain']).select('id').maybeSingle();
  setBusy('');
  if(error||!data)setNotice('Message could not be cancelled. It may already be in progress or was sent.');
  else{setMessages(v=>v.map(m=>m.id===id?{...m,status:'cancelled'}:m));setNotice('Message cancelled and retained in the audit ledger.')}
 }
 async function exportDelivery(){
  const chosen=scope==='all'?filtered:scope==='selected'?filtered.filter(m=>selected.includes(m.id)):filtered.slice(0,1);
  if(!chosen.length){setNotice('No records matched the export selection.');return}
  const records=chosen.map(m=>({id:m.id,created_utc:m.created_at,available_utc:m.available_at,
    channel:m.channel,template:m.template_id,purpose:m.purpose,status:m.status,attempts:m.attempts,
    provider_reference:m.provider_message_id||'',last_error:m.last_error||'',
    accepted_utc:m.accepted_at||'',delivered_utc:m.delivered_at||'',provider_updates:eventCounts.get(m.id)||0}));
  const name='landshop-delivery-'+new Date().toISOString().slice(0,10),headers=Object.keys(records[0]) as Array<keyof typeof records[0]>;
  if(format==='csv')save(name+'.csv','\ufeff'+[headers.map(csvField).join(','),...records.map(row=>headers.map(h=>csvField(row[h])).join(','))].join('\r\n'),'text/csv;charset=utf-8');
  else if(format==='xlsx')save(name+'.xlsx',new Uint8Array(excelWorkbook(records)),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  else if(format==='docx')save(name+'.docx',new Uint8Array(wordDocument(records,'Landshop Communication Delivery Ledger')),'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  else{
   const report='<html><head><meta charset="utf-8"><title>Landshop Delivery Report</title></head><body style="font:13px Arial"><h1>Landshop delivery ledger</h1><p>Provider accepted does not imply delivered. Last 200 authorized rows.</p><table border="1" cellspacing="0" cellpadding="6"><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr>'+records.map(row=>'<tr>'+headers.map(h=>'<td>'+esc(row[h])+'</td>').join('')+'</tr>').join('')+'</table></body></html>';
   if(format==='html')save(name+'.html',report,'text/html');
   else{const popup=window.open('','_blank');if(!popup){setNotice('Allow the print window to save PDF.');return}popup.document.write(report);popup.document.close();popup.focus();popup.print();}
  }
  setNotice('Prepared '+records.length+' ledger record(s) without including API keys or message bodies.');
 }
 return <main className="comm-delivery">
  <header className="comm-delivery-hero"><div><Link href="/admin/communications">← Enterprise Communications</Link><h1>Outbound Delivery Control</h1><p>Internal-only provider delivery orchestration, individual approvals, contact permissions and immutable message history.</p></div><span>Provider dispatch requires private production authorization</span></header>
  {!ready&&<p role="alert" className="comm-delivery-warning">One or more delivery tables could not be read. Do not treat these figures as confirmed.</p>}
  <p className="comm-delivery-warning">Changing a setting here does not create a provider credential. A delivery is attempted only when the server dispatcher, channel credentials, contact consent, exact event and message rule have all passed their checks. The exposed legacy service key must be rotated before dispatch can be enabled.</p>
  <div className="comm-delivery-metrics">{[['Channels enabled',channels.filter(c=>c.enabled).length],['Approved rules enabled',rules.filter(r=>r.enabled).length],['Queued',messages.filter(m=>m.status==='queued').length],['Provider accepted',messages.filter(m=>m.status==='accepted').length],['Delivered',messages.filter(m=>m.status==='delivered').length],['Needs review',messages.filter(m=>m.status==='uncertain'||m.status==='failed').length]].map(([label,n])=><div key={label}><b>{n}</b><small>{label}</small></div>)}</div>
  <nav className="comm-delivery-tabs">{([['ledger','Delivery ledger'],['rules','Event-to-message rules'],['channels','Provider channels']] as const).map(([v,title])=><button key={v} className={active===v?'active':''} onClick={()=>setActive(v)}>{title}</button>)}</nav>
  {active==='ledger'&&<section className="comm-delivery-card"><div className="comm-delivery-toolbar"><label>Channel<select value={channelFilter} onChange={e=>setChannelFilter(e.target.value)}><option value="all">All</option>{channels.map(c=><option key={c.channel}>{c.channel}</option>)}</select></label><label>Status<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All</option>{['queued','leased','retry','accepted','delivered','uncertain','failed','suppressed','cancelled'].map(s=><option key={s}>{s}</option>)}</select></label><label>Export scope<select value={scope} onChange={e=>setScope(e.target.value as typeof scope)}><option value="one">First filtered</option><option value="selected">Selected</option><option value="all">All filtered</option></select></label><label>Format<select value={format} onChange={e=>setFormat(e.target.value as typeof format)}><option value="csv">CSV</option><option value="xlsx">Excel</option><option value="docx">Word</option><option value="html">HTML</option><option value="pdf">Print/PDF</option></select></label><button onClick={()=>void exportDelivery()}>Export</button></div>
   <div className="comm-delivery-overflow"><table><thead><tr><th>Select</th><th>UTC</th><th>Channel</th><th>Template</th><th>Status</th><th>Attempts</th><th>Provider reference</th><th>Actions</th></tr></thead><tbody>{filtered.map(m=><tr key={m.id}><td><input aria-label={'Select '+m.id} type="checkbox" checked={selected.includes(m.id)} onChange={()=>setSelected(a=>a.includes(m.id)?a.filter(v=>v!==m.id):[...a,m.id])}/></td><td>{m.created_at}</td><td>{m.channel}</td><td>{m.template_id}</td><td><span className={'comm-delivery-status '+m.status}>{m.status}</span></td><td>{m.attempts}</td><td>{m.provider_message_id?.slice(0,24)||'Not accepted'}</td><td>{['queued','retry','uncertain'].includes(m.status)&&<button disabled={busy===m.id} onClick={()=>void cancelMessage(m.id)}>Cancel</button>}</td></tr>)}{filtered.length===0&&<tr><td colSpan={8}>No verified outbound messages for this filter.</td></tr>}</tbody></table></div><p>Messages accepted by a provider are not marked delivered until an authentic delivery receipt is recorded. Uncertain outcomes are held for investigation and cannot auto-retry.</p>
  </section>}
  {active==='rules'&&<section className="comm-delivery-card"><h2>Automatic event rules</h2><p>One verified customer action can produce different communications in approved channels. All new rules start disabled.</p>
   <div className="comm-delivery-overflow"><table><thead><tr><th>Event</th><th>Template</th><th>Channel</th><th>Purpose</th><th>Delay</th><th>Provider template</th><th>Approval</th><th>Enabled</th></tr></thead><tbody>{rules.map(r=><tr key={r.id}><td>{r.event_type}</td><td>{r.template_id}</td><td>{r.channel}</td><td>{r.purpose}</td><td>{r.delay_seconds}s</td><td>{r.whatsapp_template_name||'None'}</td><td>{approved.get(r.template_id)?'Approved':'Draft / suspended'}</td><td><input type="checkbox" checked={r.enabled} disabled={busy===r.id} onChange={e=>void changeRule(r.id,e.target.checked)}/></td></tr>)}{!rules.length&&<tr><td colSpan={8}>No event rules configured.</td></tr>}</tbody></table></div>
   <h3>Create a paused rule</h3><div className="comm-delivery-toolbar"><label>Verified source event<select value={eventType} onChange={e=>setEventType(e.target.value)}>{knownEvents.map(v=><option key={v}>{v}</option>)}</select></label><label>Approved message<select value={templateId} onChange={e=>setTemplateId(e.target.value)}>{templates.map(t=><option key={t.id} value={t.id}>{t.id} · {t.subject} ({t.state})</option>)}</select></label><label>Channel<select value={newChannel} onChange={e=>setNewChannel(e.target.value)}>{channels.map(c=><option key={c.channel}>{c.channel}</option>)}</select></label><label>Purpose<select value={newPurpose} onChange={e=>setNewPurpose(e.target.value)}><option value="transactional">Transactional</option><option value="marketing">Marketing</option></select></label><label>Delay (seconds)<input type="number" min={0} max={2592000} value={delay} onChange={e=>setDelay(Number(e.target.value))}/></label>{newChannel==='whatsapp'&&<label>Approved Meta template name<input value={waName} onChange={e=>setWaName(e.target.value.toLowerCase())} placeholder="landshop_enquiry_received"/></label>}<button disabled={busy==='create'} onClick={()=>void createRule()}>Save paused rule</button></div>
  </section>}
  {active==='channels'&&<section className="comm-delivery-card"><h2>Channel authorization</h2><p>The channel database flag is one of several independent safety gates. Confirm a verified sender, platform approval, current protected credentials and rotation of the previously exposed Supabase key before enabling.</p><div className="comm-delivery-cards">{channels.map(c=><article key={c.channel}><h3>{c.channel.toUpperCase()}</h3><p>{c.provider==='postmark'?'Postmark transactional server and authenticated sender':c.provider==='meta_cloud'?'Official Meta WhatsApp Cloud API with approved message template':'Termii sender ID and service credentials'}</p><div><strong>{c.enabled?'Allowed by database':'Paused in database'}</strong><label><input type="checkbox" checked={c.enabled} disabled={busy===c.channel} onChange={e=>void changeChannel(c.channel,e.target.checked)}/> Enable only after provider checks</label></div></article>)}</div><p>For provider authorization, go to your protected GitHub production environment settings. Do not store credentials in templates, browser fields, messages or screenshots.</p></section>}
  {notice&&<p role="status" className="comm-delivery-notice">{notice}</p>}
 </main>;
}