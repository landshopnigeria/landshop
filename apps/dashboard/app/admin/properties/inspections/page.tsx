import Link from 'next/link';
import {requireLandshopStaff} from '../../../../lib/admin-access';
import InspectionReview from './InspectionReview';
export const dynamic='force-dynamic';
export const metadata={title:'Inspection Appointments | Landshop Command Center'};
export default async function InspectionQueue({searchParams}:{searchParams:Promise<{status?:string}>}){
 const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const requested=(await searchParams).status||'';
 const valid=['pending_confirmation','confirmed','rescheduled','completed','rejected','cancelled'];
 let query=db.from('property_inspection_requests').select('id,property_id,full_name,email,phone,preferred_date,preferred_time,inspection_type,attendees,status,created_at,staff_note,properties(title,slug)')
  .order('created_at',{ascending:false}).limit(150);
 if(valid.includes(requested))query=query.eq('status',requested);
 const {data,error}=await query;
 return <main style={{fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif',minHeight:'100vh',background:'#f4faf6',padding:'clamp(20px,5vw,60px)',color:'#143e33'}}>
  <section style={{maxWidth:1250,margin:'auto'}}>
   <Link href="/admin/properties" style={{color:'#0c8b69'}}>← Property Command Center</Link>
   <h1 style={{fontSize:'clamp(30px,4vw,47px)',marginBottom:8}}>Property Inspections</h1>
   <p style={{lineHeight:1.65,color:'#657d6e'}}>Every submitted booking remains pending until an authorized team member confirms, reschedules, rejects or completes it. Only authorized staff can view applicant details.</p>
   <nav aria-label="Inspection status filters" style={{display:'flex',gap:9,flexWrap:'wrap',margin:'24px 0'}}>
    <Link href="/admin/properties/inspections" style={{padding:'10px 14px',borderRadius:9,background:!requested?'#2ba47a':'#fff',color:!requested?'white':'#0a6a53'}}>All requests</Link>
    {valid.map(s=><Link key={s} href={'/admin/properties/inspections?status='+s} style={{padding:'10px 14px',borderRadius:9,background:s===requested?'#2ba47a':'#fff',color:s===requested?'white':'#0a6a53',border:'1px solid #d9e8dd'}}>{s.replaceAll('_',' ')}</Link>)}
   </nav>
   {error?<p role="alert">Inspection records could not be loaded. Verify permissions and migrations.</p>:!data?.length?<section style={{background:'white',padding:30,borderRadius:17}}>There are no inspection requests in this category.</section>:
   <div style={{display:'grid',gap:18}}>{data.map(row=>{
    const details=row.properties as unknown as {title:string;slug:string|null}|null;
    return <article key={row.id} style={{background:'#fff',border:'1px solid #dcebe1',borderRadius:17,padding:23,boxShadow:'0 10px 25px #0b573014'}}>
     <div style={{display:'flex',justifyContent:'space-between',gap:18,flexWrap:'wrap'}}>
      <div><small style={{color:'#ed7314',fontWeight:800}}>REQUEST LS-I-{row.id.slice(0,8).toUpperCase()}</small>
       <h2 style={{margin:'9px 0'}}>{details?.title||'Property '+row.property_id.slice(0,8)}</h2>
       <p>{row.full_name} · {row.email} · {row.phone}</p><p style={{color:'#547465'}}>Preferred {row.preferred_date} at {row.preferred_time} WAT · {row.inspection_type} · {row.attendees} attendee(s)</p>
      </div><div><strong style={{color:'#0b7558'}}>{row.status.replaceAll('_',' ')}</strong><p style={{fontSize:12}}>Created {new Date(row.created_at).toLocaleString('en-NG')}</p>
      <a style={{color:'#0b8769'}} href={'https://www.landshopnigeria.com/properties/'+(details?.slug||row.property_id)} target="_blank" rel="noopener noreferrer">Open property ↗</a></div>
     </div>
     {row.staff_note&&<p style={{fontSize:12,color:'#5b7767'}}>Last staff note: {row.staff_note}</p>}
     {['pending_confirmation','confirmed','rescheduled'].includes(row.status)&&<InspectionReview requestId={row.id} currentStatus={row.status}/>}
    </article>})}</div>}
  </section>
 </main>;
}
