import {createClient} from '@supabase/supabase-js';
import {createHash,timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'};

function secureMatch(value:string,expected:string){
 const a=Buffer.from(value,'utf8'),b=Buffer.from(expected,'utf8');
 return a.length===b.length&&timingSafeEqual(a,b);
}
function providerAuth(request:Request){
 const username=process.env.LANDSHOP_POSTMARK_WEBHOOK_USERNAME;
 const password=process.env.LANDSHOP_POSTMARK_WEBHOOK_PASSWORD;
 if(!username||!password)return 'unconfigured';
 const h=request.headers.get('authorization')||'';
 if(!h.startsWith('Basic ')||h.length>1800)return 'denied';
 let raw='';
 try{raw=Buffer.from(h.slice(6),'base64').toString('utf8')}catch{return 'denied'}
 return secureMatch(raw,username+':'+password)?'allowed':'denied';
}
function client(){
 const url=process.env.LANDSHOP_SUPABASE_URL;
 const key=process.env.LANDSHOP_SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key||!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url))return null;
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function POST(request:Request){
 const auth=providerAuth(request);
 if(auth==='unconfigured')return NextResponse.json({error:'webhook not configured'},{status:503,headers:noStore});
 if(auth!=='allowed')return new Response(null,{status:401,headers:{...noStore,'WWW-Authenticate':'Basic realm="Landshop Postmark Webhook"'}});
 if(!request.headers.get('content-type')?.toLowerCase().includes('application/json'))return new Response(null,{status:415,headers:noStore});
 if(Number(request.headers.get('content-length')||0)>16384)return new Response(null,{status:413,headers:noStore});
 const raw=await request.text();
 if(Buffer.byteLength(raw,'utf8')>16384)return new Response(null,{status:413,headers:noStore});
 let event:Record<string,unknown>;
 try{event=JSON.parse(raw)}catch{return new Response(null,{status:400,headers:noStore})}
 const msg=typeof event.MessageID==='string'?event.MessageID:'';
 const kind=typeof event.RecordType==='string'?event.RecordType:'';
 if(!/^[A-Za-z0-9-]{18,80}$/.test(msg))return new Response(null,{status:400,headers:noStore});
 const names:Record<string,'delivered'|'bounced'|'complained'|'opened'|'clicked'>={
  Delivery:'delivered',Bounce:'bounced',SpamComplaint:'complained',Open:'opened',Click:'clicked'
 };
 const name=names[kind];
 if(!name)return new Response(null,{status:204,headers:noStore});
 const db=client();
 if(!db)return new Response(null,{status:503,headers:noStore});
 const {data:outbox,error:lookupError}=await db.from('landshop_comm_outbox')
  .select('id,contact_id,status').eq('channel','email').eq('provider_message_id',msg).maybeSingle();
 if(lookupError)return new Response(null,{status:503,headers:noStore});
 if(!outbox)return new Response(null,{status:204,headers:noStore});

 const trace=request.headers.get('x-pm-webhook-trace-id');
 const identity=trace&&trace.length<=200?trace:createHash('sha256').update(
  JSON.stringify({msg,kind,at:event.DeliveredAt||event.BouncedAt||event.ReceivedAt||event.ClickedAt||event.ID||''})
 ).digest('hex');
 const delivered=typeof event.DeliveredAt==='string'&&!Number.isNaN(Date.parse(event.DeliveredAt))
  ?new Date(event.DeliveredAt).toISOString():new Date().toISOString();
 const {error:eventError}=await db.from('landshop_comm_delivery_events').upsert({
  outbox_id:outbox.id,event_name:name,provider_event_id:identity,occurred_at:delivered
 },{onConflict:'outbox_id,event_name,provider_event_id',ignoreDuplicates:true});
 if(eventError)return new Response(null,{status:503,headers:noStore});

 if(name==='delivered'){
  const {error:updateError}=await db.from('landshop_comm_outbox').update({
   status:'delivered',delivered_at:delivered,updated_at:new Date().toISOString()
  }).eq('id',outbox.id).eq('status','accepted');
  if(updateError)return new Response(null,{status:503,headers:noStore});
 }else if(name==='bounced'||name==='complained'){
  const {error:updateError}=await db.from('landshop_comm_outbox').update({
   status:'failed',updated_at:new Date().toISOString()
  }).eq('id',outbox.id).in('status',['accepted','delivered']);
  if(updateError)return new Response(null,{status:503,headers:noStore});
  if(name==='complained'){
   const {error:consentError}=await db.from('landshop_comm_contacts')
    .update({marketing_consent:false,updated_at:new Date().toISOString()}).eq('id',outbox.contact_id);
   if(consentError)return new Response(null,{status:503,headers:noStore});
  }
 }
 // Open and click receipts are optional and do not prove human reading.
 return new Response(null,{status:204,headers:noStore});
}
