
import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
export const dynamic='force-dynamic';
export const metadata={title:'Contact & Property Enquiries | Landshop Command Center'};
export default async function LeadInbox(){
 const {db}=await requireLandshopStaff(['owner','executive','admin','operations','sales','marketing']);
 const {data,error}=await db.from('contact_enquiries')
 .select('id,full_name,email,phone,topic,message,status,created_at')
 .order('created_at',{ascending:false}).limit(100);
 return <main style={{background:'#f4f9f6',minHeight:'100vh',padding:'clamp(20px,5vw,65px)',fontFamily:'Arial,Helvetica,sans-serif',color:'#103e32'}}>
 <div style={{maxWidth:1280,margin:'auto'}}>
  <Link href="/admin" style={{color:'#007c5f',fontSize:13}}>← Global Command Center</Link>
  <header style={{margin:'26px 0 30px'}}><span style={{color:'#00866b',fontWeight:850,letterSpacing:2,fontSize:11}}>LANDSHOP CRM · RESTRICTED</span><h1 style={{fontSize:'clamp(30px,4.4vw,51px)',letterSpacing:-1,fontWeight:580,margin:'13px 0'}}>Website enquiries & leads</h1><p style={{color:'#668071',maxWidth:720,lineHeight:1.7}}>Messages submitted using the Landshop contact form. Only authorized active Landshop management roles can view these records. Customer consent permits individual enquiry responses, not general marketing.</p></header>
  {error?<section role="alert" style={{background:'#fff2e8',padding:22,borderRadius:16}}>Enquiry records are not accessible. Confirm migration 0024, organization membership and the current account’s role.</section>:!data?.length?<section style={{padding:30,background:'#fff',borderRadius:20,border:'1px solid #dcebe3'}}>No website enquiries have been recorded.</section>:
  <div style={{display:'grid',gap:15}}>{data.map(item=><article key={item.id} style={{border:'1px solid #d9e8dd',background:'#ffffffed',borderRadius:18,padding:'clamp(16px,3vw,25px)',boxShadow:'0 8px 25px #14402e0a'}}>
   <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
    <div><strong style={{fontSize:19,fontWeight:620}}>{item.full_name}</strong><p style={{color:'#537e6d',margin:'7px 0',fontSize:13}}>{item.topic}</p></div>
    <div><span style={{padding:'7px 12px',background:'#eaf8ef',color:'#00664e',borderRadius:12,fontSize:11}}>{item.status.replaceAll('_',' ')}</span><span style={{fontSize:11,color:'#718779',marginLeft:12}}>{new Date(item.created_at).toLocaleString('en-NG')}</span></div>
   </div>
   <p style={{lineHeight:1.7,whiteSpace:'pre-wrap',overflowWrap:'anywhere',color:'#456455'}}>{item.message}</p>
   <div style={{display:'flex',flexWrap:'wrap',gap:15,fontSize:13,borderTop:'1px solid #e9f0eb',paddingTop:14}}>
    <a href={'mailto:'+encodeURIComponent(item.email)} style={{color:'#00765b'}}>Email: {item.email} ↗</a>
    {item.phone&&<a href={'tel:'+item.phone.replace(/[^+0-9]/g,'')} style={{color:'#00765b'}}>Call: {item.phone} ↗</a>}
    <span style={{color:'#82978c',marginLeft:'auto'}}>Ref: {item.id.slice(0,8).toUpperCase()}</span>
   </div>
  </article>)}</div>}
  <p style={{fontSize:12,color:'#708678',marginTop:28}}>Enquiry messages may contain personal data. Do not export or share them outside authorized business processes.</p>
 </div>
 </main>;
}
