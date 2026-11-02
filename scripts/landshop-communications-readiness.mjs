#!/usr/bin/env node
// Read-only credential and authorization readiness report. No customer data,
// key content or provider response body is logged. No customer sends.
import {createClient} from '@supabase/supabase-js';
const e=process.env;
const yes=name=>e[name]==='true';
const exists=name=>!!e[name]?.trim();
const bool=v=>v?'READY':'MISSING';
const messages=[];
function log(group,state){messages.push({group,state});console.log(group+': '+state)}
log('Global send authorization',yes('LANDSHOP_COMM_LIVE_ENABLED')?'enabled':'disabled');
log('Key rotation attestation',yes('LANDSHOP_COMM_ROTATION_CONFIRMED')?'confirmed':'not confirmed');
log('Worker privileged database key',bool(exists('LANDSHOP_SUPABASE_SERVICE_ROLE_KEY')));
log('Production database URL',bool(/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(e.LANDSHOP_SUPABASE_URL||'')));
const from=e.LANDSHOP_POSTMARK_TRANSACTIONAL_FROM||'';
const senderOk=/(^|<)[^\s<>@]+@landshopnigeria\.com(>|$)/i.test(from);
const emailPresent=exists('LANDSHOP_POSTMARK_TRANSACTIONAL_TOKEN')&&senderOk;
log('Postmark transactional sender configuration',emailPresent?'present':'incomplete');
log('Email delivery flag',yes('LANDSHOP_COMM_EMAIL_LIVE')?'enabled':'disabled');
const waPresent=exists('LANDSHOP_WHATSAPP_ACCESS_TOKEN')&&/^\d{6,30}$/.test(e.LANDSHOP_WHATSAPP_PHONE_NUMBER_ID||'');
log('WhatsApp Cloud API configuration',waPresent?'present':'incomplete');
log('WhatsApp delivery flag',yes('LANDSHOP_COMM_WHATSAPP_LIVE')?'enabled':'disabled');
log('WhatsApp webhook verification',exists('LANDSHOP_WHATSAPP_WEBHOOK_VERIFY_TOKEN')&&exists('LANDSHOP_WHATSAPP_APP_SECRET')?'present':'incomplete');
const smsPresent=exists('LANDSHOP_TERMII_API_KEY')&&/^[a-zA-Z0-9 ]{3,11}$/.test(e.LANDSHOP_TERMII_SENDER_ID||'');
log('Termii SMS configuration',smsPresent?'present':'incomplete');
log('SMS delivery flag',yes('LANDSHOP_COMM_SMS_LIVE')?'enabled':'disabled');
log('Postmark webhook authentication',exists('LANDSHOP_POSTMARK_WEBHOOK_USERNAME')&&exists('LANDSHOP_POSTMARK_WEBHOOK_PASSWORD')?'present':'incomplete');

if(emailPresent){
 try{
  const response=await fetch('https://api.postmarkapp.com/server',{
   headers:{'Accept':'application/json','X-Postmark-Server-Token':e.LANDSHOP_POSTMARK_TRANSACTIONAL_TOKEN},
   signal:AbortSignal.timeout(8000)
  });
  if(response.ok){
   // API returns a server API token list: never print/store the response.
   const d=await response.json();
   log('Postmark API authentication',d.DeliveryType==='Live'?'verified live server':'verified, but not a live server');
  }else log('Postmark API authentication','not verified (non-success response)');
 }catch{log('Postmark API authentication','could not verify connection')}
}else log('Postmark API authentication','not tested (credentials incomplete)');

if(exists('LANDSHOP_SUPABASE_SERVICE_ROLE_KEY')&&/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(e.LANDSHOP_SUPABASE_URL||'')){
 try{
  const db=createClient(e.LANDSHOP_SUPABASE_URL,e.LANDSHOP_SUPABASE_SERVICE_ROLE_KEY,{
   auth:{persistSession:false,autoRefreshToken:false}
  });
  const [c,r]=await Promise.all([
   db.from('landshop_comm_channels').select('channel,enabled').limit(5),
   db.from('landshop_comm_delivery_rules').select('channel,enabled').limit(200)
  ]);
  if(c.error||r.error)log('Privileged database read','not verified');
  else{
   log('Privileged database read','verified');
   for(const channel of ['email','whatsapp','sms']){
    const channelOn=c.data?.some(row=>row.channel===channel&&row.enabled===true);
    const rulesOn=r.data?.some(row=>row.channel===channel&&row.enabled===true);
    log(channel+' database channel',channelOn?'enabled':'disabled');
    log(channel+' approved event rules',rulesOn?'enabled':'none enabled');
   }
  }
 }catch{log('Privileged database read','could not verify')}
}else log('Privileged database read','not tested (credentials incomplete)');

const attested=yes('LANDSHOP_COMM_LIVE_ENABLED')&&yes('LANDSHOP_COMM_ROTATION_CONFIRMED');
for(const [channel,present] of [['email',emailPresent],['whatsapp',waPresent],['sms',smsPresent]]){
 const ok=attested&&present&&yes('LANDSHOP_COMM_'+channel.toUpperCase()+'_LIVE');
 log(channel+' worker permission',ok?'READY to inspect queued messages':'not authorized to send');
}
console.log('READINESS REPORT COMPLETE. No recipient information read or messages sent.');
