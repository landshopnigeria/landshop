import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireLandshopStaff} from '../../../../lib/admin-access';
import SupportDecision from './SupportDecision';
export const dynamic='force-dynamic';
export default async function SupportDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(id))notFound();
 const {db}=await requireLandshopStaff(['owner','admin','operations']);
 const {data,error}=await db.from('support_tickets').select('id,subject,description,category,status,priority,created_at').eq('id',id).maybeSingle();
 if(error||!data)notFound();
 const events=await db.from('support_ticket_events').select('id,event_type,note,created_at').eq('ticket_id',id).order('created_at',{ascending:false}).limit(40);
 return <main style={{padding:'clamp(22px,5vw,60px)',background:'#f4f9f5',minHeight:'100vh',fontFamily:'Arial,sans-serif',color:'#123c32'}}>
  <div style={{maxWidth:950,margin:'auto'}}><Link href="/admin/support" style={{color:'#07836a'}}>← Support Queue</Link>
   <h1>{data.subject}</h1><p>Case: {data.id}</p><p>Category: {data.category} · Status: {data.status} · Priority: {data.priority}</p>
   <section style={{background:'white',padding:23,borderRadius:14,border:'1px solid #d6e8df',marginBottom:18}}><h2>Customer Request</h2><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',lineHeight:1.7}}>{data.description}</p></section>
   <SupportDecision ticketId={id} currentStatus={data.status} currentPriority={data.priority}/>
   <section style={{marginTop:20}}><h2>Case History</h2>{events.data?.length?<ul>{events.data.map(e=><li key={e.id} style={{padding:9}}>{new Date(e.created_at).toLocaleString('en-NG')} · {e.event_type}: {e.note}</li>)}</ul>:<p>No staff decisions have been recorded.</p>}</section>
  </div>
 </main>;
}