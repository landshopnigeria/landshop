'use client';
import {useState} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '@supabase/ssr';
import catalog from './catalog.json';
type ImportType='contacts'|'workflow_drafts'|'templates';
function client(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw Error('Management database configuration is missing');return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',secure:true,sameSite:'lax'}})}
function parseCSV(input:string){
 const out:string[][]=[];let cols:string[]=[],val='',quoted=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];if(c==='"'){if(quoted&&input[i+1]==='"'){val+='"';i++}else quoted=!quoted}
  else if(c===','&&!quoted){cols.push(val);val=''}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&input[i+1]==='\n')i++;cols.push(val);if(cols.some(x=>x.trim()))out.push(cols);cols=[];val=''}
  else val+=c;
 }
 if(quoted)throw Error('Invalid CSV quoting');cols.push(val);if(cols.some(x=>x.trim()))out.push(cols);
 if(out.length<2)return[];
 const names=out[0].map(x=>x.trim().toLowerCase().replace(/[^a-z0-9_]/g,'_'));
 return out.slice(1).map(row=>Object.fromEntries(names.map((n,i)=>[n,row[i]||''])));
}
export default function CommunicationImports({onChange}:{onChange:(message:string)=>void}){
 const [busy,setBusy]=useState(false);
 async function audit(db:ReturnType<typeof client>,category:ImportType,num:number){
  const {data:{user}}=await db.auth.getUser();
  if(user)await db.from('landshop_comm_import_audit').insert({actor_id:user.id,category,action:'import',record_count:num});
 }
 async function ingest(file:File|null,category:ImportType){
  if(!file)return;if(file.size>700000){onChange('File too large; split into smaller batches.');return}
  setBusy(true);let saved=0;
  try{
   const raw=await file.text(),db=client();
   if(category==='contacts'){
    const data=file.name.endsWith('.csv')?parseCSV(raw):JSON.parse(raw);
    const list=Array.isArray(data)?data:Array.isArray(data.contacts)?data.contacts:[];
    if(!list.length||list.length>100)throw Error('Import between 1 and 100 contacts per batch.');
    const yes=(v:unknown)=>v===true||String(v).toLowerCase()==='true'||String(v)==='1';
    const records=list.map((row:Record<string,unknown>,i:number)=>{
     const email=String(row.email||'').trim().toLowerCase();
     if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Invalid email at row '+(i+1));
     const marketing=yes(row.marketing_consent),whatsapp=yes(row.whatsapp_opt_in),sms=yes(row.sms_opt_in);
     const evidence=String(row.consent_evidence||'').trim(),when=String(row.consent_at||'').trim();
     if((marketing||whatsapp||sms)&&(evidence.length<12||!when||!Number.isFinite(Date.parse(when))))throw Error('Row '+(i+1)+' lacks dated opt-in evidence.');
     return{email,full_name:String(row.full_name||row.name||'').slice(0,120),phone:String(row.phone||'').slice(0,30),
      product_interest:String(row.product_interest||row.product||'').slice(0,120),
      source:'staff_import',status:'active',marketing_consent:marketing,whatsapp_opt_in:whatsapp,sms_opt_in:sms,
      consent_at:(marketing||whatsapp||sms)?new Date(when).toISOString():null,
      consent_evidence:(marketing||whatsapp||sms)?evidence.slice(0,500):null};
    });
    const {data:imported,error}=await db.from('landshop_comm_contacts').upsert(records,{onConflict:'email',ignoreDuplicates:true}).select('id');
    if(error)throw Error(error.message);saved=imported?.length||0;
    onChange(saved+' new contacts imported. Existing contacts were left unchanged to preserve opt-out and suppression records. Reload to inspect.');
   }else if(category==='workflow_drafts'){
    const payload=JSON.parse(raw),list=Array.isArray(payload)?payload:[payload];
    if(!list.length||list.length>20)throw Error('Import 1 to 20 workflow drafts.');
    for(const workflow of list){
     const graph=workflow.graph;
     if(!graph||!Array.isArray(graph.nodes)||!Array.isArray(graph.edges)||graph.nodes.length<2||graph.nodes.length>100||graph.edges.length>160)throw Error('Invalid workflow graph.');
     if(graph.nodes.filter((node:{type:string})=>node.type==='trigger').length!==1||!graph.nodes.some((node:{type:string})=>node.type==='end'))throw Error('One trigger and one end required.');
     const {error}=await db.rpc('landshop_automation_create',{p_name:String(workflow.name||'Imported workflow').slice(0,100),p_description:String(workflow.description||'Imported for review').slice(0,1500),p_graph:graph});
     if(error)throw Error(error.message);saved++;
    }
    onChange(saved+' workflow draft(s) imported to NEXUS. Nothing was activated.');
   }else{
    const payload=JSON.parse(raw),list=Array.isArray(payload)?payload:Array.isArray(payload.templates)?payload.templates:[];
    if(!list.length||list.length>100)throw Error('Import 1 to 100 template changes.');
    const all=new Map(catalog.templates.map(t=>[t.id,t]));
    for(const incoming of list){
     const original=all.get(incoming.id);if(!original)throw Error('Unknown template '+String(incoming.id));
     const image=String(incoming.image_url||'');
     if(image&&!/^\/media\/[a-zA-Z0-9_./-]+\.webp$/.test(image))throw Error('Only verified Landshop archive media paths are allowed.');
     const row={id:original.id,subject:String(incoming.subject||original.subject).slice(0,300),
      headline:String(incoming.headline||original.premium.headline).slice(0,180),
      body:String(incoming.body||original.premium.body).slice(0,4000),
      whatsapp:String(incoming.whatsapp||original.wa).slice(0,4000),sms:String(incoming.sms||original.sms).slice(0,1500),
      image_url:image||null,state:'draft',change_note:'Imported for review only'};
     const {error}=await db.from('landshop_comm_templates').upsert(row,{onConflict:'id'});
     if(error)throw Error(error.message);saved++;
    }
    onChange(saved+' template edits imported as drafts. Reload to review each one.');
   }
   await audit(db,category,saved);
  }catch(e){onChange(e instanceof Error?e.message:'Import failed.');}
  finally{setBusy(false);}
 }
 return <div className="comm-ops-import">
  <section><h3>Import contacts</h3><p>CSV or JSON · up to 100 per batch. Marketing and messaging consent requires dated evidence; duplicates are skipped.</p><input aria-label="Import verified contact file" type="file" accept=".csv,.json" disabled={busy} onChange={e=>{void ingest(e.target.files?.[0]||null,'contacts');e.target.value='';}}/></section>
  <section><h3>Import workflows</h3><p>JSON workflow graphs are added to NEXUS as drafts only; management can review, edit and approve them separately.</p><input aria-label="Import workflow JSON" type="file" accept=".json" disabled={busy} onChange={e=>{void ingest(e.target.files?.[0]||null,'workflow_drafts');e.target.value='';}}/><Link href="/admin/automation">Open NEXUS Builder →</Link></section>
  <section><h3>Import redesigned templates</h3><p>Import revisions to the 70 approved-review templates. Files are never allowed to trigger live sends.</p><input aria-label="Import template JSON" type="file" accept=".json" disabled={busy} onChange={e=>{void ingest(e.target.files?.[0]||null,'templates');e.target.value='';}}/></section>
 </div>;
}
