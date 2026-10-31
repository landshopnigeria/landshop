import {createHmac,timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';

export const PAYSTACK_API='https://api.paystack.co';
export const CALLBACK_URL='https://portal.landshopnigeria.com/billing/return';
type PaystackTxn={id:number|string;reference:string;amount:number;currency:string;status:string;domain:string;paid_at:string|null};
export function paystackSettings(){
 const key=process.env.PAYSTACK_SECRET_KEY||'';
 const mode=process.env.PAYSTACK_MODE;
 if(mode!=='live'&&mode!=='test')throw Error('PAYSTACK_MODE must explicitly be live or test');
 if(process.env.NODE_ENV==='production'&&mode!=='live')throw Error('Production must never grant subscriptions from Paystack test payments');
 if(!key.startsWith(mode==='live'?'sk_live_':'sk_test_'))throw Error('Matching Paystack server secret key is not configured');
 return {secret:key,mode};
}
export function verifyPaystackSignature(payload:string,signature:string|null,secret:string){
 if(!signature||!/^[a-f0-9]{128}$/i.test(signature))return false;
 const expected=createHmac('sha512',secret).update(payload).digest();
 const actual=Buffer.from(signature,'hex');
 return expected.length===actual.length&&timingSafeEqual(expected,actual);
}
export function adminDb(){
 const u=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const k=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!u||!k)throw Error('Private Supabase service-role key not configured on the billing server');
 return createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function verifyTransaction(reference:string){
 if(!/^LNSPAY[A-Za-z0-9]{12,56}$/.test(reference))throw Error('Invalid payment reference');
 const {secret,mode}=paystackSettings();
 const reply=await fetch(PAYSTACK_API+'/transaction/verify/'+encodeURIComponent(reference),{
  method:'GET',headers:{Authorization:'Bearer '+secret},
  cache:'no-store',signal:AbortSignal.timeout(12000)
 });
 if(!reply.ok)throw Error('Provider transaction verification unavailable');
 const parsed=await reply.json();
 if(parsed.status!==true||!parsed.data)throw Error('Provider verification failed');
 const data=parsed.data as PaystackTxn;
 if(data.reference!==reference||data.status!=='success'||data.currency!=='NGN'||data.domain!==mode
  ||!Number.isSafeInteger(data.amount)||data.amount<1)throw Error('Payment is not verified for this Landshop environment');
 return {data,mode};
}
export async function settleVerifiedPayment(reference:string){
 const {data}=await verifyTransaction(reference);
 // Paystack IDs are unsigned 64-bit; JavaScript only safely represents up to 53 bits.
 // If unexpectedly unsafe, use the *verified unique reference* for reconciliation.
 const providerId=(typeof data.id==='number'&&Number.isSafeInteger(data.id))||typeof data.id==='string'
  ?String(data.id):'reference-'+reference;
 const {data:ok,error}=await adminDb().rpc('landshop_paystack_settle',{
  p_reference:reference,p_amount_kobo:data.amount,p_currency:data.currency,
  p_provider_id:providerId,p_paid_at:data.paid_at||new Date().toISOString(),p_domain:data.domain
 });
 if(error||ok!==true)throw Error('Verified payment is awaiting ledger reconciliation');
 return true;
}
