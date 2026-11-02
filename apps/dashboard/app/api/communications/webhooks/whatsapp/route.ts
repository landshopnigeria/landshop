import {createClient} from '@supabase/supabase-js';
import {createHmac,createHash,timingSafeEqual} from 'node:crypto';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'};
function eq(a:string,b:string){
 const x=Buffer.from(a,'utf8'),y=Buffer.from(b,'utf8');
 return x.length===y.length&&timingSafeEqual(x,y);
}
function client(){
 const url=process.env.LANDSHOP_SUPABASE_URL,secret=process.env.LANDSHOP_SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!secret||!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url))return null;
 return createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function GET(request:Request){
 const token=process.env.LANDSHOP_WHATSAPP_WEBHOOK_VERIFY_TOKEN;
 if(!token)return new Response(null,{status:503,headers});
 const url=new URL(request.url);
 const provided=url.searchParams.get('hub.verify_token')||'';
 const mode=url.searchParams.get('hub.mode');
 const challenge=url.searchParams.get('hub.challenge');
 if(mode!=='subscribe'||!provided||!eq(provided,token)||!challenge||!(/^[0-9]{1,50}$/.test(challenge)))
  return new Response(null,{status:403,headers});
 return new Response(challenge,{status:200,headers:{...headers,'Content-Type':'text/plain;charset=UTF-8'}});
}
export async function POST(request:Request){
 const secret=process.env.LANDSHOP_WHATSAPP_APP_SECRET;
 if(!secret)return new Response(null,{status:503,headers});
 if(Number(request.headers.get('content-length')||0)>65536)return new Response(null,{status:413,headers});
 const raw=await request.text();
 if(Buffer.byteLength(raw,'utf8')>65536)return new Response(null,{status:413,headers});
 const provided=request.headers.get('x-hub-signature-256')||'';
 const calculated='sha256='+createHmac('sha256',secret).update(raw,'utf8').digest('hex');
 if(!eq(provided,calculated))return new Response(null,{status:401,headers});
 let body:unknown;
 try{body=JSON.parse(raw)}catch{return new Response(null,{status:400,headers})}
 if(!body||typeof body!=='object')return new Response(null,{status:400,headers});
 const db=client();
 if(!db)return new Response(null,{status:503,headers});
 type ProviderStatus={id?:string;status?:string;timestamp?:string};
 type ProviderPayload={entry?:{changes?:{value?:{statuses?:ProviderStatus[]}}[]}[]};
 const root=body as ProviderPayload;
 const statuses=root.entry?.flatMap(e=>e.changes?.flatMap(c=>c.value?.statuses||[])||[])||[];
 if(statuses.length>50)return new Response(null,{status:413,headers});
 for(const item of statuses){
  const id=item.id||'',status=item.status||'';
  if(!/^wamid\.[A-Za-z0-9_=+/.-]{10,230}$/.test(id))continue;
  if(!['sent','delivered','read','failed'].includes(status))continue;
  const {data:outbox,error:lookupError}=await db.from('landshop_comm_outbox')
   .select('id,status').eq('channel','whatsapp').eq('provider_message_id',id).maybeSingle();
  if(lookupError)return new Response(null,{status:503,headers});
  if(!outbox)continue;
  const when=item.timestamp&&/^[0-9]{9,14}$/.test(item.timestamp)
   ?new Date(Number(item.timestamp)*1000).toISOString():new Date().toISOString();
  const event=status==='read'?'opened':status==='sent'?'accepted':status;
  const eventName=event==='failed'?'failed':event;
  const eventId=createHash('sha256').update(id+':'+status+':'+(item.timestamp||'')).digest('hex');
  const {error:insertError}=await db.from('landshop_comm_delivery_events').upsert({
   outbox_id:outbox.id,event_name:eventName,provider_event_id:eventId,occurred_at:when
  },{onConflict:'outbox_id,event_name,provider_event_id',ignoreDuplicates:true});
  if(insertError)return new Response(null,{status:503,headers});
  if(status==='delivered'||status==='read'){
   const {error:updateError}=await db.from('landshop_comm_outbox').update({
    status:'delivered',delivered_at:when,updated_at:new Date().toISOString()
   }).eq('id',outbox.id).in('status',['accepted','delivered']);
   if(updateError)return new Response(null,{status:503,headers});
  }else if(status==='failed'){
   const {error:updateError}=await db.from('landshop_comm_outbox').update({
    status:'failed',updated_at:new Date().toISOString()
   }).eq('id',outbox.id).eq('status','accepted');
   if(updateError)return new Response(null,{status:503,headers});
  }
 }
 return new Response(null,{status:204,headers});
}
