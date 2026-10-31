'use client';
import {useState} from 'react';
import Link from 'next/link';
type Plan={id:string;code:string;name:string;description:string;amount_kobo:number;currency:string;duration_days:number};
type Sub={id:string;plan_id:string;status:string;expires_at:string};
type Pay={id:string;plan_id:string;reference:string;status:string;amount_kobo:number;created_at:string};
const format=(kobo:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(kobo/100);
export default function BillingClient({plans,subscriptions,payments}:{plans:Plan[];subscriptions:Sub[];payments:Pay[]}){
 const [pending,setPending]=useState<string|null>(null),[msg,setMsg]=useState('');
 async function checkout(planId:string){
  setPending(planId);setMsg('');
  try{
   const res=await fetch('/api/payments/initialize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan_id:planId}),credentials:'same-origin'});
   const body=await res.json();
   if(!res.ok||!body.authorization_url)throw Error(body.error||'Unable to open checkout');
   const url=new URL(body.authorization_url);
   if(url.protocol!=='https:'||url.hostname!=='checkout.paystack.com')throw Error('Invalid payment provider URL');
   window.location.assign(url.href);
  }catch(e){setMsg(e instanceof Error?e.message:'Checkout unavailable');setPending(null)}
 }
 return <main style={{minHeight:'100vh',padding:'clamp(18px,4vw,54px)',background:'linear-gradient(140deg,#f0faf3,#e9f2ee)',color:'#103e34',fontFamily:'Helvetica Neue,Arial,sans-serif'}}>
  <section style={{maxWidth:1190,margin:'auto'}}>
   <Link href="/" style={{color:'#08785f',fontWeight:800}}>← Customer Portal</Link>
   <p style={{color:'#eb7518',fontSize:11,fontWeight:850,letterSpacing:2,marginTop:26}}>DEVELOP · INCUBATE · GROW</p>
   <h1 style={{fontSize:'clamp(31px,4vw,51px)',margin:'9px 0',letterSpacing:'-.04em'}}>Landshop <span style={{color:'#0b956d'}}>Subscriptions</span></h1>
   <p style={{color:'#607f70',lineHeight:1.75,maxWidth:800}}>Choose an approved Landshop plan, pay securely through Paystack, and view your actual payment and renewal records. Your account is activated only after Paystack verifies your transaction.</p>
   {msg&&<p role="alert" style={{padding:15,background:'#fff4e8',borderRadius:12,color:'#99501b'}}>{msg}</p>}
   <h2 style={{marginTop:30,fontSize:24}}>Available Plans</h2>
   {plans.length===0?<div style={{background:'#fff',borderRadius:18,padding:27,border:'1px solid #deebe2'}}><strong>Approved plans are not yet published.</strong><p style={{color:'#71887b'}}>The Landshop Owner must approve subscription amounts before Paystack checkout can be activated. No charges can be initiated without a published plan.</p></div>:
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:17}}>
    {plans.map(plan=>{
     const sub=subscriptions.find(s=>s.plan_id===plan.id);
     const currentlyActive=Boolean(sub?.status==='active'&&new Date(sub.expires_at)>new Date());
     return <article key={plan.id} style={{border:'1px solid #dfebe4',background:'#fff',borderRadius:19,padding:25,display:'grid',gap:14,alignContent:'space-between'}}>
      <div><small style={{color:'#08745e',fontWeight:850,letterSpacing:1}}>{plan.duration_days} DAY ACCESS</small>
       <h3 style={{fontSize:22,margin:'10px 0'}}>{plan.name}</h3>
       <p style={{color:'#688273',fontSize:13,lineHeight:1.6,minHeight:38}}>{plan.description}</p>
       <strong style={{color:'#085d4b',fontSize:30}}>{format(plan.amount_kobo)}</strong>
       <p style={{color:'#7b8f82',fontSize:12}}>{currentlyActive?'Active until '+new Date(sub!.expires_at).toLocaleDateString('en-NG'):'One-time payment for the displayed period; renewal is customer-initiated.'}</p>
      </div>
      <button type="button" onClick={()=>checkout(plan.id)} disabled={pending!==null} style={{border:0,borderRadius:11,padding:'14px 18px',color:'#fff',fontWeight:800,cursor:'pointer',background:'linear-gradient(90deg,#0c4336,#0ba476)',opacity:pending?0.65:1}}>
       {pending===plan.id?'Connecting securely…':currentlyActive?'Renew subscription':'Subscribe with Paystack'}
      </button>
     </article>})}
   </div>}
   <h2 style={{marginTop:36,fontSize:23}}>My Payment & Renewal History</h2>
   {payments.length===0?<p style={{color:'#789183'}}>No payment attempts recorded yet.</p>:
   <div style={{overflowX:'auto',borderRadius:14,background:'#fff',border:'1px solid #e0ece3'}}>
    <table style={{width:'100%',borderCollapse:'collapse',minWidth:650,textAlign:'left'}}>
     <thead><tr>{['Reference','Amount','Status','Date'].map(h=><th key={h} style={{padding:14,borderBottom:'1px solid #d8e7da',fontSize:12,color:'#547767'}}>{h}</th>)}</tr></thead>
     <tbody>{payments.map(p=><tr key={p.id}><td style={{padding:14,fontSize:12}}>{p.reference}</td><td style={{padding:14,fontWeight:700}}>{format(p.amount_kobo)}</td><td style={{padding:14,textTransform:'capitalize',color:p.status==='success'?'#087c5e':'#b0782e'}}>{p.status}</td><td style={{padding:14,fontSize:12}}>{new Date(p.created_at).toLocaleDateString('en-NG')}</td></tr>)}</tbody>
    </table>
   </div>}
   <p style={{fontSize:12,lineHeight:1.7,color:'#789083',marginTop:24}}>Subscription access is determined by verified payment, expiry and account status. A payment attempt alone never grants access. For refunds or reversals, contact the Landshop billing team.</p>
  </section>
 </main>;
}
