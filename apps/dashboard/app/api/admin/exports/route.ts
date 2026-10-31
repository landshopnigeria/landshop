import {NextRequest} from 'next/server';
import ExcelJS from 'exceljs';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {requireLandshopStaff} from '../../../../lib/admin-access';

export const runtime='nodejs';
export const dynamic='force-dynamic';
type Row=Record<string,unknown>;
type Spec={table:string;fields:string[];sort:string};
const allowed={
 referrals:{table:'referral_edges',fields:['referrer_id','referee_id','source_code','created_at'],sort:'created_at'},
 referral_codes:{table:'referral_codes',fields:['user_id','numeric_code','code'],sort:'numeric_code'},
 referral_wallets:{table:'referral_wallets',fields:['user_id','available_kobo','pending_kobo','lifetime_earned_kobo','lifetime_paid_kobo','updated_at'],sort:'updated_at'},
 referral_rewards:{table:'referral_reward_events',fields:['id','user_id','referral_referee_id','source_transaction_id','amount_kobo','direction','status','description','created_at','approved_at'],sort:'created_at'},
 customers:{table:'profiles',fields:['id','full_name','display_username','phone','kyc_status','created_at'],sort:'created_at'},
 applications:{table:'applications',fields:['id','applicant_id','kind','status','created_at'],sort:'created_at'},
 kyc:{table:'kyc_submissions',fields:['id','applicant_id','kind','status','reviewed_by','reviewed_at','created_at'],sort:'created_at'},
 application_documents:{table:'application_documents',fields:['id','application_id','applicant_id','document_type','object_path','created_at'],sort:'created_at'},
 staff:{table:'landshop_staff_profiles',fields:['user_id','username','staff_number','requested_role','kyc_state','employment_state','joined_at','created_at'],sort:'created_at'},
 staff_reports:{table:'landshop_staff_routed_reports',fields:['id','staff_id','recipient_role','cadence','period_start','summary','blockers','status','reviewer_note','created_at','reviewed_at'],sort:'created_at'},
 tasks:{table:'staff_tasks',fields:['id','assignee_id','assigned_by','title','status','created_at','accepted_at','submitted_at','score'],sort:'created_at'},
 payments:{table:'landshop_payment_transactions',fields:['id','user_id','plan_id','reference','amount_kobo','currency','status','provider_domain','paid_at','created_at'],sort:'created_at'},
 subscriptions:{table:'landshop_customer_subscriptions',fields:['id','user_id','plan_id','status','expires_at','updated_at'],sort:'updated_at'},
 properties:{table:'properties',fields:['id','title','slug','property_type','status','amount_kobo','created_at'],sort:'created_at'},
 automation_runs:{table:'automation_runs',fields:['id','workflow_id','status','started_at','completed_at','error_code'],sort:'started_at'},
 audit_events:{table:'audit_events',fields:['id','actor_id','event_type','created_at'],sort:'created_at'}
} satisfies Record<string,Spec>;
type Dataset=keyof typeof allowed;
const formats=['csv','json','xlsx','pdf'] as const;
type Format=(typeof formats)[number];
const mime:{[key in Format]:string}={
 csv:'text/csv; charset=utf-8',
 json:'application/json; charset=utf-8',
 xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 pdf:'application/pdf'
};
function exportText(value:unknown){
 if(value===null||value===undefined)return '';
 if(typeof value==='object')return JSON.stringify(value);
 return String(value);
}
function safeCsv(value:unknown){
 let str=exportText(value);
 // Prevent spreadsheet formula injection in Excel and other CSV readers.
 if(/^[\s]*[=+\-@]/.test(str))str="'"+str;
 return '"'+str.replace(/"/g,'""')+'"';
}
function cleanPdf(str:unknown){
 // Standard PDF fonts support WinAnsi, not arbitrary Unicode.
 return exportText(str).normalize('NFKD').replace(/[^\x20-\x7e]/g,'?').replace(/[\r\n\t]/g,' ');
}
async function exportXlsx(headers:string[],rows:Row[]){
 const wb=new ExcelJS.Workbook();wb.creator='Landshop Global Command Center';
 const ws=wb.addWorksheet('Landshop Data',{views:[{state:'frozen',ySplit:1}]});
 ws.addRow(headers);
 ws.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};
 ws.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF073F34'}};
 headers.forEach((h,i)=>{ws.getColumn(i+1).width=Math.min(40,Math.max(15,h.length+6))});
 for(const item of rows)ws.addRow(headers.map(h=>{
  let val=item[h];if(val===undefined||val===null)return '';
  if(typeof val==='number'||typeof val==='boolean')return val;
  const txt=exportText(val);
  return /^[\s]*[=+\-@]/.test(txt)?"'"+txt:txt;
 }));
 ws.autoFilter={from:{row:1,column:1},to:{row:rows.length+1,column:headers.length}};
 return Buffer.from(await wb.xlsx.writeBuffer());
}
async function exportPdf(dataset:string,headers:string[],rows:Row[]){
 const pdf=await PDFDocument.create();
 pdf.setTitle('Landshop '+dataset+' management export');
 pdf.setAuthor('Landshop Global Command Center');
 const font=await pdf.embedFont(StandardFonts.Helvetica);
 const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const view=headers.slice(0,6);
 const W=842,H=595,LEFT=32;
 let page=pdf.addPage([W,H]),y=H-38,pageNo=1;
 const drawHeader=()=>{
  page.drawRectangle({x:0,y:H-68,width:W,height:68,color:rgb(0.027,0.247,0.204)});
  page.drawText('LANDSHOP · GLOBAL COMMAND CENTER',{x:LEFT,y:H-29,size:17,font:bold,color:rgb(1,1,1)});
  page.drawText('Confidential owner export · '+cleanPdf(dataset)+' · '+new Date().toISOString(),{x:LEFT,y:H-49,size:9,font,color:rgb(1,1,1)});
  y=H-90;
 };
 const drawColumns=()=>{
  const cellWidth=(W-2*LEFT)/view.length;
  view.forEach((h,i)=>page.drawText(cleanPdf(h).slice(0,20),{x:LEFT+i*cellWidth,y,size:9,font:bold,color:rgb(0.07,0.31,0.23)}));
  y-=18;
 };
 drawHeader();drawColumns();
 for(const row of rows){
  if(y<45){page.drawText('Page '+pageNo,{x:W-65,y:22,font,size:9});page=pdf.addPage([W,H]);pageNo++;drawHeader();drawColumns();}
  const cellWidth=(W-2*LEFT)/view.length;
  view.forEach((h,i)=>page.drawText(cleanPdf(row[h]).slice(0,Math.max(8,Math.floor(cellWidth/5.5))),{
   x:LEFT+i*cellWidth,y,size:8,font,color:rgb(0.13,0.22,0.19)
  }));
  y-=15;
 }
 page.drawText('Page '+pageNo,{x:W-65,y:22,font,size:9});
 return Buffer.from(await pdf.save());
}
export async function GET(request:NextRequest){
 const dataset=request.nextUrl.searchParams.get('dataset')||'';
 const format=request.nextUrl.searchParams.get('format')||'';
 if(!(dataset in allowed)||!formats.includes(format as Format))
  return new Response(JSON.stringify({error:'Unsupported dataset or export format'}),{status:400,headers:{'Content-Type':'application/json'}});
 try{
  // Owner only, with landshop_is_management and active organization membership
  // verified by the shared backend authorization gate.
  const {db}=await requireLandshopStaff(['owner']);
  const name=dataset as Dataset,chosen=format as Format,spec=allowed[name];
  let rows:Row[]=[];
  for(let offset=0;offset<10000;offset+=500){
   const res=await db.from(spec.table).select(spec.fields.join(','))
    .order(spec.sort,{ascending:false}).range(offset,offset+499);
   if(res.error)throw Error('Authorized dataset unavailable: '+res.error.code);
   const chunk=(res.data||[]) as unknown as Row[];
   rows.push(...chunk);
   if(chunk.length<500)break;
  }
  if(name==='referrals'){
   const refs=await db.from('referral_codes').select('user_id,code').limit(10000);
   if(refs.error)throw Error('Referral code mapping unavailable');
   const codes=new Map((refs.data||[]).map(x=>[x.user_id,x.code]));
   const parents=new Map(rows.map(x=>[String(x.referee_id),String(x.referrer_id)]));
   const depth=(user:string)=>{
    const seen=new Set<string>();let d=0,cur=user;
    while(parents.has(cur)&&d<100){
     if(seen.has(cur))return 'cycle_not_allowed';
     seen.add(cur);cur=parents.get(cur)!;d++;
    }
    return d;
   };
   rows=rows.map(r=>({...r,referrer_code:codes.get(String(r.referrer_id))||'',
    referee_code:codes.get(String(r.referee_id))||'',referral_tree_depth:depth(String(r.referee_id))}));
  }
  const headers=rows.length?Array.from(new Set([...spec.fields,...Object.keys(rows[0])])):spec.fields;
  const log=await db.rpc('landshop_record_command_export',{p_dataset:name,p_format:chosen,p_count:rows.length});
  if(log.error||log.data!==true)throw Error('Export audit authorization failed');
  let buffer:Buffer;
  if(chosen==='json')buffer=Buffer.from(JSON.stringify({
   dataset:name,count:rows.length,limit:10000,exported_at:new Date().toISOString(),fields:headers,records:rows
  },null,2));
  else if(chosen==='csv')buffer=Buffer.from('\uFEFF'+[headers.map(safeCsv).join(','),...rows.map(r=>headers.map(h=>safeCsv(r[h])).join(','))].join('\r\n'),'utf8');
  else if(chosen==='xlsx')buffer=await exportXlsx(headers,rows);
  else buffer=await exportPdf(name,headers,rows);
  return new Response(new Uint8Array(buffer),{status:200,headers:{
   'Content-Type':mime[chosen],'Content-Disposition':'attachment; filename="landshop-'+name+'-'+new Date().toISOString().slice(0,10)+'.'+chosen+'"',
   'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow',
   'X-Landshop-Export-Row-Cap':'10000'
  }});
 }catch(e){
  console.error('Landshop owner export denied or unavailable',e instanceof Error?e.message:'error');
  return new Response(JSON.stringify({error:'Owner-authorized export is unavailable or the selected dataset is not yet configured.'}),{
   status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  });
 }
}
