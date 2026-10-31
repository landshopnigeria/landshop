import Link from 'next/link';
import {requireLandshopStaff} from '../../../../lib/admin-access';
import ExportRecords from '../ExportRecords';
export const dynamic='force-dynamic';
export const metadata={title:'Referral Tree & Export | Landshop Command Center'};
type Edge={referrer_id:string;referee_id:string;source_code:string;joined_at:string;depth:number};
export default async function ReferralReport(){
 const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const {data,error}=await db.rpc('landshop_management_referral_export',{p_root:null,p_depth:8});
 const rows=(data||[]) as Edge[];
 return <main style={{minHeight:'100vh',padding:'clamp(18px,5vw,64px)',background:'#f4f9f6',color:'#174533'}}>
  <div style={{maxWidth:1100,margin:'auto'}}>
   <Link href="/admin/reports">← Operational Reports</Link>
   <h1>Referral Tree & Management Export</h1>
   <p>Authenticated Command Center view of referral relationships and attribution. Referral signups alone do not create commissions or cash rewards.</p>
   {error?<p role="alert">Unable to access referral records: {error.message}</p>:<>
    <p><strong>{rows.length}</strong> referral relationships loaded.</p>
    <ExportRecords rows={rows.map(x=>({referrer_id:x.referrer_id,referee_id:x.referee_id,source_code:x.source_code,joined_at:x.joined_at,depth:x.depth}))} basename="landshop-referrals"/>
    <div style={{overflowX:'auto',marginTop:22,background:'white',borderRadius:14,border:'1px solid #d6e9dd'}}>
     <table style={{borderCollapse:'collapse',width:'100%',minWidth:700}}>
      <thead><tr>{['Referrer','Referred Member','Source Code','Joined','Level'].map(h=><th key={h} style={{padding:12,textAlign:'left'}}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r,i)=><tr key={r.referee_id+'-'+i}><td style={{padding:12}}>{r.referrer_id}</td><td style={{padding:12}}>{r.referee_id}</td><td style={{padding:12}}>{r.source_code}</td><td style={{padding:12}}>{new Date(r.joined_at).toLocaleDateString('en-NG')}</td><td style={{padding:12}}>{r.depth}</td></tr>)}</tbody>
     </table>
     {rows.length===0&&<p style={{padding:20}}>No referral relationships have been recorded yet.</p>}
    </div>
    <p style={{fontSize:13,color:'#667e70'}}>The API may cap the returned result set. This screen does not claim a complete export beyond the records loaded.</p>
   </>}
  </div>
 </main>;
}
