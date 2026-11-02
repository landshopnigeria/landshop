#!/usr/bin/env node
// Landshop outbound communication worker. Runtime isolated from browser/public pages.
// Every provider call requires explicit production attestation, verified contact
// permissions, an enabled rule, an approved template and an atomic database lease.
// No external request on --self-test or --preview.
import {createClient} from '@supabase/supabase-js';

const env=process.env;
const dry=process.argv.includes('--preview') || process.argv.includes('--self-test');
const mode=process.argv.includes('--self-test')?'test':process.argv.includes('--preview')?'preview':'send';
const channels=['email','whatsapp','sms'];
const site='https://www.landshopnigeria.com';
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const b64=(v)=>Buffer.from(v).toString('base64');
const first=(v)=>String(v||'').trim().split(/\s+/)[0]||'there';
function requireVar(n){const v=env[n]?.trim();if(!v)throw new Error('Required server-side setting missing: '+n);return v;}
function ensurePhone(input){const n=String(input||'').trim().replace(/[\s()+-]/g,'');if(!/^[1-9]\d{7,14}$/.test(n))throw new Error('Invalid customer phone; no message sent');return n;}
function fill(t,values){return String(t||'').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,(_,key)=>{
  if(!Object.hasOwn(values,key))throw new Error('Template variable not verified: '+key);
  return String(values[key]);
});}
function contactValues(contact){return {first_name:first(contact.full_name),full_name:String(contact.full_name||'').trim()||'Landshop customer'};}
function renderEmail(template,contact,purpose){
 const variables=contactValues(contact);
 const subject=fill(template.subject,variables);
 const headline=fill(template.headline,variables);
 const body=fill(template.body,variables);
 const photo=/^\/media\/[A-Za-z0-9_./-]+\.webp$/.test(template.image_url||'')?template.image_url:null;
 const logo=site+'/media/logo-transparent.png';
 const bodyHTML=body.split(/\n\s*\n/).filter(Boolean).map(p=>'<p style="margin:0 0 14px;line-height:1.8;color:#385d51;font-size:15px">'+esc(p).replace(/\n/g,'<br>')+'</p>').join('');
 const image=photo?'<img src="'+site+photo+'" alt="Landshop property photograph" width="540" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;display:block;margin:20px auto 4px">':'';
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'+
 '<body style="margin:0;padding:22px 8px;background:#f4faf7;color:#284e41;font-family:Arial,Helvetica,sans-serif">'+
 '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr><td align="center">'+
 '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;border:1px solid #d7e8df;background:#ffffff;border-radius:16px;overflow:hidden">'+
 '<tr><td align="center" style="padding:18px 22px 12px;background:#f3faf7"><img src="'+logo+'" alt="Landshop" width="115" style="display:block;max-width:115px;height:auto;border:0;background:transparent"></td></tr>'+
 '<tr><td align="center" style="padding:25px 28px;background:#2dac80"><div style="letter-spacing:2px;font-size:11px;color:#e8fff5;font-weight:bold">A NOTE FROM LANDSHOP</div><h1 style="font-size:26px;line-height:1.28;color:#ffffff;margin:12px auto 0;font-weight:700">'+esc(headline)+'</h1></td></tr>'+
 '<tr><td style="padding:24px 30px 16px;background:white"><p style="font-size:16px;font-weight:700;margin:0 0 16px;color:#073f34">Hello, '+esc(variables.first_name)+'.</p>'+bodyHTML+image+
 '<div style="text-align:center;margin:20px auto"><a href="https://portal.landshopnigeria.com/" style="display:inline-block;background:#f26b10;border-radius:9px;color:#fff;text-decoration:none;padding:13px 19px;font-weight:bold;font-size:14px">Visit your secure account</a></div></td></tr>'+
 '<tr><td align="center" style="background:#f3faf7;padding:24px 26px;border-top:1px solid #dfede6;color:#5a7367;font-size:12px;line-height:1.8">'+
 '<img src="'+logo+'" alt="Landshop" width="104" style="background:transparent;border:none;height:auto;margin:0 auto 10px;display:block">'+
 '<strong style="display:block;color:#073f34">LANDSHOP LIMITED</strong>'+
 'Suite 1, 3rd Floor, King&#39;s Deck, Alternative Route, Chevron Drive, Lekki-Epe Expressway, Lagos, Nigeria.<br>'+
 '+234 1 888 0063 &nbsp;|&nbsp; WhatsApp +234 818 886 6772<br>'+
 '<a style="color:#128d67" href="mailto:care@landshopnigeria.com">care@landshopnigeria.com</a> &nbsp;|&nbsp;'+
 '<a style="color:#128d67" href="'+site+'">www.landshopnigeria.com</a><br>'+
 (purpose==='marketing'?'You can opt out of marketing updates using the unsubscribe link included in your sending provider.':'We never ask you to share your password or one-time code by email.')+
 '<br>&copy; '+new Date().getUTCFullYear()+' Landshop Limited. All rights reserved.</td></tr></table></td></tr></table></body></html>';
 return {subject,body,html};
}
const readJSON=async(response)=>{
 const data=await response.text();try{return JSON.parse(data)}catch{return {}}
};
async function sendPostmark(item,contact,template){
 const token=requireVar('LANDSHOP_POSTMARK_TRANSACTIONAL_TOKEN');
 if(token==='POSTMARK_API_TEST')throw new Error('Live mode refuses Postmark testing token');
 const sender=requireVar('LANDSHOP_POSTMARK_TRANSACTIONAL_FROM');
 if(!/^([^@\s<>]+@landshopnigeria\.com|[^<>]*<[^@\s<>]+@landshopnigeria\.com>)$/i.test(sender))throw new Error('Unverified sender domain');
 const msg=renderEmail(template,contact,item.purpose);
 const resp=await fetch('https://api.postmarkapp.com/email',{
  method:'POST',headers:{'X-Postmark-Server-Token':token,'Content-Type':'application/json','Accept':'application/json'},
  body:JSON.stringify({From:sender,To:contact.email,Subject:msg.subject,
   HtmlBody:msg.html,TextBody:'Hello '+first(contact.full_name)+'.\n\n'+msg.body+
   '\n\nLandshop Limited\n'+site+'\ncare@landshopnigeria.com',
   MessageStream:'outbound',Tag:'LandshopCommunication',TrackOpens:false,TrackLinks:'None'}),
  signal:AbortSignal.timeout(15000)
 });
 const data=await readJSON(resp);
 if(resp.status===429)return {status:'retry',delay:900,error:'Provider rate limited'};
 if(resp.status>=500)return {status:'uncertain',error:'Provider internal response after request'};
 if(!resp.ok||data.ErrorCode)return {status:'failed',error:'Postmark rejected request: '+String(data.ErrorCode||resp.status)};
 if(!data.MessageID)return {status:'uncertain',error:'Provider response lacks message ID'};
 return {status:'accepted',id:String(data.MessageID)};
}
async function sendWhatsapp(item,contact,rule){
 const token=requireVar('LANDSHOP_WHATSAPP_ACCESS_TOKEN'),phoneId=requireVar('LANDSHOP_WHATSAPP_PHONE_NUMBER_ID');
 if(!/^\d{6,30}$/.test(phoneId))throw new Error('Invalid WhatsApp business phone ID');
 if(!rule.whatsapp_template_name||!/^[a-z0-9_]{3,120}$/.test(rule.whatsapp_template_name))throw new Error('Approved WhatsApp template not assigned');
 const phone=ensurePhone(contact.phone);
 // Approved templates here intentionally have NO placeholders. Meta requires
 // exact variable components as approved per template; do not fabricate them.
 const resp=await fetch('https://graph.facebook.com/v23.0/'+phoneId+'/messages',{
  method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({messaging_product:'whatsapp',recipient_type:'individual',to:phone,type:'template',
   template:{name:rule.whatsapp_template_name,language:{code:rule.whatsapp_language||'en'}}}),
  signal:AbortSignal.timeout(15000)
 });
 const data=await readJSON(resp);
 if(resp.status===429)return {status:'retry',delay:900,error:'Meta rate limited'};
 if(resp.status>=500)return {status:'uncertain',error:'Meta provider error after dispatch'};
 if(!resp.ok)return {status:'failed',error:'WhatsApp provider rejected request ('+resp.status+')'};
 const id=data.messages?.[0]?.id;
 if(!id)return {status:'uncertain',error:'Meta response lacks provider message ID'};
 return {status:'accepted',id:String(id)};
}
async function sendSMS(item,contact,template){
 const key=requireVar('LANDSHOP_TERMII_API_KEY'),sender=requireVar('LANDSHOP_TERMII_SENDER_ID');
 if(!/^[a-zA-Z0-9 ]{3,11}$/.test(sender))throw new Error('Invalid SMS sender ID');
 const number=ensurePhone(contact.phone);
 const sms=fill(template.sms,contactValues(contact));
 if(!sms||sms.length>480)throw new Error('SMS content missing or too long');
 const resp=await fetch('https://api.ng.termii.com/api/sms/send',{method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({to:number,from:sender,sms,type:'plain',channel:'dnd',api_key:key}),
   signal:AbortSignal.timeout(15000)});
 const data=await readJSON(resp);
 if(resp.status===429)return {status:'retry',delay:900,error:'Termii rate limited'};
 if(resp.status>=500)return {status:'uncertain',error:'Termii provider error after request'};
 if(!resp.ok)return {status:'failed',error:'SMS provider rejected request ('+resp.status+')'};
 const id=data.message_id||data.messageId;
 if(!id)return {status:'uncertain',error:'SMS provider response lacks message ID'};
 return {status:'accepted',id:String(id)};
}
async function previewTest(){
 const template={subject:'Welcome {{first_name}} to Landshop',headline:'Your journey starts here.',
  body:'Thank you for contacting Landshop.\n\nOur team will respond soon.',sms:'Hello {{first_name}}, your request is received.',image_url:null};
 const contact={full_name:'Amina Bello',email:'test@example.invalid',phone:'2348000000000'};
 const m=renderEmail(template,contact,'transactional');
 if(!m.html.includes('Hello, Amina.')||!m.html.includes('#2dac80')||!m.html.includes('logo-transparent.png')||
 !m.html.includes('Landshop Limited')||!m.html.includes('©')&&!m.html.includes('&copy;')||
 !m.subject.includes('Amina'))throw Error('Premium email rendering self-test failed');
 try{renderEmail({...template,body:'Hello {{unverified_payment}}'},contact,'transactional');throw Error('Unverified placeholder accepted')}catch(e){if(!String(e).includes('not verified'))throw e}
 for(const n of ['2348031234567','447911123456'])if(ensurePhone(n)!==n)throw Error('Phone validation failed');
 console.log('PASS: premium email, proper logo, original teal, escaped content, unverified placeholder stop and valid recipient checks');
}
if(mode==='test'){await previewTest();process.exit(0)}
if(mode==='preview'){await previewTest();console.log('PREVIEW: no database reads and no external messages sent');process.exit(0)}
if(env.LANDSHOP_COMM_LIVE_ENABLED!=='true'||env.LANDSHOP_COMM_ROTATION_CONFIRMED!=='true'||env.GITHUB_REF!=='refs/heads/main'){
 console.log('OUTBOUND DISABLED: explicit production enable, key rotation confirmation and main-branch context required.');process.exit(0);
}
const key=requireVar('LANDSHOP_SUPABASE_SERVICE_ROLE_KEY'),url=requireVar('LANDSHOP_SUPABASE_URL');
if(!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url))throw Error('Untrusted database endpoint');
const available=channels.filter(c=>env['LANDSHOP_COMM_'+c.toUpperCase()+'_LIVE']==='true');
if(!available.length){console.log('OUTBOUND DISABLED: no provider channel is explicitly authorized');process.exit(0)}
// Require per-channel secrets before claiming to avoid trapping messages.
for(const channel of available){
 if(channel==='email'){requireVar('LANDSHOP_POSTMARK_TRANSACTIONAL_TOKEN');requireVar('LANDSHOP_POSTMARK_TRANSACTIONAL_FROM')}
 if(channel==='whatsapp'){requireVar('LANDSHOP_WHATSAPP_ACCESS_TOKEN');requireVar('LANDSHOP_WHATSAPP_PHONE_NUMBER_ID')}
 if(channel==='sms'){requireVar('LANDSHOP_TERMII_API_KEY');requireVar('LANDSHOP_TERMII_SENDER_ID')}
}
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:leases,error:leaseError}=await db.rpc('landshop_comm_claim_outbox',{p_channels:available,p_limit:Math.min(10,Math.max(1,Number(env.LANDSHOP_COMM_BATCH_SIZE)||5))});
if(leaseError)throw Error('Safe lease claim failed: '+leaseError.code);
console.log('Leased '+(leases||[]).length+' outbound notification(s); channels='+available.join(','));
for(const lease of leases||[]){
 let result={status:'suppressed',error:'Preflight did not pass'};
 try{
  // Re-check all settings immediately before provider call, including opt-out.
  const [{data:contact,error:ce},{data:rule,error:re},{data:template,error:te},{data:channel,error:ch}]=await Promise.all([
   db.from('landshop_comm_contacts').select('id,email,full_name,phone,status,marketing_consent,whatsapp_opt_in,sms_opt_in').eq('id',lease.contact_id).single(),
   db.from('landshop_comm_delivery_rules').select('id,enabled,whatsapp_template_name,whatsapp_language').eq('id',lease.rule_id).single(),
   db.from('landshop_comm_templates').select('id,subject,headline,body,whatsapp,sms,image_url,state').eq('id',lease.template_id).single(),
   db.from('landshop_comm_channels').select('enabled').eq('channel',lease.channel).single()
  ]);
  if(ce||re||te||ch)throw new Error('Safe provider preflight DB read failed');
  const allowed=contact?.status==='active' && rule?.enabled===true && template?.state==='approved' && channel?.enabled===true &&
    (lease.purpose==='transactional'||contact.marketing_consent===true) &&
    (lease.channel!=='whatsapp'||contact.whatsapp_opt_in===true) &&
    (lease.channel!=='sms'||contact.sms_opt_in===true);
  if(!allowed){result={status:'suppressed',error:'Contact, consent or approval no longer permits sending'}}
  else if(lease.channel==='email')result=await sendPostmark(lease,contact,template);
  else if(lease.channel==='whatsapp')result=await sendWhatsapp(lease,contact,rule);
  else if(lease.channel==='sms')result=await sendSMS(lease,contact,template);
 }catch(e){
  // Any transport ambiguity is non-retryable without human review. Do not
  // leak recipient details or provider headers into logs/ledger.
  result={status:'uncertain',error:'Transport, unverified placeholder or policy preflight exception'};
 }
 const payload={p_id:lease.id,p_lease:lease.lease_token,p_status:result.status,
   p_message_id:result.id||null,p_error:result.error||null,p_delay_seconds:result.delay||null};
 const {data:resolved,error:resolveError}=await db.rpc('landshop_comm_resolve_outbox',payload);
 if(resolveError||resolved!==true)throw new Error('Outbox resolution failed; stop to prevent an ambiguous duplicate send');
 console.log('Record '+String(lease.id).slice(0,8)+': '+result.status);
}
