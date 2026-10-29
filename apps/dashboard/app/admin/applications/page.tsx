import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
export const dynamic='force-dynamic';
export const metadata={title:'Applications Review | Landshop Command Center'};
type Search={status?:string};
export default async function ApplicationQueue({searchParams}:{searchParams:Promise<Search>}){
 const {status}=await searchParams;
 const accepted=['draft','submitted','review','approved','rejected','withdrawn'];
 const current=accepted.includes(status||'')?status||'':'';
 const {db}=await requireLandshopStaff(['owner','admin','operations','legal','finance']);
 let req=db.from('applications').select('id,kind,status,created_at')
  .order('created_at',{ascending:false}).limit(100);
 if(current)req=req.eq('status',current);
 const {data,error}=await req;
 return <main style={{minHeight:'100vh',padding:'clamp(20px,5vw,60px)',background:'#f1f8f4',color:'#143d33',fontFamily:'Arial,sans-serif'}}>
  <header style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:15,maxWidth:1250,margin:'auto'}}>
   <Link href="/admin" style={{color:'#087b63',fontWeight:800}}>← Global Command Center</Link>
   <Link href="/admin/kyc" style={{color:'#087b63'}}>KYC Review →</Link>
  </header>
  <section style={{maxWidth:1250,margin:'30px auto'}}><span style={{fontSize:11,fontWeight:800,letterSpacing:2,color:'#07896d'}}>OPERATIONS · APPLICATION REVIEW</span>
   <h1 style={{fontSize:'clamp(29px,4vw,46px)',margin:'9px 0'}}>Applications & Mortgage Requests</h1>
   <p style={{maxWidth:850,lineHeight:1.6,color:'#537365'}}>Review actual submitted product applications. Viewing personal and financial answers is restricted to authorized Landshop reviewers; approval decisions require controlled underwriting and verification.</p>
   <nav style={{display:'flex',flexWrap:'wrap',gap:10,margin:'22px 0'}} aria-label="Filter by application status">
    {['',...accepted].map(s=><Link key={s} href={'/admin/applications'+(s?'?status='+s:'')} style={{borderRadius:100,padding:'10px 14px',textDecoration:'none',fontSize:13,fontWeight:700,background:current===s?'#067f65':'white',color:current===s?'white':'#285949',border:'1px solid #cfe5da'}}>{s?s[0].toUpperCase()+s.slice(1):'All'}</Link>)}
   </nav>
   {error?<p role="alert">Application records could not be loaded with your current permissions.</p>:!data?.length?
    <div style={{background:'white',border:'1px solid #d9e8df',borderRadius:18,padding:30}}>No application records match this status.</div>:
    <div style={{overflowX:'auto',background:'white',border:'1px solid #d9e8df',borderRadius:18}}>
     <table style={{width:'100%',borderCollapse:'collapse',minWidth:650}}>
      <thead><tr>{['Reference','Product','Status','Received','Review'].map(title=><th key={title} style={{textAlign:'left',padding:17,borderBottom:'1px solid #d9e8df'}}>{title}</th>)}</tr></thead>
      <tbody>{data.map(item=><tr key={item.id}><td style={{padding:16,borderBottom:'1px solid #edf4f0',fontSize:13}}>{item.id.slice(0,8)}…</td><td style={{padding:16,borderBottom:'1px solid #edf4f0'}}>{item.kind.replaceAll('_',' ')}</td><td style={{padding:16,borderBottom:'1px solid #edf4f0',textTransform:'capitalize'}}>{item.status}</td><td style={{padding:16,borderBottom:'1px solid #edf4f0'}}>{new Date(item.created_at).toLocaleDateString('en-NG')}</td><td style={{padding:16,borderBottom:'1px solid #edf4f0'}}><Link href={'/admin/applications/'+item.id} style={{color:'#007e61'}}>View case →</Link></td></tr>)}</tbody>
     </table>
    </div>}
   <p style={{fontSize:12,color:'#5f776a',marginTop:20}}>Restricted to authorized operations, finance, legal, administrative and owner roles. No financial outcomes are generated from mock data.</p>
  </section>
 </main>;
}