'use client';
import {useMemo,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {excelWorkbook,wordDocument} from '../reports/export-openxml';
import CommunicationImports from './CommunicationImports';
export type Contact={id:string;email:string;full_name:string|null;phone:string|null;product_interest:string|null;source:string;status:string;marketing_consent:boolean;whatsapp_opt_in:boolean;sms_opt_in:boolean;created_at:string};
export type Event={id:string;contact_id:string|null;event_type:string;product:string|null;source_type:string;stage:string|null;occurred_at:string};
export type Task={id:string;event_id:string;task_type:string;status:string;assigned_role:string;created_at:string};
export type Audit={id:string;category:string;action:string;record_count:number;created_at:string};
type Props={contacts:Contact[];events:Event[];tasks:Task[];audit:Audit[];ready:boolean};
const db=()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',secure:true,sameSite:'lax'}});
const safe=(x:unknown)=>String(x??'').replace(/[&<>"']/g,y=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[y]||y));
const csv=(x:unknown)=>{const s=String(x??'');return '"'+(/^\s*[=+\-@]/.test(s)?"'"+s:s).replaceAll('"','""')+'"'};
function download(n:string,m:string,content:BlobPart){const u=URL.createObjectURL(new Blob([content],{type:m}));const a=document.createElement('a');a.href=u;a.download=n;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}
export default function OperationsCenter({contacts:initial,events,tasks:original,audit,ready}:Props){
 const [contacts,setContacts]=useState(initial),[tasks,setTasks]=useState(original);
 const [group,setGroup]=useState<'events'|'contacts'|'tasks'>('events'),[query,setQuery]=useState('');
 const [marked,setMarked]=useState<string[]>([]),[scope,setScope]=useState<'one'|'selected'|'all'>('all');
 const [format,setFormat]=useState<'csv'|'xlsx'|'docx'|'html'|'pdf'>('xlsx');
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const names=useMemo(()=>new Map(contacts.map(c=>[c.id,c])),[contacts]);
 const data=useMemo(()=>{
  if(group==='contacts')return contacts.map(c=>({id:c.id,date:c.created_at,name:c.full_name||'',email:c.email,phone:c.phone||'',product:c.product_interest||'',source:c.source,status:c.status,email_opt_in:c.marketing_consent?'Yes':'No',whatsapp_opt_in:c.whatsapp_opt_in?'Yes':'No',sms_opt_in:c.sms_opt_in?'Yes':'No'}));
  if(group==='tasks')return tasks.map(t=>({id:t.id,date:t.created_at,action:t.task_type,team:t.assigned_role,status:t.status,event_id:t.event_id}));
  return events.map(e=>({id:e.id,date:e.occurred_at,action:e.event_type,product:e.product||'',stage:e.stage||'',contact:names.get(e.contact_id||'')?.full_name||'',email:names.get(e.contact_id||'')?.email||'',source:e.source_type,location:'Not collected',intent:e.event_type}));
 },[group,events,contacts,tasks,names]);
 const rows=data.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(query.toLowerCase())));
 const chosen=scope==='one'?rows.slice(0,1):scope==='selected'?rows.filter(r=>marked.includes(r.id)):rows;
 async function auditExport(num:number){try{const client=db();const {data:{user}}=await client.auth.getUser();if(user)await client.from('landshop_comm_import_audit').insert({actor_id:user.id,category:'exports',action:group+'_'+format,record_count:num})}catch{}}
 function exportData(){
  if(!chosen.length){setNotice('Select at least one record.');return}
  const headers=Object.keys(chosen[0]) as Array<keyof typeof chosen[number]>;const name='landshop-'+group+'-'+new Date().toISOString().slice(0,10);
  if(format==='csv')download(name+'.csv','text/csv;charset=utf-8','\ufeff'+[headers.map(csv).join(','),...chosen.map(r=>headers.map(h=>csv(r[h])).join(','))].join('\r\n'));
  else if(format==='xlsx')download(name+'.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',new Uint8Array(excelWorkbook(chosen)));
  else if(format==='docx')download(name+'.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',new Uint8Array(wordDocument(chosen,'Landshop '+group)));
  else{const page='<html><head><meta charset="utf-8"><title>Landshop '+safe(group)+'</title></head><body><h2>Landshop '+safe(group)+'</h2><table border="1"><thead><tr>'+headers.map(h=>'<th>'+safe(h)+'</th>').join('')+'</tr></thead><tbody>'+chosen.map(r=>'<tr>'+headers.map(h=>'<td>'+safe(r[h])+'</td>').join('')+'</tr>').join('')+'</tbody></table></body></html>';
   if(format==='html')download(name+'.html','text/html',page);
   else{const win=window.open('','_blank');if(!win){setNotice('Allow the PDF print popup.');return}win.document.write(page);win.document.close();win.print()}
  }
  setNotice('Exported '+chosen.length+' verified records.');void auditExport(chosen.length);
 }
 async function setContact(id:string,status:string){
  setBusy(true);try{const {data,error}=await db().from('landshop_comm_contacts').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();
   if(error||!data)throw Error(error?.message||'Update failed');setContacts(old=>old.map(c=>c.id===id?data as Contact:c));setNotice('Contact '+status);}
  catch(e){setNotice(e instanceof Error?e.message:'Contact update failed.')}finally{setBusy(false)}
 }
 async function deleteContact(id:string){
  if(contacts.find(c=>c.id===id)?.status!=='archived'){setNotice('Archive this contact before removal.');return}
  if(!confirm('Permanently remove contact details?'))return;
  setBusy(true);try{const {error}=await db().from('landshop_comm_contacts').delete().eq('id',id);if(error)throw Error(error.message);setContacts(old=>old.filter(c=>c.id!==id));setNotice('Contact removed.')}
  catch(e){setNotice(e instanceof Error?e.message:'Removal failed.')}finally{setBusy(false)}
 }
 async function setTask(id:string,status:string){
  setBusy(true);try{const client=db(),{data:{user}}=await client.auth.getUser();if(!user)throw Error('Sign-in required');
   const {data,error}=await client.from('landshop_comm_tasks').update({status,updated_at:new Date().toISOString(),updated_by:user.id}).eq('id',id).select('*').single();
   if(error||!data)throw Error(error?.message||'Task update failed');setTasks(old=>old.map(t=>t.id===id?data as Task:t));setNotice('Follow-up task updated.')}
  catch(e){setNotice(e instanceof Error?e.message:'Task update failed.')}finally{setBusy(false)}
 }
 return <section className="comm-panel"><div className="comm-titleline"><div><h2>Customer interactions and management actions</h2><p>Actual submitted enquiries, inspections, applications, verified payments and follow-up tasks. Contact details are never inferred from anonymous visitors.</p></div><span className="comm-label">{events.length} recorded events</span></div>
  {!ready&&<p className="comm-warning">Some live records could not be loaded for this management role.</p>}
  <div className="comm-stats small"><div><strong>{contacts.length}</strong><span>Known contacts</span></div><div><strong>{events.length}</strong><span>Recorded events</span></div><div><strong>{tasks.filter(t=>t.status==='review_required').length}</strong><span>Pending follow-ups</span></div><div><strong>{contacts.filter(c=>c.status==='active'&&c.marketing_consent).length}</strong><span>Consented contacts</span></div></div>
  <div className="comm-journey-tabs">{(['events','contacts','tasks'] as const).map(g=><button key={g} className={group===g?'active':''} onClick={()=>{setGroup(g);setMarked([]);setQuery('')}}>{g==='events'?'Activity ledger':g==='contacts'?'Contacts & suppression':'Automated follow-up queue'}</button>)}</div>
  <div className="comm-controls" style={{marginTop:16}}>
   <label className="comm-search">Filter<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, event, product, consent"/></label>
   <label>Export scope<select value={scope} onChange={e=>setScope(e.target.value as typeof scope)}><option value="one">One</option><option value="selected">Selected</option><option value="all">All filtered</option></select></label>
   <label>Format<select value={format} onChange={e=>setFormat(e.target.value as typeof format)}><option value="csv">CSV</option><option value="xlsx">Excel</option><option value="docx">Word</option><option value="html">HTML</option><option value="pdf">Print / PDF</option></select></label>
  </div>
  <div className="comm-table-wrap"><table><thead><tr><th>Select</th>{Object.keys(rows[0]||{status:'Status'}).map(h=><th key={h}>{h.replaceAll('_',' ')}</th>)}{group!=='events'&&<th>Manage</th>}</tr></thead><tbody>
   {rows.map(r=><tr key={r.id}><td><input type="checkbox" aria-label={'Select '+r.id} checked={marked.includes(r.id)} onChange={()=>setMarked(a=>a.includes(r.id)?a.filter(x=>x!==r.id):[...a,r.id])}/></td>{Object.values(r).map((v,i)=><td key={i}>{String(v||'').slice(0,160)}</td>)}
    {group==='contacts'&&<td><select disabled={busy} value={contacts.find(c=>c.id===r.id)?.status} onChange={e=>void setContact(r.id,e.target.value)}><option>active</option><option>suspended</option><option>archived</option></select><button disabled={busy||contacts.find(c=>c.id===r.id)?.status!=='archived'} onClick={()=>void deleteContact(r.id)}>Remove</button></td>}
    {group==='tasks'&&<td><select disabled={busy} value={tasks.find(t=>t.id===r.id)?.status} onChange={e=>void setTask(r.id,e.target.value)}><option value="review_required">review_required</option><option value="in_progress">in_progress</option><option value="completed">completed</option><option value="suspended">suspended</option><option value="archived">archived</option></select></td>}
   </tr>)}
   {!rows.length&&<tr><td colSpan={12}>No records available.</td></tr>}
  </tbody></table></div>
  <div className="comm-actions"><button onClick={exportData}>Export {chosen.length} record(s)</button><small>{marked.length} selected · first 200 authorized records per source</small></div>
  <CommunicationImports onChange={msg=>setNotice(msg)}/>
  <details className="comm-ops-audit"><summary>Recent import / export activity ({audit.length})</summary><div className="comm-table-wrap"><table><thead><tr><th>Time</th><th>Category</th><th>Action</th><th>Count</th></tr></thead><tbody>{audit.map(a=><tr key={a.id}><td>{a.created_at}</td><td>{a.category}</td><td>{a.action}</td><td>{a.record_count}</td></tr>)}</tbody></table></div></details>
  {notice&&<p role="status" className="comm-ops-notice">{notice}</p>}
 </section>;
}
