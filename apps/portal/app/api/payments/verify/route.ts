import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {paystackSettings,settleVerifiedPayment} from '../../../../lib/paystack';

export const runtime='nodejs';
export async function GET(request:NextRequest){
 const ref=request.nextUrl.searchParams.get('reference')||'';
 if(!/^LNSPAY[A-Za-z0-9]{12,56}$/.test(ref))
  return NextResponse.json({error:'Invalid reference'},{status:400});
 const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!u||!k)return NextResponse.json({error:'Customer service unavailable'},{status:503});
 const store=await cookies();
 const db=createServerClient(u,k,{
  cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{getAll(){return store.getAll()},setAll(changes){try{changes.forEach(c=>store.set(c.name,c.value,c.options))}catch{}}}
 });
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:'Sign in to check payment status'},{status:401});
 const {data:txn}=await db.from('landshop_payment_transactions')
  .select('reference,status,amount_kobo,created_at').eq('reference',ref).eq('user_id',user.id).maybeSingle();
 if(!txn)return NextResponse.json({error:'Transaction not found for this account'},{status:404});
 if(txn.status!=='success'){
  try{paystackSettings();await settleVerifiedPayment(ref);}
  catch{/* A pending payment must never be reported as completed. */}
 }
 const {data:updated}=await db.from('landshop_payment_transactions').select('status')
  .eq('reference',ref).eq('user_id',user.id).maybeSingle();
 return NextResponse.json({reference:ref,status:updated?.status||'pending'},
  {headers:{'Cache-Control':'no-store'}});
}
