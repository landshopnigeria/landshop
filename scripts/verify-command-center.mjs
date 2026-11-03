import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=process.cwd();
const load=(file)=>{const source=fs.readFileSync(file,'utf8');const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exports={};new Function('exports',compiled)(exports);return exports};
const {safeContentURL,publicContentRoute,parsePageStyle,pageStyleCSS}=load('packages/shared/content-model.ts');
for(const input of ['javascript:alert(1)','data:text/html,test','//evil.test','/\\evil.test','/bad\nroute','http://unsafe.test'])assert.equal(safeContentURL(input,'link'),false,input);
for(const input of ['/about','https://www.landshopnigeria.com/about','mailto:care@landshopnigeria.com','tel:+23418880063'])assert.equal(safeContentURL(input,'link'),true,input);
assert.equal(safeContentURL('https://evil.test/image.jpg','image'),false);
assert.equal(safeContentURL('https://iwkfagzkogzidrbbezds.supabase.co/storage/v1/object/public/photo.jpg','image'),true);
for(const input of ['/admin','/api/test','/staff/sign-in','/auth/callback','//evil.test','/../admin','/about?url=https://evil.test'])assert.equal(publicContentRoute(input),false,input);
for(const input of ['/','/about','/projects/blue-diamonds'])assert.equal(publicContentRoute(input),true,input);
const {commandNavigation}=load('apps/dashboard/app/admin/navigation.ts');
const destinations=commandNavigation.flatMap(g=>g.items.map(x=>x[1]));assert.equal(new Set(destinations).size,destinations.length);
for(const route of destinations)assert.ok(fs.existsSync(path.join(root,'apps/dashboard/app',route,'page.tsx')),route);
const {excelWorkbook}=load('apps/dashboard/app/admin/reports/export-openxml.ts');
const workbook=excelWorkbook([{name:'Ada',answer:null},{name:'Bola',extra_field:'=untrusted formula',answer:'Submitted'}]);const zipText=new TextDecoder().decode(workbook);
assert.ok(zipText.includes('extra_field'),'fields present only in later records must survive export');assert.ok(zipText.includes('=untrusted formula'));assert.ok(!zipText.includes('<f>'),'untrusted cells must remain plain text');
const nexus=load('apps/dashboard/app/admin/automation/NexusWorkspaceHTML.ts').NEXUS_WORKSPACE_HTML;
new Function(nexus.split('<script>').at(-1).split('</script>')[0]);
for(const platform of ['facebook','instagram','youtube','tiktok','pinterest','linkedin'])assert.ok(nexus.includes('"'+platform+'":')||nexus.includes(platform+':'),platform);
assert.ok(nexus.includes("type:'focus'"));assert.ok(nexus.includes('Auto arrange canvas'));assert.ok(nexus.includes('Workflow outline'));
console.log(`PASS: safe content URLs, route restrictions, ${destinations.length} destinations, complete export columns, spreadsheet formula protection and canvas syntax/controls`);

assert.equal(parsePageStyle('{"base":{"position":"fixed"}}'),null);
assert.equal(parsePageStyle('{"base":{"color":"url(https://bad.test)"}}'),null);
assert.ok(pageStyleCSS('body > main:nth-of-type(1)','{"base":{"color":"#f26b10"},"mobile":{"display":"grid","grid-template-columns":"1fr"}}').includes('@media(max-width:760px)'));
assert.equal(pageStyleCSS('body > main{color:red}','{"base":{"color":"red"}}'),'');
console.log('PASS: responsive style whitelist and selector/CSS injection protections');

const {validateWorkflowPlan,extractWorkflowResponse}=load('packages/shared/workflow-ai.ts');
const plan={name:'Lead follow-up workflow',nodes:[{id:'n1',kind:'leadform',title:'Capture enquiry',instruction:'Accept an opted-in enquiry'},{id:'n2',kind:'approval',title:'Review message',instruction:'Manager reviews the message'},{id:'n3',kind:'email',title:'Email follow-up',instruction:'Send the approved response'}],edges:[{from:'n1',to:'n2'},{from:'n2',to:'n3'}]};
assert.equal(validateWorkflowPlan(plan).nodes.length,3);
assert.equal(extractWorkflowResponse({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(plan)}]}]}).edges.length,2);
for(const bad of [
 {...plan,edges:[...plan.edges,{from:'n1',to:'n3'}]},
 {...plan,edges:[...plan.edges,{from:'n3',to:'n2'}]},
 {...plan,edges:[{from:'n1',to:'n2'}]},
 {...plan,nodes:plan.nodes.map(n=>n.id==='n2'?{...n,kind:'email'}:n)},
 {...plan,nodes:plan.nodes.map(n=>n.id==='n3'?{...n,instruction:'password=do-not-store'}:n)},
 {...plan,edges:[...plan.edges,plan.edges[0]]}
])assert.throws(()=>validateWorkflowPlan(bad));
assert.throws(()=>extractWorkflowResponse({status:'incomplete'}));
assert.throws(()=>extractWorkflowResponse({output:[{content:[{type:'refusal'}]}]}));
const {reserveAIGeneration}=load('apps/dashboard/lib/ai-generation-limit.ts');
const release=reserveAIGeneration('manager',0);assert.ok(release);assert.equal(reserveAIGeneration('manager',1),null);release();release();
for(let i=0;i<3;i++)reserveAIGeneration('manager',2)();assert.equal(reserveAIGeneration('manager',3),null);assert.ok(reserveAIGeneration('manager',600001));
assert.ok(nexus.includes("type:'generate-ai'"));assert.ok(nexus.includes("msg.type==='ai-generated'"));
console.log('PASS: AI graph validation, approval bypass, cycles, disconnected steps, credential rejection, provider refusal and usage limits');
