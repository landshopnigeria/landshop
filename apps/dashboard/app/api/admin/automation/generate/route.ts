import {NextRequest,NextResponse} from 'next/server';
import {requireLandshopStaff} from '../../../../../lib/admin-access';
import {reserveAIGeneration} from '../../../../../lib/ai-generation-limit';
import {workflowAISchema,extractWorkflowResponse} from '../../../../../../../packages/shared/workflow-ai';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private,no-store'};
export async function POST(request:NextRequest){
 const {user,db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 if(!['https://app.landshopnigeria.com'].includes(request.headers.get('origin')||''))return NextResponse.json({error:'Open the workflow studio to generate a workflow.'},{status:403,headers});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return NextResponse.json({error:'JSON request required.'},{status:415,headers});
 if(Number(request.headers.get('content-length')||0)>6000)return NextResponse.json({error:'Describe the process in fewer than 1500 characters.'},{status:413,headers});
 const reader=request.body?.getReader();let raw='';if(reader){const decoder=new TextDecoder();let bytes=0;for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>6000){await reader.cancel();return NextResponse.json({error:'Description too long.'},{status:413,headers})}raw+=decoder.decode(chunk.value,{stream:true})}raw+=decoder.decode();}if(raw.length>6000)return NextResponse.json({error:'Description too long.'},{status:413,headers});let body;try{body=JSON.parse(raw)}catch{return NextResponse.json({error:'Invalid request.'},{status:400,headers})}
 const prompt=body?.prompt;if(typeof prompt!=='string'||prompt.trim().length<15||prompt.length>1500||/\bsk-[A-Za-z0-9_-]{12,}|\bBearer\s+[A-Za-z0-9._~-]{12,}/.test(prompt))return NextResponse.json({error:'Describe the business process (15-1500 characters) without credentials.'},{status:400,headers});
 const key=process.env.LANDSHOP_OPENAI_API_KEY||process.env.OPENAI_API_KEY,model=process.env.LANDSHOP_WORKFLOW_AI_MODEL;
 if(!key||!model||!/^[a-zA-Z0-9._:-]{1,100}$/.test(model))return NextResponse.json({error:'AI generation needs a server API key and model configuration. Open Connection status to see setup readiness.',code:'ai_configuration_required'},{status:503,headers});
 const release=reserveAIGeneration(user.id);if(!release)return NextResponse.json({error:'Generation is busy or your planning limit has been reached. Try again later.'},{status:429,headers:{...headers,'Retry-After':'60'}});
 let requestId:string|undefined;let finished=false;
 try{
 const reservation=await db.rpc('landshop_workflow_ai_reserve',{p_model:model});if(reservation.error)return NextResponse.json({error:'AI usage tracking is unavailable.'},{status:503,headers});if(!reservation.data)return NextResponse.json({error:'AI planning limit reached. Try again later.'},{status:429,headers});requestId=String(reservation.data);
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({model,store:false,max_output_tokens:6000,instructions:'Design an editable Landshop business workflow, never execute it. Return a directed acyclic graph of 2-40 nodes. Use n1,n2,etc IDs; exactly one trigger (website,webhook,schedule,leadform,commenttrigger). Every node must be reachable. Keep names 5-90 characters, titles 1-80 characters, instructions under 300 characters. Put an approval node on every path before email, social publishing, messaging or external API actions. Never invent connections or successful sends. Never include credentials or private client records. Use the supplied connector enum only. Prefer a small clear graph with conditions, waits and review checkpoints.',input:prompt.trim(),text:{format:{type:'json_schema',name:'landshop_workflow',strict:true,schema:workflowAISchema}}})});
 if(!response.ok)return NextResponse.json({error:response.status===401?'The configured AI credential was rejected. Check the server connection.':response.status===429?'The AI provider is rate limited or has insufficient quota.':'AI provider generation failed. Your current workflow is unchanged.'},{status:502,headers});
 const graph=extractWorkflowResponse(await response.json());
 const audit=await db.rpc('landshop_workflow_ai_finish',{p_id:requestId,p_status:'completed',p_nodes:graph.nodes.length,p_edges:graph.edges.length});
 if(audit.error||!audit.data)return NextResponse.json({error:'Generation could not be audited. Try again later.'},{status:503,headers});finished=true;
 return NextResponse.json({graph,model,mode:'ai_draft',execution:'not_started'},{headers});
 }catch(e){const message=e instanceof Error&&e.name==='TimeoutError'?'AI generation timed out. Your current workflow is unchanged.':e instanceof Error&&e.name==='AbortError'?'AI generation was interrupted.':e instanceof Error&&/workflow|step|trigger|review|model|AI|connection|Circular|credentials/i.test(e.message)?e.message:'AI generation could not be completed.';return NextResponse.json({error:message},{status:422,headers})}finally{release();if(requestId&&!finished)await db.rpc('landshop_workflow_ai_finish',{p_id:requestId,p_status:'failed',p_nodes:0,p_edges:0})}
}
