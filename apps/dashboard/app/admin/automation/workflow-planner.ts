/**
 * Safe deterministic Landshop workflow composer.
 * Converts supported intents into EDITABLE DRAFT GRAPHS, not executable automations.
 * Does not pretend to be an AI model, send messages or approve finance.
 */
export type NodeType='trigger'|'condition'|'notification'|'wait'|'approval'|'task'|'webhook'|'end';
export type NodeConfig={
 channel?:'email'|'sms'|'whatsapp'|'internal';
 event?:string;notes?:string;waitDays?:number;approvalRole?:string
};
export type WorkflowNode={id:string;type:NodeType;label:string;x:number;y:number;config?:NodeConfig};
export type WorkflowEdge={from:string;to:string;label?:string};
export type Graph={nodes:WorkflowNode[];edges:WorkflowEdge[]};
export type DraftPlan={name:string;description:string;sourcePrompt:string;recipe:string;graph:Graph};
type Step={type:NodeType;label:string;config?:NodeConfig};
const SAFE_CHANNELS=['email','sms','whatsapp','internal'] as const;
export const types:NodeType[]=['trigger','condition','notification','wait','approval','task','webhook','end'];
const recipes:{name:string;terms:string[];steps:Step[]}[]=[
 {name:'Mortgage Application',terms:['mortgage','loan','home financing','prequalif','equity','nhf'],
  steps:[
   {type:'trigger',label:'Mortgage application submitted',config:{event:'application.submitted'}},
   {type:'task',label:'Validate application and consent'},
   {type:'task',label:'Run affordability assessment'},
   {type:'condition',label:'Eligibility information complete?'},
   {type:'approval',label:'Authorized lending review',config:{approvalRole:'Mortgage Review'}},
   {type:'notification',label:'Send reviewed application update',config:{channel:'email'}},
   {type:'task',label:'Record mortgage follow-up'},
   {type:'end',label:'Application pathway recorded'}]},
 {name:'Property Inspection',terms:['inspection','site visit','viewing','book a tour','property tour'],
  steps:[
   {type:'trigger',label:'Inspection requested',config:{event:'inspection.requested'}},
   {type:'task',label:'Verify estate and customer details'},
   {type:'task',label:'Check preferred appointment date'},
   {type:'approval',label:'Confirm with authorized inspector',config:{approvalRole:'Operations'}},
   {type:'notification',label:'Send inspection confirmation',config:{channel:'email'}},
   {type:'task',label:'Record site visit outcome'},
   {type:'end',label:'Inspection follow-up ready'}]},
 {name:'Customer Enquiry',terms:['enquiry','inquiry','lead','prospect','contact form','follow-up','follow up','conversion','crm'],
  steps:[
   {type:'trigger',label:'New customer enquiry received',config:{event:'contact.received'}},
   {type:'task',label:'Check consent and contact details'},
   {type:'condition',label:'Customer consent recorded?'},
   {type:'task',label:'Assign enquiry to customer care'},
   {type:'notification',label:'Send approved first response',config:{channel:'email'}},
   {type:'wait',label:'Wait for reply window',config:{waitDays:2}},
   {type:'task',label:'Schedule human follow-up'},
   {type:'end',label:'Lead follow-up recorded'}]},
 {name:'KYC & Compliance',terms:['kyc','identity','verify identity','verification','onboard','compliance','document review'],
  steps:[
   {type:'trigger',label:'KYC submission received',config:{event:'kyc.submitted'}},
   {type:'task',label:'Check required private documents'},
   {type:'condition',label:'All requested evidence present?'},
   {type:'approval',label:'Authorized compliance decision',config:{approvalRole:'Compliance'}},
   {type:'notification',label:'Deliver reviewed status update',config:{channel:'email'}},
   {type:'task',label:'Record audit and reviewer evidence'},
   {type:'end',label:'Verification outcome recorded'}]},
 {name:'Customer Support',terms:['ticket','complaint','support','help desk','service request','resolution'],
  steps:[
   {type:'trigger',label:'Support case submitted',config:{event:'support.created'}},
   {type:'task',label:'Classify and prioritize case'},
   {type:'task',label:'Assign case owner'},
   {type:'condition',label:'Requires escalation?'},
   {type:'approval',label:'Support manager review',config:{approvalRole:'Operations'}},
   {type:'notification',label:'Send approved customer update',config:{channel:'email'}},
   {type:'end',label:'Case resolution tracked'}]},
 {name:'Property Acquisition',terms:['property','estate','develop','subscribe','land','house','unit','allocation','purchase'],
  steps:[
   {type:'trigger',label:'Property interest registered',config:{event:'property.interest'}},
   {type:'task',label:'Verify property availability'},
   {type:'task',label:'Review title and offer documentation'},
   {type:'condition',label:'Property details confirmed?'},
   {type:'approval',label:'Authorized sales review',config:{approvalRole:'Sales'}},
   {type:'notification',label:'Share verified next steps',config:{channel:'email'}},
   {type:'end',label:'Acquisition enquiry tracked'}]},
 {name:'Investment Subscription',terms:['investment','investor','incubate','co-invest','roi','payout'],
  steps:[
   {type:'trigger',label:'Investment interest received',config:{event:'investment.enquiry'}},
   {type:'task',label:'Collect suitability information'},
   {type:'task',label:'Confirm documented product terms'},
   {type:'approval',label:'Compliance and finance approval',config:{approvalRole:'Finance & Compliance'}},
   {type:'notification',label:'Communicate approved decision',config:{channel:'email'}},
   {type:'end',label:'Investment interest logged'}]},
 {name:'Payment & Allocation',terms:['payment','deposit','instalment','installment','invoice','receipt','handover','allocation'],
  steps:[
   {type:'trigger',label:'Payment event recorded',config:{event:'payment.recorded'}},
   {type:'task',label:'Match transaction to customer'},
   {type:'condition',label:'Finance verification completed?'},
   {type:'approval',label:'Finance approval required',config:{approvalRole:'Finance'}},
   {type:'notification',label:'Send verified receipt status',config:{channel:'email'}},
   {type:'task',label:'Update customer ledger'},
   {type:'end',label:'Payment event reconciled'}]}
];
function safeName(raw:string){return raw.replace(/\s+/g,' ').replace(/[<>]/g,'').trim().slice(0,100)}
function fromSteps(steps:Step[]):Graph{
 const nodes=steps.map((step,i):WorkflowNode=>({
  id:'generated-'+(i+1),type:step.type,label:step.label,
  x:60+(i%5)*250,y:110+Math.floor(i/5)*170,config:step.config
 }));
 const edges=nodes.slice(1).map((node,i):WorkflowEdge=>({from:nodes[i].id,to:node.id}));
 return {nodes,edges};
}
export function composeWorkflow(raw:string):DraftPlan{
 const sourcePrompt=raw.trim().slice(0,1500);
 if(sourcePrompt.length<12)throw Error('Describe the trigger, action and intended outcome in at least 12 characters.');
 const q=sourcePrompt.toLowerCase();
 const matches=recipes.map(recipe=>({recipe,score:recipe.terms.reduce((sum,term)=>sum+(q.includes(term)?term.length>6?3:2:0),0)})).sort((a,b)=>b.score-a.score);
 const matched=matches[0].score>0?matches[0].recipe:null;
 let steps:Step[]=matched?matched.steps.map(s=>({...s,config:s.config?{...s.config}:undefined})):[
  {type:'trigger',label:'Requested event received',config:{event:'event.received'}},
  {type:'task',label:'Validate input and permissions'},
  {type:'task',label:'Route to responsible operator'},
  {type:'approval',label:'Authorized human review',config:{approvalRole:'Operations'}},
  {type:'notification',label:'Send approved status update',config:{channel:'internal'}},
  {type:'end',label:'Outcome documented'}
 ];
 const channel=SAFE_CHANNELS.find(x=>new RegExp('\\b'+x+'\\b','i').test(q));
 if(channel){
  steps=steps.map(s=>s.type==='notification'?{...s,label:channel==='internal'?'Create internal notification':('Send approved '+channel.toUpperCase()+' update'),config:{...s.config,channel}}:s);
 }
 if(/every day|daily|remind|recurr|after \d+ days|weekly/i.test(q)&&!steps.some(s=>s.type==='wait')){
  const last=steps.pop()!;
  steps.push({type:'wait',label:'Wait for scheduled follow-up',config:{waitDays:/weekly/i.test(q)?7:1}},last);
 }
 const name=matched?matched.name:'Custom Operational Workflow';
 return {name,description:sourcePrompt,sourcePrompt,recipe:matched?matched.name:'Custom review-first blueprint',graph:fromSteps(steps)};
}
export function validateGraph(graph:Graph):string[]{
 const warnings:string[]=[];
 if(!graph||!Array.isArray(graph.nodes)||!Array.isArray(graph.edges))return ['A workflow needs nodes and connections.'];
 if(graph.nodes.length<2)return ['Add a trigger and an end node.'];
 if(graph.nodes.length>100||graph.edges.length>160)return ['Workflow exceeds the maximum graph size.'];
 const ids=graph.nodes.map(n=>n.id);
 const set=new Set(ids);
 if(set.size!==ids.length)warnings.push('Every node needs a unique ID.');
 const triggers=graph.nodes.filter(n=>n.type==='trigger');
 const endings=graph.nodes.filter(n=>n.type==='end');
 if(triggers.length!==1)warnings.push('Use exactly one trigger node.');
 if(!endings.length)warnings.push('Add an end node.');
 if(graph.edges.some(e=>e.from===e.to||!set.has(e.from)||!set.has(e.to)))warnings.push('Remove self-links or connections to missing nodes.');
 if(graph.nodes.some(n=>!types.includes(n.type)||!n.label.trim()||n.label.length>80))warnings.push('Each node needs a valid type and a name under 81 characters.');
 const adjacent=new Map<string,string[]>();
 graph.edges.forEach(edge=>adjacent.set(edge.from,[...(adjacent.get(edge.from)||[]),edge.to]));
 const seen=new Set<string>(),visiting=new Set<string>();
 let cycle=false;
 const travel=(id:string)=>{
  if(visiting.has(id)){cycle=true;return;}
  if(seen.has(id))return;
  visiting.add(id);(adjacent.get(id)||[]).forEach(travel);
  visiting.delete(id);seen.add(id);
 };
 if(triggers[0])travel(triggers[0].id);
 if(cycle)warnings.push('Remove cycles. Repeating steps require a scheduled wait handled by a runtime worker.');
 if(graph.nodes.some(n=>!seen.has(n.id)))warnings.push('Connect every node to the trigger path.');
 if(endings.length&&!endings.some(n=>seen.has(n.id)))warnings.push('Connect the trigger to an end node.');
 return Array.from(new Set(warnings));
}
