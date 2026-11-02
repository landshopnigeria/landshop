import {requireLandshopStaff} from '../../../lib/admin-access';
import CommunicationCenter from './CommunicationCenter';
import type {Contact,Event,Task,Audit} from './OperationsCenter';
import type {PremiumOverride} from './PremiumMessagePreview';
export const dynamic='force-dynamic';
export const metadata={title:'Enterprise Customer Communications | Landshop Global Command Center',robots:{index:false,follow:false}};
export default async function Communications(){
 const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const results=await Promise.all([
  db.from('automation_workflows').select('id,name').limit(250),
  db.from('automation_runs').select('id,workflow_id,status,started_at,context').order('started_at',{ascending:false}).limit(200),
  db.from('landshop_comm_contacts').select('id,email,full_name,phone,product_interest,source,status,marketing_consent,whatsapp_opt_in,sms_opt_in,created_at').order('created_at',{ascending:false}).limit(200),
  db.from('landshop_comm_events').select('id,contact_id,event_type,product,source_type,stage,occurred_at').order('occurred_at',{ascending:false}).limit(200),
  db.from('landshop_comm_tasks').select('id,event_id,task_type,status,assigned_role,created_at').order('created_at',{ascending:false}).limit(200),
  db.from('landshop_comm_templates').select('id,subject,headline,body,whatsapp,sms,image_url,state,change_note,edited_at').limit(150),
  db.from('landshop_comm_import_audit').select('id,category,action,record_count,created_at').order('created_at',{ascending:false}).limit(80)
 ]);
 const [workflowsResult,runsResult,contactsResult,eventsResult,tasksResult,templatesResult,auditResult]=results;
 const titles=new Map((workflowsResult.data||[]).map(w=>[String(w.id),String(w.name)]));
 const runs=(runsResult.error?[]:runsResult.data||[]).map(row=>({
   id:String(row.id),workflow:titles.get(String(row.workflow_id))||'Unlabeled workflow',
   status:String(row.status),started_at:String(row.started_at),
   mode:String((row.context as Record<string,unknown>|null)?.mode||'unclassified')
 }));
 const operations={
  contacts:(contactsResult.data||[]) as Contact[],
  events:(eventsResult.data||[]) as Event[],
  tasks:(tasksResult.data||[]) as Task[],
  audit:(auditResult.data||[]) as Audit[],
  ready:![contactsResult.error,eventsResult.error,tasksResult.error].some(Boolean)
 };
 return <CommunicationCenter runs={runs} evidenceAvailable={!runsResult.error}
  operations={operations} initialOverrides={(templatesResult.data||[]) as PremiumOverride[]}
  templateDataReady={!templatesResult.error}/>;
}
