'use client';
import BrandedSelect from '../../../components/BrandedSelect';

import {useState,useRef,useEffect} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '@supabase/ssr';
import {composeWorkflow,validateGraph,types,type DraftPlan,type NodeType,type WorkflowNode as Node,type Graph} from './workflow-planner';
type Workflow={id:string;name:string;description:string|null;version:number;state:string;draft_graph:Graph};
type Rehearsal={id:string;status:string;started_at:string;context:{
 mode?:string;current_node?:string|null;started_by?:string;
 graph_snapshot?:Graph;step_count?:number;external_actions_executed?:number
}};
type RunEvent={id:number;node_id:string;event_type:string;created_at:string;details:Record<string,unknown>};
function client(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Automation service not configured');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'}});
}
export default function AutomationStudio({initial}:{initial:Workflow[]}){
 const [flows,setFlows]=useState(initial),[current,setCurrent]=useState(initial[0]?.id||'');
 const [selected,setSelected]=useState<string|null>(null),[connect,setConnect]=useState<string|null>(null);
 const [prompt,setPrompt]=useState(''),[generated,setGenerated]=useState<DraftPlan|null>(null);
 const savedGraphs=useRef<Record<string,string>>(Object.fromEntries(initial.map(f=>[f.id,JSON.stringify(f.draft_graph)])));
 const [testRun,setTestRun]=useState<Rehearsal|null>(null),[runEvents,setRunEvents]=useState<RunEvent[]>([]);
 const [testBusy,setTestBusy]=useState(false);
 const [nav,setNav]=useState(true),[inspector,setInspector]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const board=useRef<HTMLDivElement>(null),drag=useRef<{id:string;startX:number;startY:number;offsetX:number;offsetY:number}|null>(null);
 const flow=generated?undefined:flows.find(f=>f.id===current);const graph:Graph=generated?.graph||flow?.draft_graph||{nodes:[],edges:[]};
 const issues=validateGraph(graph);
 const focused=graph.nodes.find(n=>n.id===selected);
 const unsaved=Boolean(flow&&JSON.stringify(graph)!==savedGraphs.current[flow.id]);
 const runGraph=testRun?.context.graph_snapshot;
 const nextNode=runGraph?.nodes.find(n=>n.id===testRun?.context.current_node);
 const nextRoutes=(runGraph?.edges||[]).filter(e=>e.from===nextNode?.id)
  .map(e=>({id:e.to,label:runGraph?.nodes.find(n=>n.id===e.to)?.label||'Unknown node'}));
 function update(g:Graph){if(generated){setGenerated(d=>d?{...d,graph:g}:d);return;}if(!flow)return;setFlows(fs=>fs.map(x=>x.id===current?{...x,draft_graph:g}:x));}
 function add(type:NodeType){const n={id:crypto.randomUUID(),type,label:type[0].toUpperCase()+type.slice(1)+' step',x:220+graph.nodes.length*22,y:180+(graph.nodes.length%4)*75};update({...graph,nodes:[...graph.nodes,n]});setSelected(n.id)}
 function changeNode(patch:Partial<Node>){if(!selected)return;update({...graph,nodes:graph.nodes.map(x=>x.id===selected?{...x,...patch}:x)})}
 function remove(){if(!selected)return;update({nodes:graph.nodes.filter(n=>n.id!==selected),edges:graph.edges.filter(x=>x.from!==selected&&x.to!==selected)});setSelected(null)}
 function clickNode(id:string){if(connect){if(connect!==id&&!graph.edges.some(x=>x.from===connect&&x.to===id))update({...graph,edges:[...graph.edges,{from:connect,to:id}]});setConnect(null)}else setSelected(id)}
 function pointerDown(e:React.PointerEvent<HTMLButtonElement>,n:Node){if(e.button!==0)return;drag.current={id:n.id,startX:e.clientX,startY:e.clientY,offsetX:n.x,offsetY:n.y};e.currentTarget.setPointerCapture(e.pointerId)}
 function pointerMove(e:React.PointerEvent<HTMLButtonElement>){if(!drag.current)return;const d=drag.current;const x=Math.max(0,Math.min(3000,d.offsetX+e.clientX-d.startX));const y=Math.max(0,Math.min(1800,d.offsetY+e.clientY-d.startY));update({...graph,nodes:graph.nodes.map(n=>n.id===d.id?{...n,x,y}:n)})}
 function pointerUp(){drag.current=null}
 function buildFromPrompt(){
  try{
   const plan=composeWorkflow(prompt);setGenerated(plan);setSelected(null);setConnect(null);
   setMessage('Connected '+plan.recipe+' blueprint created. Review the nodes and Save as New Draft to persist it.');
  }catch(error){setMessage(error instanceof Error?error.message:'Unable to compile workflow.');}
 }
 async function save(){
  if(!flow&&!generated)return;
  setBusy(true);setMessage('');
  try{
   const db=client();
   if(generated){
    if(issues.length)throw Error('Resolve the workflow diagnostics before creating a new draft: '+issues.join(' '));
    const {data,error}=await db.rpc('landshop_automation_create',{
     p_name:generated.name,p_description:generated.description,p_graph:graph
    });
    if(error||!data)throw Error('Could not create workflow. Confirm authorized Landshop staff access and the workflow migration.');
    const record:Workflow={id:String(data),name:generated.name,description:generated.description,version:1,state:'draft',draft_graph:graph};
    savedGraphs.current[record.id]=JSON.stringify(graph);
    setFlows(fs=>[...fs,record]);setCurrent(record.id);setGenerated(null);setSelected(null);
    setMessage('New workflow saved securely as a versioned DRAFT. Activation remains provider-gated.');
   }else if(flow){
    const {data,error}=await db.rpc('landshop_automation_save',{
     p_workflow:flow.id,p_graph:graph,p_expected_version:flow.version
    });
    if(error)throw Error('Could not save workflow: verify staff permissions and any version conflict.');
    savedGraphs.current[current]=JSON.stringify(graph);
    setFlows(fs=>fs.map(x=>x.id===current?{...x,version:Number(data),state:'draft'}:x));
    setMessage('Draft v'+String(data)+' saved. Outbound actions remain inactive.');
   }
  }catch(e){setMessage(e instanceof Error?e.message:'Save failed');}
  finally{setBusy(false);}
 }
 async function loadRun(workflowId:string){
  try{
   const db=client();
   const {data,error}=await db.from('automation_runs')
    .select('id,status,started_at,context')
    .eq('workflow_id',workflowId)
    .eq('context->>mode','rehearsal')
    .order('started_at',{ascending:false})
    .limit(1);
   if(error)throw Error('Could not read rehearsal history.');
   const latest=(data?.[0]||null) as Rehearsal|null;
   setTestRun(latest);
   if(latest){
    const {data:history,error:eventsError}=await db.from('automation_run_events')
     .select('id,node_id,event_type,created_at,details')
     .eq('run_id',latest.id).order('id',{ascending:false}).limit(12);
    if(eventsError)throw Error('Could not read rehearsal events.');
    setRunEvents((history||[]) as RunEvent[]);
   }else{setRunEvents([]);}
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to fetch rehearsal history.');}
 }
 useEffect(()=>{
  if(generated||!current){setTestRun(null);setRunEvents([]);return;}
  let active=true;
  (async()=>{
   try{
    const {data,error}=await client().from('automation_runs')
     .select('id,status,started_at,context')
     .eq('workflow_id',current).eq('context->>mode','rehearsal')
     .order('started_at',{ascending:false}).limit(1);
    if(!active)return;
    if(error)throw error;
    const latest=(data?.[0]||null) as Rehearsal|null;
    setTestRun(latest);
    if(!latest){setRunEvents([]);return;}
    const {data:history}=await client().from('automation_run_events')
     .select('id,node_id,event_type,created_at,details')
     .eq('run_id',latest.id).order('id',{ascending:false}).limit(12);
    if(active)setRunEvents((history||[]) as RunEvent[]);
   }catch{if(active){setTestRun(null);setRunEvents([]);}}
  })();
  return()=>{active=false;};
 },[current,generated]);
 async function startTest(){
  if(!flow||generated||unsaved)return;
  setTestBusy(true);setMessage('');
  try{
   const {data,error}=await client().rpc('landshop_automation_rehearse',{
    p_workflow:flow.id,p_expected_version:flow.version
   });
   if(error||!data)throw Error(error?.message||'Unable to start workflow rehearsal.');
   await loadRun(flow.id);
   setMessage('New rehearsal started. Walk through each node to record its simulated outcome.');
  }catch(e){setMessage(e instanceof Error?e.message:'Rehearsal unavailable.');}
  finally{setTestBusy(false);}
 }
 async function advanceTest(next?:string){
  if(!flow||!testRun)return;
  setTestBusy(true);setMessage('');
  try{
   const {data,error}=await client().rpc('landshop_automation_rehearsal_step',{
    p_run:testRun.id,p_next_node:next||null
   });
   if(error||!data)throw Error(error?.message||'Unable to advance rehearsal.');
   await loadRun(flow.id);
   setMessage(data.status==='completed'?
    'Rehearsal completed with audit evidence. No live actions were performed.':
    'Step recorded. Communication, approval and integration actions remain simulated.');
  }catch(e){setMessage(e instanceof Error?e.message:'Rehearsal step failed.');}
  finally{setTestBusy(false);}
 }
 async function publishInternal(){
  if(!flow||generated||unsaved||busy)return;
  if(!confirm('Activate this workflow for REAL internal Landshop event processing? Only approved internal-only notifications and task records are supported; external actions remain disabled.'))return;
  setBusy(true);setMessage('');
  try{
   const {data,error}=await client().rpc('landshop_automation_publish_internal',{
    p_workflow:flow.id,p_version:flow.version
   });
   if(error||data!==true)throw Error(error?.message||'Owner approval or safe workflow validation is missing.');
   setFlows(x=>x.map(w=>w.id===flow.id?{...w,state:'active'}:w));
   setMessage('Owner-approved internal automation is active. External email, SMS, WhatsApp, webhooks and financial actions remain disabled.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to publish internal workflow.')}
  finally{setBusy(false)}
 }
 async function pauseInternal(pause:boolean){
  if(!flow||busy)return;
  setBusy(true);setMessage('');
  try{
   const {data,error}=await client().rpc('landshop_automation_pause_internal',{p_workflow:flow.id,p_pause:pause});
   if(error||data!==true)throw Error(error?.message||'Owner permission required');
   setFlows(x=>x.map(w=>w.id===flow.id?{...w,state:pause?'paused':'active'}:w));
   setMessage(pause?'Internal workflow paused.':'Internal workflow resumed.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to change workflow status')}
  finally{setBusy(false)}
 }
 function reset(){
  if(!confirm('Discard unsaved changes and reload the workflow?'))return;
  if(generated){setGenerated(null);setSelected(null);setMessage('Generated preview discarded.');return;}
  window.location.reload();
 }
 function exportGraph(){const data=JSON.stringify({name:generated?.name||flow?.name,version:generated?'unsaved':flow?.version,graph},null,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='landshop-workflow.json';a.click();URL.revokeObjectURL(url)}
 return <main className="auto-studio">
  <header className="auto-top"><Link href="/admin">← Global Command Center</Link><strong>LANDSHOP · AUTOMATION STUDIO</strong><span>{generated?.name||flow?.name||'No workflows'}</span><button onClick={save} disabled={(!flow&&!generated)||busy}>{busy?'Saving…':generated?'Save as New Draft':'Save Draft'}</button></header>
  <section className="auto-composer"><div><span>WORKFLOW BUILDER</span><h2>Describe your business process. Create its connected workflow.</h2><p>Turn a written process into a structured, editable draft: triggers, reviews, conditions, communications, wait steps and connected outcomes. Templates are rule-based, not autonomous AI execution.</p></div><form onSubmit={e=>{e.preventDefault();buildFromPrompt()}}><label htmlFor="automation-description">Describe the trigger, action and outcome</label><textarea id="automation-description" rows={3} maxLength={1500} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="For example: When a customer requests a property inspection, validate their details, assign a staff member, confirm the date and email the customer."/><button type="submit" disabled={busy}>Build Editable Workflow →</button></form>{generated&&<div className="auto-generated"><label htmlFor="new-workflow-name">New workflow name<input id="new-workflow-name" maxLength={100} value={generated.name} onChange={e=>setGenerated(d=>d?{...d,name:e.target.value}:d)}/></label><span>{generated.recipe} · {graph.nodes.length} connected nodes · unsaved</span></div>}</section>
  <div className="auto-toolbar"><button onClick={()=>setNav(x=>!x)} aria-label="Toggle node sidebar">☰ Node Library</button><BrandedSelect aria-label="Workflow template" value={generated?'__generated':current} onChange={e=>{if(e.target.value==='__generated')return;setGenerated(null);setCurrent(e.target.value);setSelected(null);setConnect(null)}}>{generated&&<option value="__generated">New generated draft (unsaved)</option>}{flows.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</BrandedSelect><span>{generated?'Unsaved generated draft':'Version '+(flow?.version||'—')+' · '+(flow?.state||'Not configured')}</span><button onClick={()=>setConnect(selected)} disabled={!selected}>Connect selected node →</button><button onClick={()=>setInspector(x=>!x)}>{inspector?'Hide':'Show'} Inspector</button><button onClick={exportGraph} disabled={!flow&&!generated}>Export JSON</button><button onClick={reset}>Reset</button>
   <button className="auto-test-button" onClick={startTest} disabled={!flow||!!generated||unsaved||testBusy||busy}>
    {testBusy?'Working…':'Rehearse Saved Workflow'}
   </button>
   <button type="button" onClick={publishInternal} disabled={!flow||!!generated||unsaved||busy||flow.state==='active'} title="Verified owner approval; internal-only graph support">Activate internal workflow</button>
   <button type="button" onClick={()=>pauseInternal(flow?.state==='active')} disabled={!flow||busy||!['active','paused'].includes(flow.state)}>{flow?.state==='active'?'Pause workflow':'Resume internal workflow'}</button></div>
  <div className={'auto-workspace '+(!nav?'no-nav ':'')+(!inspector?'no-inspector':'')}>
   {nav&&<aside className="auto-library"><h2>Workflow Library</h2><p>Add process steps to your editable canvas. Connect steps using the Connect control.</p>{types.map(type=><button key={type} onClick={()=>add(type)}><span className={'node-dot '+type}/><strong>{type}</strong><small>＋ Add step</small></button>)}<div className="auto-warning">Preview and draft only. Email, SMS, WhatsApp and financial tasks will not execute until integration, consent and approvals pass.</div></aside>}
   <section className="auto-board-shell"><div className="auto-board-head"><div><h1>{generated?.name||flow?.name||'Automation Workflow'}</h1><p>{generated?.description||flow?.description||'Build a workflow with governed actions.'}</p></div><span>{graph.nodes.length} nodes · {graph.edges.length} links</span></div>
    <div className="auto-board" ref={board} role="application" aria-label="Interactive automation workflow canvas"><div className="auto-canvas">
     <svg width="3400" height="2100" aria-hidden="true" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
       {graph.edges.map((edge,i)=>{const a=graph.nodes.find(n=>n.id===edge.from),b=graph.nodes.find(n=>n.id===edge.to);if(!a||!b)return null;const x1=a.x+160,y1=a.y+33,x2=b.x,y2=b.y+33;return <path key={i} d={'M '+x1+' '+y1+' C '+(x1+80)+' '+y1+','+(x2-80)+' '+y2+','+x2+' '+y2} fill="none" stroke="#088c70" strokeWidth="2" markerEnd="url(#arrow)"/>})}
       <defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#078a6b"/></marker></defs>
     </svg>
     {graph.nodes.map(n=><button key={n.id} type="button" onPointerDown={e=>pointerDown(e,n)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onClick={()=>clickNode(n.id)}
      className={'auto-node '+n.type+(selected===n.id?' chosen':'')} style={{left:n.x,top:n.y,touchAction:'none'}}>
       <span className={'node-dot '+n.type}/><strong>{n.label}</strong><small>{n.type.toUpperCase()}</small></button>)}
    </div></div><div className="auto-board-foot"><span>{connect?'Choose target node to connect.':'Select and drag nodes; configure with Inspector. All saves are versioned.'}</span><span>Internal execution only when owner-approved. External channels disabled.</span></div>
   </section>
   {inspector&&<aside className="auto-inspector"><h2>Node Inspector</h2>{focused?<><label>Node name<input value={focused.label} maxLength={80} onChange={e=>changeNode({label:e.target.value})}/></label><label>Type<BrandedSelect value={focused.type} onChange={e=>changeNode({type:e.target.value as NodeType})}>{types.map(x=><option key={x}>{x}</option>)}</BrandedSelect></label><label>X position<input type="number" min={0} max={3000} value={Math.round(focused.x)} onChange={e=>changeNode({x:Number(e.target.value)})}/></label><label>Y position<input type="number" min={0} max={1800} value={Math.round(focused.y)} onChange={e=>changeNode({y:Number(e.target.value)})}/></label>
    {focused.type==='notification'&&<label>Delivery channel (not connected)<BrandedSelect value={focused.config?.channel||'internal'} onChange={e=>changeNode({config:{...focused.config,channel:e.target.value as 'email'|'sms'|'whatsapp'|'internal'}})}>{['internal','email','sms','whatsapp'].map(c=><option key={c} value={c}>{c.toUpperCase()}</option>)}</BrandedSelect></label>}
    {focused.type==='wait'&&<label>Waiting period (days)<input type="number" min={1} max={365} value={focused.config?.waitDays||1} onChange={e=>changeNode({config:{...focused.config,waitDays:Math.max(1,Math.min(365,Number(e.target.value)||1))}})}/></label>}
    {focused.type==='approval'&&<label>Required approval role<input maxLength={80} value={focused.config?.approvalRole||''} onChange={e=>changeNode({config:{...focused.config,approvalRole:e.target.value}})}/></label>}
    {focused.type==='trigger'&&<label>Business event<input maxLength={80} value={focused.config?.event||''} onChange={e=>changeNode({config:{...focused.config,event:e.target.value}})}/></label>}
    <label>Operator notes<textarea rows={3} maxLength={500} value={focused.config?.notes||''} onChange={e=>changeNode({config:{...focused.config,notes:e.target.value}})}/></label>
    <button onClick={()=>setConnect(focused.id)}>Connect →</button>
    {graph.edges.filter(e=>e.from===focused.id||e.to===focused.id).map(e=><button className="auto-disconnect" key={e.from+'-'+e.to} onClick={()=>update({...graph,edges:graph.edges.filter(link=>link!==e)})}>Disconnect {e.from===focused.id?'to '+(graph.nodes.find(n=>n.id===e.to)?.label||'step'):'from '+(graph.nodes.find(n=>n.id===e.from)?.label||'step')}</button>)}
    <button onClick={remove}>Delete node</button></>:<p>Click a workflow node to inspect or edit it.</p>}
    <div className="auto-warning"><strong>Publishing gate</strong><p>Verified owner can activate linear graphs using only triggers, tasks, internal notifications and end nodes. SMS, email, WhatsApp, webhooks, approvals and finance operations still require separately authorised integrations. Never put secrets in node labels.</p></div></aside>}
  </div>
  <section className="auto-test-panel" aria-label="Workflow execution rehearsal">
   <div className="auto-test-heading"><div><span>INTERNAL REHEARSAL & AUDIT</span><h2>Execute a safe, step-by-step test</h2>
    <p>Rehearsals run against the last saved version. They persist test steps and decisions, but never deliver emails or messages, call APIs, grant approvals, schedule real waits or transfer funds.</p></div>
    <div><strong>{testRun?'Run '+testRun.id.slice(0,8):'No rehearsal yet'}</strong><small>{testRun?testRun.status.toUpperCase():'Save a workflow to start'}</small></div></div>
   {unsaved&&<p className="auto-test-hint">Unsaved diagram edits detected. Save your draft before rehearsing so the database uses your latest graph.</p>}
   {testRun&&<div className="auto-test-grid"><div className="auto-test-current">
      <strong>{testRun.status==='completed'?'Rehearsal completed':nextNode?.label||'No current step'}</strong>
      <span>{nextNode?.type.toUpperCase()||'COMPLETE'} · {testRun.context.step_count||0} steps reviewed</span>
      {testRun.status==='running'&&<>
       <p>{nextNode?.type==='notification'||nextNode?.type==='webhook'?'This provider action will be logged as skipped; no external call will occur.':nextNode?.type==='approval'?'This step records a hypothetical review only. It cannot authorize an actual business decision.':'Advance to log the simulated step and continue to the next connected node.'}</p>
       {nextRoutes.length>1?
        <div className="auto-test-choices">{nextRoutes.map(next=><button key={next.id} disabled={testBusy} onClick={()=>advanceTest(next.id)}>Follow: {next.label}</button>)}</div>:
        <button className="auto-test-advance" disabled={testBusy} onClick={()=>advanceTest()}>
         {nextNode?.type==='end'?'Finish Rehearsal':testBusy?'Recording…':'Review Step & Continue →'}
        </button>}
      </>}
      <small>External actions performed: {testRun.context.external_actions_executed||0}</small>
    </div><div className="auto-test-timeline"><h3>Recorded run history</h3><ol>{runEvents.map(e=><li key={e.id}>
     <strong>{e.event_type.replaceAll('_',' ').replaceAll('.',' · ')}</strong>
     <small>Node: {e.node_id} · {new Date(e.created_at).toLocaleString('en-NG')}</small>
    </li>)}</ol></div></div>}
   {!testRun&&<p className="auto-test-hint">No rehearsal history for the selected workflow. Select “Rehearse Saved Workflow” above after saving your connected diagram.</p>}
  </section>{issues.length>0&&<section className="auto-diagnostics" aria-label="Workflow validation"><strong>Graph review: {issues.length} item(s)</strong><ul>{issues.map(issue=><li key={issue}>{issue}</li>)}</ul><p>Existing workflow drafts can still be saved while incomplete; new generated workflows require a connected graph.</p></section>}<p className="auto-message" role="status" aria-live="polite">{message}</p>
 </main>;
}
