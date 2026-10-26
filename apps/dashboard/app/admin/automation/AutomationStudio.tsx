'use client';
import {useState,useRef} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '@supabase/ssr';
type NodeType='trigger'|'condition'|'notification'|'wait'|'approval'|'task'|'webhook'|'end';
type Node={id:string,type:NodeType,label:string,x:number,y:number};
type Edge={from:string,to:string};
type Graph={nodes:Node[];edges:Edge[]};
type Workflow={id:string;name:string;description:string|null;version:number;state:string;draft_graph:Graph};
const types:NodeType[]=['trigger','condition','notification','wait','approval','task','webhook','end'];
function client(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Automation service not configured');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'}});
}
export default function AutomationStudio({initial}:{initial:Workflow[]}){
 const [flows,setFlows]=useState(initial),[current,setCurrent]=useState(initial[0]?.id||'');
 const [selected,setSelected]=useState<string|null>(null),[connect,setConnect]=useState<string|null>(null);
 const [nav,setNav]=useState(true),[inspector,setInspector]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const board=useRef<HTMLDivElement>(null),drag=useRef<{id:string;startX:number;startY:number;offsetX:number;offsetY:number}|null>(null);
 const flow=flows.find(f=>f.id===current);const graph:Graph=flow?.draft_graph||{nodes:[],edges:[]};
 const focused=graph.nodes.find(n=>n.id===selected);
 function update(g:Graph){if(!flow)return;setFlows(fs=>fs.map(x=>x.id===current?{...x,draft_graph:g}:x));}
 function add(type:NodeType){const n={id:crypto.randomUUID(),type,label:type[0].toUpperCase()+type.slice(1)+' step',x:220+graph.nodes.length*22,y:180+(graph.nodes.length%4)*75};update({...graph,nodes:[...graph.nodes,n]});setSelected(n.id)}
 function changeNode(patch:Partial<Node>){if(!selected)return;update({...graph,nodes:graph.nodes.map(x=>x.id===selected?{...x,...patch}:x)})}
 function remove(){if(!selected)return;update({nodes:graph.nodes.filter(n=>n.id!==selected),edges:graph.edges.filter(x=>x.from!==selected&&x.to!==selected)});setSelected(null)}
 function clickNode(id:string){if(connect){if(connect!==id&&!graph.edges.some(x=>x.from===connect&&x.to===id))update({...graph,edges:[...graph.edges,{from:connect,to:id}]});setConnect(null)}else setSelected(id)}
 function pointerDown(e:React.PointerEvent<HTMLButtonElement>,n:Node){if(e.button!==0)return;drag.current={id:n.id,startX:e.clientX,startY:e.clientY,offsetX:n.x,offsetY:n.y};e.currentTarget.setPointerCapture(e.pointerId)}
 function pointerMove(e:React.PointerEvent<HTMLButtonElement>){if(!drag.current)return;const d=drag.current;const x=Math.max(0,Math.min(3000,d.offsetX+e.clientX-d.startX));const y=Math.max(0,Math.min(1800,d.offsetY+e.clientY-d.startY));update({...graph,nodes:graph.nodes.map(n=>n.id===d.id?{...n,x,y}:n)})}
 function pointerUp(){drag.current=null}
 async function save(){
  if(!flow)return;setBusy(true);setMessage('');
  try{
   const {data,error}=await client().rpc('landshop_automation_save',{
    p_workflow:flow.id,p_graph:graph,p_expected_version:flow.version
   });
   if(error)throw Error('Could not save workflow: verify admin access and version conflict.');
   setFlows(fs=>fs.map(x=>x.id===current?{...x,version:Number(data),state:'draft'}:x));setMessage('Draft v'+String(data)+' saved. Outbound actions remain inactive.');
  }catch(e){setMessage(e instanceof Error?e.message:'Save failed')}finally{setBusy(false)}
 }
 function reset(){
  if(!flow||!confirm('Discard unsaved edits by reloading the workflow?'))return;
  window.location.reload();
 }
 function exportGraph(){const data=JSON.stringify({name:flow?.name,version:flow?.version,graph},null,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='landshop-workflow.json';a.click();URL.revokeObjectURL(url)}
 return <main className="auto-studio">
  <header className="auto-top"><Link href="/admin">← Global Command Center</Link><strong>LANDSHOP · AUTOMATION STUDIO</strong><span>{flow?.name||'No workflows'}</span><button onClick={save} disabled={!flow||busy}>Save Draft</button></header>
  <div className="auto-toolbar"><button onClick={()=>setNav(x=>!x)} aria-label="Toggle node sidebar">☰ Node Library</button><select aria-label="Workflow template" value={current} onChange={e=>{setCurrent(e.target.value);setSelected(null)}}>{flows.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><span>Version {flow?.version||'—'} · {flow?.state||'Not configured'}</span><button onClick={()=>setConnect(selected)} disabled={!selected}>Connect selected node →</button><button onClick={()=>setInspector(x=>!x)}>{inspector?'Hide':'Show'} Inspector</button><button onClick={exportGraph} disabled={!flow}>Export JSON</button><button onClick={reset}>Reset</button></div>
  <div className={'auto-workspace '+(!nav?'no-nav ':'')+(!inspector?'no-inspector':'')}>
   {nav&&<aside className="auto-library"><h2>Workflow Library</h2><p>Drag-ready triggers and actions. Select a node type to add it to the canvas.</p>{types.map(type=><button key={type} onClick={()=>add(type)}><span className={'node-dot '+type}/><strong>{type}</strong><small>＋ Add step</small></button>)}<div className="auto-warning">Preview and draft only. Email, SMS, WhatsApp and financial tasks will not execute until integration, consent and approvals pass.</div></aside>}
   <section className="auto-board-shell"><div className="auto-board-head"><div><h1>{flow?.name||'Automation Workflow'}</h1><p>{flow?.description||'Build a workflow with governed actions.'}</p></div><span>{graph.nodes.length} nodes · {graph.edges.length} links</span></div>
    <div className="auto-board" ref={board} role="application" aria-label="Interactive automation workflow canvas"><div className="auto-canvas">
     <svg width="3400" height="2100" aria-hidden="true" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
       {graph.edges.map((edge,i)=>{const a=graph.nodes.find(n=>n.id===edge.from),b=graph.nodes.find(n=>n.id===edge.to);if(!a||!b)return null;const x1=a.x+160,y1=a.y+33,x2=b.x,y2=b.y+33;return <path key={i} d={'M '+x1+' '+y1+' C '+(x1+80)+' '+y1+','+(x2-80)+' '+y2+','+x2+' '+y2} fill="none" stroke="#088c70" strokeWidth="2" markerEnd="url(#arrow)"/>})}
       <defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#078a6b"/></marker></defs>
     </svg>
     {graph.nodes.map(n=><button key={n.id} type="button" onPointerDown={e=>pointerDown(e,n)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onClick={()=>clickNode(n.id)}
      className={'auto-node '+n.type+(selected===n.id?' chosen':'')} style={{left:n.x,top:n.y,touchAction:'none'}}>
       <span className={'node-dot '+n.type}/><strong>{n.label}</strong><small>{n.type.toUpperCase()}</small></button>)}
    </div></div><div className="auto-board-foot"><span>{connect?'Choose target node to connect.':'Select and drag nodes; configure with Inspector. All saves are versioned.'}</span><span>Draft environment — no communications sent</span></div>
   </section>
   {inspector&&<aside className="auto-inspector"><h2>Node Inspector</h2>{focused?<><label>Node name<input value={focused.label} maxLength={80} onChange={e=>changeNode({label:e.target.value})}/></label><label>Type<select value={focused.type} onChange={e=>changeNode({type:e.target.value as NodeType})}>{types.map(x=><option key={x}>{x}</option>)}</select></label><label>X position<input type="number" min={0} max={3000} value={Math.round(focused.x)} onChange={e=>changeNode({x:Number(e.target.value)})}/></label><label>Y position<input type="number" min={0} max={1800} value={Math.round(focused.y)} onChange={e=>changeNode({y:Number(e.target.value)})}/></label><button onClick={()=>setConnect(focused.id)}>Connect →</button><button onClick={remove}>Delete node</button></>:<p>Click a workflow node to inspect or edit it.</p>}
    <div className="auto-warning"><strong>Publishing gate</strong><p>Changes are drafts until a separate review and verified provider setup. Do not include sensitive credentials or private client data in node labels.</p></div></aside>}
  </div><p className="auto-message" role="status" aria-live="polite">{message}</p>
 </main>;
}
