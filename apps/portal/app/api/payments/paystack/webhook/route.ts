import {NextRequest,NextResponse} from 'next/server';
import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(data:Record<string,unknown>,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
type VerifiedTransaction={id:number|string;reference:string;status:string;amount:number;currency:string;domain:string};
export async function POST(request:NextRequest){
 const secret=process.env.PAYSTACK_SECRET_KEY;
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 if(!secret||!serviceKey||!url)return json({error:'Payment service unavailable'},503);
 const header=request.headers.get('x-paystack-signature');
 if(!header||!/^[a-f0-9]{128}$/i.test(header))return json({error:'Invalid signature'},401);
 if(Number(request.headers.get('content-length')||0)>65536)return json({error:'Payload too large'},413);
 const raw=await request.text();
 if(Buffer.byteLength(raw,'utf8')>65536)return json({error:'Payload too large'},413);
 const expected=createHmac('sha512',secret).update(raw).digest();
 const provided=Buffer.from(header,'hex');
 if(provided.length!==expected.length||!timingSafeEqual(provided,expected))
  return json({error:'Invalid signature'},401);
 let event:unknown;
 try{event=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)}
 if(!event||typeof event!=='object')return json({error:'Invalid event'},400);
 const payload=event as {event?:unknown;data?:{reference?:unknown}};
 if(payload.event!=='charge.success')return json({received:true,ignored:true});
 const reference=payload.data?.reference;
 if(typeof reference!=='string'||!/^[A-Za-z0-9.=-]{8,100}$/.test(reference))
  return json({error:'Invalid transaction reference'},400);
 // Never fulfill an order from the signed callback alone. Query Paystack again.
 let verified:VerifiedTransaction;
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try{
   const result=await fetch('https://api.paystack.co/transaction/verify/'+encodeURIComponent(reference),{
    method:'GET',headers:{Authorization:'Bearer '+secret,Accept:'application/json'},
    cache:'no-store',signal:controller.signal
   });
   if(!result.ok)throw new Error('Paystack verification failed');
   const body=await result.json() as {status?:boolean;data?:VerifiedTransaction};
   if(body.status!==true||!body.data)throw new Error('Invalid verification response');
   verified=body.data;
  }finally{clearTimeout(timeout)}
 }catch{return json({error:'Gateway verification temporarily unavailable'},503)}
 if(verified.reference!==reference||verified.status!=='success'||
    !Number.isSafeInteger(verified.amount)||verified.amount<=0||
    verified.currency!=='NGN'|| !/^[0-9]+$/.test(String(verified.id||''))||
    !['test','live'].includes(verified.domain)||
    (secret.startsWith('sk_live_')&&verified.domain!=='live')||
    (secret.startsWith('sk_test_')&&verified.domain!=='test'))
  return json({error:'Gateway transaction not verified'},422);
 const digest=createHash('sha256').update(raw).digest('hex');
 const db=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data,error}=await db.rpc('landshop_reconcile_gateway_payment',{
  p_reference:reference,p_event_key:'paystack-'+digest,
  p_event_type:'charge.success',p_digest:digest,
  p_gateway_status:'success',p_amount_kobo:verified.amount,
  p_currency:verified.currency,p_provider_transaction_id:String(verified.id),
  p_verified_by:'server_verify'
 });
 if(error){
  // Retry non-reconciled events rather than acknowledging a failed database write.
  // Unknown or inconsistent references are recorded in server logs, never client details.
  console.error('Landshop Paystack webhook reconciliation rejected:',error.code||'db_error');
  return json({error:'Unable to reconcile gateway transaction'},503);
 }
 return json({received:true,reconciled:data==='duplicate'?'duplicate':'recorded'});
}
