import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {createServerClient} from '@supabase/ssr';
import BillingClient from './BillingClient';
export const dynamic='force-dynamic';
export const metadata={title:'Landshop Subscriptions & Payments'};
export default async function BillingPage(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Subscription service is not configured.</main>;
 const store=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',path:'/',secure:true},
 cookies:{getAll(){return store.getAll()},setAll(c){try{c.forEach(v=>store.set(v.name,v.value,v.options))}catch{}}}});
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect('/?mode=signin');
 const [plans,subscriptions,transactions]=await Promise.all([
  db.from('landshop_subscription_plans').select('id,code,name,description,amount_kobo,currency,duration_days').eq('is_active',true).order('amount_kobo',{ascending:true}).limit(35),
  db.from('landshop_customer_subscriptions').select('id,plan_id,status,expires_at').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(30),
  db.from('landshop_payment_transactions').select('id,plan_id,reference,status,amount_kobo,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30)
 ]);
 return <BillingClient plans={plans.data||[]} subscriptions={subscriptions.data||[]} payments={transactions.data||[]}/>;
}
