import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireLandshopStaff} from '../../../../lib/admin-access';
export const dynamic='force-dynamic';
export default async function ReviewApplication({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(id))notFound();
 const {db}=await requireLandshopStaff(['owner','admin','operations','legal','finance']);
 const {data,error}=await db.from('applications').select('id,applicant_id,kind,status,created_at,answers').eq('id',id).maybeSingle();
 if(error||!data)notFound();
 const {data:documents}=await db.from('application_documents').select('id,document_type,created_at').eq('application_id',id);
 const masked=(key:string,value:unknown)=>{
  const s=String(value??'');
  if(/account_number|nhf_number/i.test(key))return s.length>4?'•••• '+s.slice(-4):'••••';
  if(/declaration_accepted/i.test(key))return s==='true'?'Accepted':'Not accepted';
  return s;
 };
 const fields=Object.entries((data.answers||{}) as Record<string,unknown>).filter(([key])=>key!=='form_slug');
 return <main style={{padding:'clamp(18px,5vw,62px)',background:'#f3f9f5',minHeight:'100vh',fontFamily:'Arial,sans-serif',color:'#173d33'}}>
   <div style={{maxWidth:1150,margin:'auto'}}><Link href="/admin/applications" style={{color:'#068362'}}>← Application Queue</Link>
   <h1>Application Review</h1><p>Reference: {data.id}</p>
   <div style={{display:'flex',gap:20,flexWrap:'wrap',marginBottom:25}}><strong>Product: {data.kind.replaceAll('_',' ')}</strong><strong>Status: {data.status}</strong><span>Received {new Date(data.created_at).toLocaleDateString('en-NG')}</span></div>
   <section style={{background:'white',border:'1px solid #d7e9dd',borderRadius:19,padding:24,marginBottom:20}}>
    <h2>Submitted Application Information</h2><p style={{color:'#667f73'}}>Restricted reviewer view. Sensitive account identifiers are masked. Do not copy personal data into unapproved systems.</p>
    <dl style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:15}}>
     {fields.map(([key,value])=><div key={key} style={{padding:13,background:'#f4faf6',borderRadius:12,minWidth:0,overflowWrap:'anywhere'}}><dt style={{fontSize:12,color:'#57806b',textTransform:'capitalize'}}>{key.replaceAll('_',' ')}</dt><dd style={{fontWeight:700,margin:'6px 0 0'}}>{masked(key,value)}</dd></div>)}
    </dl>
   </section>
   <section style={{background:'white',border:'1px solid #d7e9dd',borderRadius:19,padding:24}}>
    <h2>Supporting Documents</h2>
    {documents?.length?<ul>{documents.map(doc=><li key={doc.id}>{doc.document_type.replaceAll('_',' ')} — registered {new Date(doc.created_at).toLocaleDateString('en-NG')}</li>)}</ul>:<p>No securely registered documents are visible to this role.</p>}
    <p>Document downloads remain private and require a separate audited access process. Application status cannot be changed from this read-only screen.</p>
   </section></div>
  </main>;
}