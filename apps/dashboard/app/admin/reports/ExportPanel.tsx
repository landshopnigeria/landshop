'use client';
import {useState} from 'react';
const datasets=[
 ['referrals','Referral Trees & Edges'],
 ['referral_codes','Referral Codes'],
 ['referral_wallets','Referral Wallets'],
 ['referral_rewards','Referral Reward Events'],
 ['referral_qualifications','Paystack-Qualified Referrals'],
 ['customers','Customer Profiles'],
 ['applications','Property Applications'],
 ['kyc','KYC Review Status'],
 ['application_documents','Application Document Index'],
 ['staff','Staff Accounts'],
 ['staff_reports','Daily / Monthly Staff Reports'],
 ['tasks','Assigned Tasks & Outcomes'],
 ['payments','Paystack Payments'],
 ['subscriptions','Customer Subscriptions'],
 ['properties','Property Inventory'],
 ['automation_runs','Automation Executions'],
 ['audit_events','Audit Events']
] as const;
const formats=['csv','xlsx','pdf','json'] as const;
export default function ExportPanel({owner}:{owner:boolean}){
 const [dataset,setDataset]=useState<(typeof datasets)[number][0]>('referrals');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function save(format:(typeof formats)[number]){
  if(!owner)return;
  setBusy(true);setMessage('');
  try{
   const resp=await fetch('/api/admin/exports?dataset='+encodeURIComponent(dataset)+'&format='+format,{
    credentials:'same-origin',cache:'no-store'
   });
   if(!resp.ok){let error='Export not available';try{error=(await resp.json()).error||error}catch{}throw Error(error)}
   const blob=await resp.blob();
   if(blob.size>75*1024*1024)throw Error('Export is unusually large. Contact an administrator.');
   const obj=URL.createObjectURL(blob);
   const a=document.createElement('a');
   a.href=obj;a.download='landshop-'+dataset+'-'+new Date().toISOString().slice(0,10)+'.'+format;
   document.body.append(a);a.click();a.remove();
   window.setTimeout(()=>URL.revokeObjectURL(obj),15000);
   setMessage('Export prepared. Access was recorded in Landshop’s audit trail.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to download export.')}
  finally{setBusy(false)}
 }
 return <section style={{background:'#fff',border:'1px solid #d8e7de',borderRadius:18,padding:'clamp(20px,3vw,29px)',marginTop:27}}>
  <div style={{display:'flex',alignItems:'center',gap:18,flexWrap:'wrap',justifyContent:'space-between'}}>
   <div><p style={{fontSize:11,letterSpacing:2,color:'#e77521',fontWeight:850,margin:0}}>OWNER-GOVERNED DATA</p>
    <h2 style={{fontSize:24,margin:'9px 0 4px'}}>Export Enterprise Records</h2>
    <p style={{color:'#718778',lineHeight:1.65,fontSize:12,maxWidth:800}}>Export current, server-authorized database records. KYC media remains private; exports include status and document references rather than public identity-file links.</p></div>
  </div>
  {!owner?<p style={{background:'#f0f7f1',padding:14,borderRadius:10,fontSize:13}}>Full enterprise exports require the verified Company Owner account. Role-limited managers can view authorized operational dashboards.</p>:
  <div style={{display:'grid',gap:15,marginTop:17}}>
   <label style={{display:'grid',gap:7,maxWidth:410,fontWeight:800,fontSize:13}}>Choose an operational dataset
    <select style={{padding:13,borderRadius:10,border:'1px solid #cfe3d5',background:'#fff',color:'#16452f'}} value={dataset} onChange={e=>setDataset(e.target.value as typeof dataset)}>
     {datasets.map(([id,label])=><option key={id} value={id}>{label}</option>)}
    </select>
   </label>
   <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
    {formats.map(format=><button key={format} onClick={()=>{void save(format)}} disabled={busy} style={{background:format==='xlsx'?'#0c7d5f':format==='pdf'?'#e9711b':'#eff8f0',color:format==='xlsx'||format==='pdf'?'#fff':'#0a7157',border:'1px solid #dae8dd',borderRadius:11,padding:'11px 19px',fontWeight:850,cursor:'pointer'}}>
     {busy?'Preparing…':'Export '+format.toUpperCase()}
    </button>)}
   </div>
   <p style={{fontSize:11,color:'#748c7b'}}>Server-side row cap: 10,000 per export. For large multi-year reports, use date-scoped operational reporting. XLSX/CSV/JSON preserve full selected field values; PDF uses shorter visual cell previews.</p>
   {message&&<p role="status" aria-live="polite" style={{background:'#eaf6ee',padding:13,borderRadius:11,color:'#096a53'}}>{message}</p>}
  </div>}
 </section>;
}
