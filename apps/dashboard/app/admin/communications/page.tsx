import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
import CommunicationCenter from './CommunicationCenter';
export const dynamic='force-dynamic';
export const metadata={title:'Customer Communications | Landshop Global Command Center',robots:{index:false,follow:false}};
export default async function Communications(){
 const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const [workflowsResult,runsResult]=await Promise.all([
   db.from('automation_workflows').select('id,name').limit(250),
   db.from('automation_runs').select('id,workflow_id,status,started_at,context').order('started_at',{ascending:false}).limit(200)
 ]);
 const titles=new Map((workflowsResult.data||[]).map(row=>[String(row.id),String(row.name)]));
 const runs=(runsResult.error?[]:runsResult.data||[]).map(row=>({
   id:String(row.id),workflow:titles.get(String(row.workflow_id))||'Unlabeled workflow',
   status:String(row.status),started_at:String(row.started_at),
   mode:String((row.context as Record<string,unknown>|null)?.mode||'unclassified')
 }));
 return <CommunicationCenter runs={runs} evidenceAvailable={!runsResult.error}/>;
}
