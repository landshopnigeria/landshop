import {NextRequest,NextResponse} from 'next/server';
import {paystackSettings,verifyPaystackSignature,settleVerifiedPayment} from '../../../../lib/paystack';

export const runtime='nodejs';
export async function POST(request:NextRequest){
 let secret:string;
 try{secret=paystackSettings().secret;}
 catch{return NextResponse.json({error:'Payment service unavailable'},{status:503})}
 const raw=await request.text();
 if(raw.length>65536)return NextResponse.json({error:'Invalid notification size'},{status:413});
 if(!verifyPaystackSignature(raw,request.headers.get('x-paystack-signature'),secret))
  return NextResponse.json({error:'Invalid Paystack signature'},{status:401});
 let payload:any;
 try{payload=JSON.parse(raw)}catch{return NextResponse.json({error:'Invalid payload'},{status:400})}
 if(payload?.event!=='charge.success')return NextResponse.json({ok:true,ignored:true});
 const reference=payload?.data?.reference;
 if(typeof reference!=='string'||!/^LNSPAY[A-Za-z0-9]{12,56}$/.test(reference))
  return NextResponse.json({error:'Unknown transaction reference format'},{status:400});
 try{
  // Never credit a subscription based on the webhook body alone.
  // Verify directly with Paystack before calling the service-role-only RPC.
  await settleVerifiedPayment(reference);
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  console.error('Landshop payment verification pending',e instanceof Error?e.message:'unknown');
  // Retryable status; Paystack can redeliver. Ledger is idempotent.
  return NextResponse.json({error:'Payment confirmation pending'},{status:503});
 }
}
