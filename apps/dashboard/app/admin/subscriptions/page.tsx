import Link from 'next/link';
import {requireLandshopStaff} from '../../../lib/admin-access';
import BillingManagement from './BillingManagement';
export const dynamic='force-dynamic';
export const metadata={title:'Subscriptions & Paystack | Landshop Command Center'};
export default async function BillingAdmin(){
 const {db,user}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const [plans,subscriptions,transactions,membership]=await Promise.all([
  db.from('landshop_subscription_plans').select('id,code,name,description,amount_kobo,duration_days,is_active').order('created_at',{ascending:false}).limit(100),
  db.from('landshop_customer_subscriptions').select('id,user_id,plan_id,status,expires_at,updated_at').order('updated_at',{ascending:false}).limit(200),
  db.from('landshop_payment_transactions').select('id,user_id,plan_id,reference,status,amount_kobo,provider_domain,paid_at,created_at').order('created_at',{ascending:false}).limit(200),
  db.from('organization_members').select('role').eq('user_id',user.id).eq('status','active').eq('role','owner').limit(1).maybeSingle()
 ]);
 const complete=transactions.data?.filter(x=>x.status==='success'&&x.provider_domain==='live')||[];
 const collected=complete.reduce((n,x)=>n+Number(x.amount_kobo||0),0);
 return <main style={{minHeight:'100vh',background:'#f0f8f3',color:'#153d32',padding:'clamp(18px,4vw,55px)'}}>
  <div style={{maxWidth:1250,margin:'auto'}}>
   <Link href="/admin" style={{color:'#087c61',fontWeight:800}}>← Global Command Center</Link>
   <p style={{marginTop:24,color:'#dc731b',letterSpacing:1.5,fontSize:11,fontWeight:800}}>LANDSHOP FINANCE GOVERNANCE</p>
   <h1 style={{fontSize:'clamp(30px,4vw,46px)',margin:'8px 0'}}>Subscriptions & Paystack</h1>
   <p style={{lineHeight:1.7,color:'#6a8578',maxWidth:850}}>Approve subscription plans, review actual payment verification and manage paid customer access. Only the verified owner can set prices or suspend customer subscriptions. Paystack verification—not a browser redirect—determines successful payments.</p>
   <div style={{display:'flex',flexWrap:'wrap',gap:13,margin:'24px 0'}}>
    {[['Published Plans',(plans.data||[]).filter(x=>x.is_active).length],['Live Verified Transactions',complete.length],['Verified Live Collections',new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(collected/100)]].map(([label,value])=>
     <div key={String(label)} style={{flex:'1 1 220px',padding:18,borderRadius:15,background:'#fff',border:'1px solid #deece2'}}><small>{label}</small><h2 style={{fontSize:24,margin:'10px 0'}}>{value}</h2></div>)}
   </div>
   {(plans.error||subscriptions.error||transactions.error)&&<p role="alert" style={{background:'#fff0e6',padding:14}}>Some billing records are unavailable. Check your authorised role and database migration.</p>}
   <BillingManagement owner={Boolean(membership.data)} plans={plans.data||[]} subscriptions={subscriptions.data||[]} transactions={transactions.data||[]}/>
  </div>
 </main>;
}
