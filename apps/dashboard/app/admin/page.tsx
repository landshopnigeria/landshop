import CommandDashboard from './CommandDashboard';
import {requireLandshopStaff} from '../../lib/admin-access';
export const dynamic='force-dynamic';
export const metadata={title:'Landshop Global Command Center'};
export default async function Admin(){
 const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const count=async(table:string,filter?:[string,string[]])=>{let query=db.from(table).select('*',{count:'exact',head:true});if(filter)query=query.in(filter[0],filter[1]);const result=await query;return result.error?null:result.count};
 const [properties,customers,enquiries,applications,kyc,staff,drafts,referrals,workflows,recent,latest,audits]=await Promise.all([
 count('properties'),count('profiles'),count('contact_enquiries'),count('applications'),count('kyc_submissions',['status',['submitted','pending','under_review']]),count('landshop_staff_profiles',['employment_state',['active']]),count('properties',['status',['draft']]),count('referral_edges'),count('automation_workflows'),
 db.from('properties').select('id,title,status').order('created_at',{ascending:false}).limit(6),
 db.from('applications').select('id,kind,status').order('created_at',{ascending:false}).limit(6),
 db.from('audit_events').select('id,event_type,created_at').order('created_at',{ascending:false}).limit(5)
 ]);
 return <CommandDashboard metrics={{properties,customers,enquiries,applications,kyc,staff,drafts,referrals,workflows}} properties={recent.data||[]} applications={latest.data||[]} audits={audits.data||[]}/>;
}
