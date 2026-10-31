import Link from 'next/link';
import PaymentStatus from './PaymentStatus';
export const dynamic='force-dynamic';
export const metadata={title:'Confirm Paystack Payment | Landshop'};
export default async function Return({searchParams}:{searchParams:Promise<{reference?:string}>}){
 const {reference}=await searchParams;
 return <main style={{minHeight:'100vh',background:'#edf7f1',display:'grid',placeItems:'center',padding:17,color:'#113f33'}}>
  <section style={{maxWidth:590,width:'100%',border:'1px solid #e0ece5',borderRadius:23,padding:30,background:'#fff',textAlign:'center'}}>
   <h1 style={{fontSize:31}}>Landshop Payment Confirmation</h1>
   <p>We verify payment directly with Paystack before updating your subscription.</p>
   <PaymentStatus reference={reference||''}/>
   <p style={{marginTop:18}}><Link href="/billing" style={{color:'#0b8d6c',fontWeight:800}}>Back to subscriptions →</Link></p>
  </section>
 </main>;
}
