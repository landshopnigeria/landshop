import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireLandshopStaff} from '../../../../lib/admin-access';
import ExportRecords from '../../reports/ExportRecords';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))notFound();
 const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const [profile,staff,applications,kyc,tickets,realtor]=await Promise.all([
  db.from('profiles').select('full_name,phone,kyc_status,display_username,created_at').eq('id',id).maybeSingle(),
  db.from('landshop_staff_profiles').select('username,staff_number,requested_role,age_at_registration,gender,kyc_state,employment_state,joined_at,review_note').eq('user_id',id).maybeSingle(),
  db.from('applications').select('id,kind,status,answers,created_at').eq('applicant_id',id).order('created_at',{ascending:false}).limit(100),
  db.from('kyc_submissions').select('id,kind,status,metadata,created_at').eq('applicant_id',id).order('created_at',{ascending:false}).limit(100),
  db.from('support_tickets').select('id,subject,status,priority,created_at').eq('requester_id',id).order('created_at',{ascending:false}).limit(100),
  db.from('landshop_realtor_registrations').select('registration_number,issuing_body').eq('user_id',id).maybeSingle()
 ]);
 const sections=[{title:'Profile',result:profile},{title:'Staff registration',result:staff},{title:'Realtor registration',result:realtor}];
 const queues=[{title:'Applications',result:applications,path:'/admin/applications/',payload:'answers'},{title:'KYC submissions',result:kyc,path:'/admin/kyc/',payload:'metadata'},{title:'Support tickets',result:tickets,path:'/admin/support/',payload:''}];
 return <main style={{padding:'clamp(18px,4vw,56px)',maxWidth:1200,margin:'auto',color:'#073f34'}}><Link href="/admin/users">← Users & Customer Records</Link><h1>{profile.data?.full_name||staff.data?.username||'Account submissions'}</h1><p>Account ID: {id}</p>
 {sections.map(s=><section key={s.title}><h2>{s.title}</h2>{s.result.error?<p role="alert">This dataset could not be loaded.</p>:s.result.data?<dl>{Object.entries(s.result.data).map(([key,value])=><div key={key} style={{margin:'12px 0'}}><dt>{key.replaceAll('_',' ')}</dt><dd style={{margin:0,overflowWrap:'anywhere'}}>{String(value??'Not submitted')}</dd></div>)}</dl>:<p>No record submitted.</p>}</section>)}
 {queues.map(q=><section key={q.title}><h2>{q.title}</h2>{q.result.error?<p role="alert">This dataset could not be loaded.</p>:<><ExportRecords basename={'landshop-'+q.title.toLowerCase().replaceAll(' ','-')+'-'+id} rows={(q.result.data||[]).map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,typeof v==='object'?JSON.stringify(v):v])) as Record<string,string|number|null>)}/>{(q.result.data||[]).map(row=><article key={row.id} style={{padding:18,margin:'14px 0',background:'#f4f8f6',borderRadius:12}}><Link href={q.path+row.id}>Open record {row.id}</Link><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontFamily:'inherit'}}>{JSON.stringify(row,null,2)}</pre></article>)}{!q.result.data?.length&&<p>No submitted records.</p>}<small>Latest 100 records in this category. Original KYC documents use the separate document-review screen.</small></>}</section>)}
 </main>;
}
