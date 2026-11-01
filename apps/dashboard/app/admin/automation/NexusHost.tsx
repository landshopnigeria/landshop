'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import Link from 'next/link';
import type {Graph,NodeType} from './workflow-planner';

type Flow={id:string;name:string;description:string|null;version:number;state:string;draft_graph:Graph};
type CanvasNode={id:string;kind:string;title:string;description?:string;x:number;y:number;enabled?:boolean;config?:Record<string,unknown>};
type CanvasEdge={id?:string;from:string;to:string};
type CanvasDraft={name:string;nodes:CanvasNode[];edges:CanvasEdge[]};
type Run={id:string;status:string;started_at:string;context:{mode?:string;current_node?:string|null;step_count?:number;graph_snapshot?:Graph}};
type RunEvent={id:number;node_id:string;event_type:string;created_at:string;details:Record<string,unknown>};
const API_TYPES=new Set<NodeType>(['trigger','condition','notification','wait','approval','task','webhook','end']);
const OUTBOUND=new Set(['facebook','instagram','groups','comments','linkedin','youtube','tiktok','pinterest','whatsapp','email','gmail','googleads','meta','telegram','slack','api','webhook','grpc','mqtt','opcua','modbus','openai','canva']);
const BLOCKED_KEYS=/password|private.?key|secret|access.?token|refresh.?token|authorization|api.?key|credential/i;
const BLOCKED_VALUES=/(?:\bsk-[A-Za-z0-9_-]{12,}|\bBearer\s+[A-Za-z0-9._~-]{12,})/i;
function backendType(node:CanvasNode):NodeType{
 if(node.kind==='approval')return 'approval';
 if(node.kind==='condition'||node.kind==='router'||node.kind==='dedup'||node.kind==='circuit')return 'condition';
 if(node.kind==='delay'||node.kind==='schedule')return node.kind==='delay'?'wait':'trigger';
 if(['website','webhook','leadform','commenttrigger','mqtt','opcua'].includes(node.kind))return 'trigger';
 if(['email','whatsapp','instagram','facebook','linkedin','youtube','tiktok','pinterest','groups','comments','gmail','telegram'].includes(node.kind))return 'notification';
 if(['api','grpc','modbus'].includes(node.kind))return 'webhook';
 return 'task';
}
function safeSettings(config:unknown){
 if(!config||typeof config!=='object'||Array.isArray(config))return {};
 const result:Record<string,string|number|boolean>={};
 for(const [key,value] of Object.entries(config as Record<string,unknown>).slice(0,28)){
  if(BLOCKED_KEYS.test(key))throw Error('Do not store credentials in a workflow node. Connect providers through the secure vault when available.');
  if(!/^[a-zA-Z][a-zA-Z0-9_.-]{0,59}$/.test(key))continue;
  if(typeof value==='string'){
   if(BLOCKED_VALUES.test(value))throw Error('Credential-like values were found. Remove access tokens and API keys before saving.');
   result[key]=value.slice(0,300);
  }else if(typeof value==='number'&&Number.isFinite(value))result[key]=value;
  else if(typeof value==='boolean')result[key]=value;
 }
 return result;
}
function validCanvas(payload:unknown):CanvasDraft{
 if(!payload||typeof payload!=='object')throw Error('Invalid visual workflow payload.');
 const data=payload as CanvasDraft;
 if(!Array.isArray(data.nodes)||!Array.isArray(data.edges))throw Error('Workflow must contain nodes and connections.');
 if(data.nodes.length<2||data.nodes.length>97||data.edges.length>150)throw Error('Supported draft size: 2–97 nodes and up to 150 connections.');
 if(typeof data.name!=='string'||data.name.trim().length<5||data.name.length>90)throw Error('Enter a meaningful workflow name (5–90 characters).');
 const ids=new Set<string>();
 for(const node of data.nodes){
  if(!node||typeof node.id!=='string'||!/^[\w-]{1,80}$/.test(node.id)||ids.has(node.id))throw Error('Duplicate or invalid node identifiers.');
  ids.add(node.id);
  if(typeof node.kind!=='string'||!/^[a-z0-9_-]{1,35}$/.test(node.kind))throw Error('Invalid connector kind.');
  if(typeof node.title!=='string'||!node.title.trim())throw Error('Every node requires a name.');
  if(!Number.isFinite(Number(node.x))||!Number.isFinite(Number(node.y)))throw Error('Invalid node canvas coordinates.');
  safeSettings(node.config);
 }
 const seen=new Set<string>();const degree=new Map(data.nodes.map(n=>[n.id,0]));
 for(const edge of data.edges){
  if(!ids.has(edge.from)||!ids.has(edge.to)||edge.from===edge.to)throw Error('A connection has an invalid endpoint.');
  const key=edge.from+':'+edge.to;
  if(seen.has(key))throw Error('Duplicate connections are not allowed.');
  seen.add(key);degree.set(edge.from,(degree.get(edge.from)||0)+1);
 }
 const heads=data.nodes.filter(n=>backendType(n)==='trigger');
 if(heads.length!==1)throw Error('Use exactly one event trigger per workflow. Route subsequent events through actions.');
 const adjacency=new Map(data.nodes.map(n=>[n.id,[] as string[]]));
 for(const e of data.edges)adjacency.get(e.from)?.push(e.to);
 const visited=new Set<string>();const processing=new Set<string>();
 const visit=(id:string)=>{
  if(processing.has(id))throw Error('Cycles require explicit bounded retry/wait policies. Remove this direct circular connection.');
  if(visited.has(id))return;
  processing.add(id);for(const next of adjacency.get(id)||[])visit(next);processing.delete(id);visited.add(id);
 };
 visit(heads[0].id);
 if(visited.size!==ids.size)throw Error('Connect all nodes to your workflow trigger before saving.');
 const endings=[...degree.values()].filter(n=>n===0).length;
 if(!endings)throw Error('Add at least one terminal step before saving.');
 return data;
}
function toPersistedGraph(payload:unknown):Graph{
 const draft=validCanvas(payload);
 const nodes=draft.nodes.map(n=>({
  id:n.id,type:backendType(n),label:n.title.trim().slice(0,80),
  x:Math.max(0,Math.min(6000,Math.round(n.x))),
  y:Math.max(0,Math.min(3800,Math.round(n.y))),
  config:{nexusKind:n.kind,nexusEnabled:n.enabled!==false,
   nexusDescription:String(n.description||'').slice(0,260),
   nexusSettings:safeSettings(n.config),
   externalProviderAction:OUTBOUND.has(n.kind)}
 }));
 const endId='nexus-terminal-'+Date.now().toString(36);
 const maxX=Math.max(...draft.nodes.map(n=>n.x));
 const maxY=Math.max(...draft.nodes.map(n=>n.y));
 nodes.push({id:endId,type:'end',label:'Audit and finish',
  x:Math.min(6000,Math.round(maxX+270)),y:Math.min(3800,Math.round(maxY)),
  config:{nexusKind:'__terminal',nexusEnabled:true,nexusDescription:'No external action triggered by saving',nexusSettings:{},externalProviderAction:false}});
 const tails=draft.nodes.filter(n=>!draft.edges.some(e=>e.from===n.id));
 const edges=[...draft.edges.map(e=>({from:e.from,to:e.to})),...tails.map(n=>({from:n.id,to:endId}))];
 if(edges.length>160)throw Error('Workflow exceeds the server connection limit.');
 const graph={nodes,edges} as Graph;
 if(JSON.stringify(graph).length>62000)throw Error('Workflow exceeds the 64KB versioned-draft limit. Divide it into subflows.');
 return graph;
}
const knownKinds=new Set(['website','webhook','schedule','leadform','commenttrigger','aiwriter','aiclassify','research','transcription','imageai','flyer','video','asset','facebook','instagram','linkedin','youtube','tiktok','pinterest','groups','comments','email','whatsapp','crm','sheet','api','database','analytics','router','condition','approval','delay','dedup','google','googlesheets','gmail','googleads','meta','openai','canva','mqtt','opcua','modbus','grpc','edge','telemetry','deadletter','circuit']);
function toCanvas(flow:Flow):CanvasDraft{
 const nodes=(flow.draft_graph.nodes||[])
  .filter(n=>(n.config as Record<string,unknown>|undefined)?.nexusKind!=='__terminal')
  .map(n=>{
   const c=(n.config||{}) as Record<string,unknown>;
   const candidate=typeof c.nexusKind==='string'?c.nexusKind:'';
   const fallback:Record<string,string>={trigger:'website',condition:'condition',notification:'email',wait:'delay',approval:'approval',task:'crm',webhook:'api',end:'analytics'};
   return {id:n.id,kind:knownKinds.has(candidate)?candidate:(fallback[n.type]||'crm'),title:n.label,
    description:typeof c.nexusDescription==='string'?c.nexusDescription:'',
    x:n.x,y:n.y,enabled:c.nexusEnabled!==false,
    config:c.nexusSettings&&typeof c.nexusSettings==='object'&&!Array.isArray(c.nexusSettings)?c.nexusSettings as Record<string,unknown>:{}} as CanvasNode;
  });
 const ids=new Set(nodes.map(n=>n.id));
 const edges=(flow.draft_graph.edges||[]).filter(e=>ids.has(e.from)&&ids.has(e.to))
  .map((e,i)=>({id:'persisted-'+i,from:e.from,to:e.to}));
 return {name:flow.name,nodes,edges};
}
function dbClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Landshop database credentials are not configured for this app.');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'}});
}
export default function NexusHost({initial,html}:{initial:Flow[];html:string}){
 const [flows,setFlows]=useState(initial);
 const [active,setActive]=useState(()=>initial.find(f=>f.draft_graph.nodes.some(n=>(n.config as Record<string,unknown>|undefined)?.nexusKind))?.id||'');
 const [status,setStatus]=useState('Ready · drafts and rehearsals only');
 const [busy,setBusy]=useState(false);
 const [historyOpen,setHistoryOpen]=useState(false);
 const [runs,setRuns]=useState<Run[]>([]);
 const [runEvents,setRunEvents]=useState<RunEvent[]>([]);
 const [currentRun,setCurrentRun]=useState<Run|null>(null);
 const [nextChoice,setNextChoice]=useState('');
 const iframe=useRef<HTMLIFrameElement>(null);
 const busyRef=useRef(false);
 const flowsRef=useRef(initial);
 const activeRef=useRef(active);
 const db=useMemo(dbClient,[]);
 const post=useCallback((type:string,payload?:unknown)=>iframe.current?.contentWindow?.postMessage({nexus:true,type,payload},'*'),[]);
 const setDrafts=(list:Flow[])=>{flowsRef.current=list;setFlows(list)};
 const choose=(value:string)=>{
  activeRef.current=value;setActive(value);setRunEvents([]);setCurrentRun(null);
  const f=flowsRef.current.find(x=>x.id===value);
  if(f){post('load',toCanvas(f));setStatus('Loaded saved draft v'+f.version+'. External actions remain locked.');}
  else {post('new');setStatus('New draft. Build and save to activate version tracking.');}
 };
 const refreshRuns=useCallback(async(workflowId:string)=>{
  if(!workflowId){setRuns([]);setCurrentRun(null);setRunEvents([]);return;}
  const {data,error}=await db.from('automation_runs').select('id,status,started_at,context').eq('workflow_id',workflowId)
   .eq('context->>mode','rehearsal').order('started_at',{ascending:false}).limit(12);
  if(error){setStatus('Run history unavailable: '+error.message);return;}
  const list=(data||[]) as Run[];setRuns(list);const next=list[0]||null;setCurrentRun(next);
  if(next){
   const {data:events}=await db.from('automation_run_events').select('id,node_id,event_type,created_at,details')
    .eq('run_id',next.id).order('id',{ascending:false}).limit(35);
   setRunEvents((events||[]) as RunEvent[]);
  }else setRunEvents([]);
 },[db]);
 const save=useCallback(async(payload:unknown)=>{
  if(busyRef.current)return;
  busyRef.current=true;setBusy(true);setStatus('Validating and saving versioned draft...');
  try{
   const draft=validCanvas(payload);const graph=toPersistedGraph(draft);
   const id=activeRef.current;const previous=flowsRef.current.find(f=>f.id===id);
   if(previous){
    const {data,error}=await db.rpc('landshop_automation_save',{p_workflow:id,p_graph:graph,p_expected_version:previous.version});
    if(error||!data)throw Error(error?.message||'Version conflict or editing permission denied.');
    const latest:Flow={...previous,name:draft.name,draft_graph:graph,version:Number(data),state:'draft'};
    setDrafts(flowsRef.current.map(f=>f.id===id?latest:f));
    setStatus('Saved securely · v'+latest.version+' · no external action executed.');
    post('saved',{version:latest.version,id:latest.id});
   }else{
    const {data,error}=await db.rpc('landshop_automation_create',{
     p_name:draft.name,p_description:'NEXUS visual workflow · authorization required for external actions',p_graph:graph});
    if(error||!data)throw Error(error?.message||'Workflow draft could not be created for this management role.');
    const created:Flow={id:String(data),name:draft.name,description:'NEXUS visual workflow',version:1,state:'draft',draft_graph:graph};
    setDrafts([created,...flowsRef.current]);activeRef.current=created.id;setActive(created.id);
    setStatus('New NEXUS draft v1 saved in Landshop securely.');
    post('saved',{version:1,id:created.id});
   }
  }catch(e){const msg=e instanceof Error?e.message:'Could not save the draft';setStatus(msg);post('error',{message:msg});}
  finally{busyRef.current=false;setBusy(false);}
 },[db,post]);
 useEffect(()=>{
  function onMessage(event:MessageEvent){
   if(event.source!==iframe.current?.contentWindow)return;
   const message=event.data;
   if(!message||typeof message!=='object'||message.nexus!==true)return;
   if(message.type==='ready'){
    const f=flowsRef.current.find(x=>x.id===activeRef.current);
    if(f)post('load',toCanvas(f));
    return;
   }
   if(message.type==='save')void save(message.payload);
  }
  window.addEventListener('message',onMessage);
  return()=>window.removeEventListener('message',onMessage);
 },[post,save]);
 const startRehearsal=async()=>{
  const id=activeRef.current;const f=flowsRef.current.find(x=>x.id===id);
  if(!f||busyRef.current){setStatus('Save a draft before recording a rehearsal.');return;}
  busyRef.current=true;setBusy(true);
  try{
   const {data,error}=await db.rpc('landshop_automation_rehearse',{p_workflow:f.id,p_expected_version:f.version});
   if(error||!data)throw Error(error?.message||'Cannot start auditable rehearsal.');
   await refreshRuns(f.id);setHistoryOpen(true);
   setStatus('Audit-backed rehearsal started. Provider calls and messages remain disabled.');
  }catch(e){setStatus(e instanceof Error?e.message:'Rehearsal failed');}
  finally{busyRef.current=false;setBusy(false);}
 };
 const advance=async()=>{
  if(!currentRun||currentRun.status!=='running'||busy)return;
  const edges=currentRun.context.graph_snapshot?.edges||[];
  const choices=edges.filter(e=>e.from===currentRun.context.current_node);
  if(choices.length>1&&!nextChoice){setStatus('Select the next branch before advancing.');return;}
  setBusy(true);
  try{
   const {error}=await db.rpc('landshop_automation_rehearsal_step',{p_run:currentRun.id,p_next_node:choices.length>1?nextChoice:null});
   if(error)throw Error(error.message);
   setNextChoice('');await refreshRuns(activeRef.current);
   setStatus('Atomic rehearsal step recorded. No external provider action executed.');
  }catch(e){setStatus(e instanceof Error?e.message:'Rehearsal failed');}
  finally{setBusy(false);}
 };
 const choiceNode=currentRun?.context.graph_snapshot?.nodes.find(n=>n.id===currentRun?.context.current_node);
 const choices=(currentRun?.context.graph_snapshot?.edges||[]).filter(e=>e.from===choiceNode?.id);
 const chooseOptions=choices.map(e=>({id:e.to,label:currentRun?.context.graph_snapshot?.nodes.find(n=>n.id===e.to)?.label||'Next step'}));
 return <main className="nexus-host">
  <div className="nexus-host-toolbar">
   <div className="nexus-host-title"><Link href="/admin" aria-label="Return to Command Center">←</Link><span>NEXUS <strong>Enterprise Studio</strong></span></div>
   <label className="nexus-host-select">Saved workflows
    <select aria-label="Select a saved automation" value={active} onChange={e=>choose(e.target.value)}>
     <option value="">New workflow</option>
     {flows.map(f=><option key={f.id} value={f.id}>{f.name} · v{f.version}</option>)}
    </select>
   </label>
   <button type="button" onClick={()=>choose('')}>New draft</button>
   <button type="button" onClick={()=>void startRehearsal()} disabled={!active||busy}>Record rehearsal</button>
   <button type="button" onClick={()=>{setHistoryOpen(v=>!v);if(!historyOpen)void refreshRuns(activeRef.current)}} disabled={!active}>Run history</button>
   <span className="nexus-host-status" role="status" title={status}>{status}</span>
   <span className="nexus-host-locked">External publishing locked</span>
  </div>
  <iframe ref={iframe} title="Landshop NEXUS visual automation workflow studio" className="nexus-host-frame"
   sandbox="allow-scripts allow-downloads" srcDoc={html} onLoad={()=>post('hello')}/>
  {historyOpen&&<aside className="nexus-run-drawer" aria-label="Audited rehearsal history">
   <header><div><small>SERVER-RECORDED EXECUTION</small><strong>Workflow Rehearsal</strong></div><button onClick={()=>setHistoryOpen(false)} aria-label="Close run history">×</button></header>
   <p>Real database run records and immutable step events. External services, devices, payments and communication actions are never invoked by a rehearsal.</p>
   {currentRun?<section className="nexus-current-run">
    <small>Current run</small><strong>{currentRun.id.slice(0,8)} · {currentRun.status}</strong>
    <span>Reviewed steps: {currentRun.context.step_count||0}</span>
    <span>Current node: {choiceNode?.label||'Completed'}</span>
    {chooseOptions.length>1&&currentRun.status==='running'&&<label>Choose branch
     <select value={nextChoice} onChange={e=>setNextChoice(e.target.value)}><option value="">Select a route</option>{chooseOptions.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>
    </label>}
    {currentRun.status==='running'&&<button disabled={busy} onClick={()=>void advance()}>Record next rehearsal step</button>}
   </section>:<p>No rehearsal recorded for this workflow.</p>}
   <h3>Recent activity</h3>
   <ul>{runEvents.map(e=><li key={e.id}><strong>{e.event_type.replaceAll('_',' ')}</strong><small>{new Date(e.created_at).toLocaleString()} · Node {e.node_id}</small></li>)}</ul>
   {runs.length>0&&<p>{runs.length} recent audited rehearsal {runs.length===1?'run':'runs'} loaded.</p>}
  </aside>}
 </main>;
}
