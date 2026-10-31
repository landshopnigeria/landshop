import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {CALLBACK_URL,PAYSTACK_API,paystackSettings} from '../../../../lib/paystack';

export const runtime='nodejs';
export async function POST(request:NextRequest){
 const origin=request.headers.get('origin');
 if(origin&&origin!=='https://portal.landshopnigeria.com')
  return NextResponse.json({error:'Invalid payment request origin'},{status:403});
 try{
  const {secret}=paystackSettings(); // fail closed until real owner keys are installed
  const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!u||!k)throw Error('Auth configuration is unavailable');
  const store=await cookies();
  const db=createServerClient(u,k,{
   cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
   cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(c=>store.set(c.name,c.value,c.options))}catch{}}}
  });
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user?.email||!user.email_confirmed_at)
   return NextResponse.json({error:'A verified customer sign-in is required'},{status:401});
  const body=await request.json().catch(()=>null);
  const planId=typeof body?.plan_id==='string'?body.plan_id:'';
  if(!/^[a-f0-9]{8}-[a-f0-9-]{27,}$/.test(planId))
   return NextResponse.json({error:'Choose a valid Landshop plan'},{status:400});
  const {data:intent,error:intentError}=await db.rpc('landshop_checkout_intent_create',{p_plan:planId});
  const row=Array.isArray(intent)?intent[0]:null;
  if(intentError||!row?.reference||!Number.isSafeInteger(Number(row.amount_kobo)))
   return NextResponse.json({error:intentError?.message||'Unable to start checkout'},{status:400});
  const response=await fetch(PAYSTACK_API+'/transaction/initialize',{
   method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},
   body:JSON.stringify({
    email:user.email,amount:String(row.amount_kobo),currency:'NGN',reference:row.reference,
    callback_url:CALLBACK_URL,metadata:JSON.stringify({source:'landshop_customer_subscription'})
   }),cache:'no-store',signal:AbortSignal.timeout(12000)
  });
  if(!response.ok)throw Error('Paystack did not accept the checkout request');
  const parsed=await response.json();
  const url=new URL(String(parsed?.data?.authorization_url||''));
  if(parsed?.status!==true||url.protocol!=='https:'||url.hostname!=='checkout.paystack.com'
    ||parsed?.data?.reference!==row.reference)throw Error('Unsafe or invalid provider authorization URL');
  return NextResponse.json({authorization_url:url.href,reference:row.reference},{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  console.error('Landshop checkout initialization unavailable',e instanceof Error?e.message:'unavailable');
  return NextResponse.json({error:'Secure checkout is not yet available. Please contact Landshop billing support.'},{status:503});
 }
}
