#!/usr/bin/env node
// Landshop daily editorial newsletter dispatcher.
// Fail closed: scheduled checks never send without explicit enable + approved
// per-day content + confirmed provider and service-role credentials.
import {readFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
const isSend=process.argv.includes('--send');
const isSelfTest=process.argv.includes('--self-test');
const site='https://www.landshopnigeria.com';
const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
const date=parts.year+'-'+parts.month+'-'+parts.day;
const safe=(v)=>String(v||'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function findArticle(slug){
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))return null;
  const sources=['apps/website/lib/guides.ts','apps/website/lib/v22-guides.ts'];
  for(const path of sources){
   let s='';try{s=readFileSync(path,'utf8')}catch{continue}
   const pattern=/slug:'([^']+)'[\s\S]{0,240}?title:'((?:\\'|[^'])+)'/g;
   for(const match of s.matchAll(pattern)){
    if(match[1]===slug)return {slug,title:match[2].replace(/\\'/g,"'"),url:site+'/insights/'+slug};
   }
  }
  return null;
}
function messageFor(article,subscriber,from){
 const link=site+'/newsletter/unsubscribe?token='+encodeURIComponent(subscriber.unsubscribe_token);
 const text='Landshop Daily Property Insights\n\n'+article.title+'\n\nRead the article: '+article.url+
   '\n\nThis message was sent because you subscribed to Landshop property news and insights.'+
   '\nManage your subscription: '+link+'\nUnsubscribe via Postmark: {{{ pm:unsubscribe }}}';
 const html='<!doctype html><html lang="en"><body style="margin:0;background:#f0f7f2;font-family:Arial,sans-serif;color:#1c4731">'+
  '<div style="max-width:620px;margin:20px auto;background:white;padding:32px;border-radius:16px">'+
  '<p style="letter-spacing:.12em;color:#19825c;font-size:12px;font-weight:bold">LANDSHOP · DAILY PROPERTY INSIGHTS</p>'+
  '<h1 style="font-size:27px;line-height:1.25">'+safe(article.title)+'</h1>'+
  '<p>Today’s selected Landshop article can help you make more informed property decisions.</p>'+
  '<p><a href="'+safe(article.url)+'" style="background:#218a64;color:#fff;padding:14px 20px;border-radius:9px;text-decoration:none;display:inline-block">Read the article →</a></p>'+
  '<hr style="border:0;border-top:1px solid #dcebe0;margin:28px 0"/>'+
  '<p style="font-size:12px;color:#536e60">You received this email because you subscribed to Landshop property news and insights.</p>'+
  '<p style="font-size:12px"><a href="'+safe(link)+'">Manage subscription</a> · <a href="{{{ pm:unsubscribe }}}">Unsubscribe from this mailing list</a></p>'+
  '<p style="font-size:11px;color:#607969">Landshop, Lagos, Nigeria · '+safe(from)+'</p></div></body></html>';
 return {From:from,To:subscriber.email,Subject:'Landshop property insight: '+article.title,
   HtmlBody:html,TextBody:text,MessageStream:process.env.LANDSHOP_POSTMARK_BROADCAST_STREAM||'broadcast',
   Tag:'LandshopDailyInsights',TrackOpens:false,TrackLinks:'None'};
}
if(isSelfTest){
 const a=findArticle('property-due-diligence');
 if(!a||!/land or a house/.test(a.title)||findArticle('../../secret'))throw Error('Article allowlist test failed');
 const m=messageFor(a,{email:'seed@example.invalid',unsubscribe_token:'00000000-0000-0000-0000-000000000001'},'Landshop <news@example.invalid>');
 if(!m.HtmlBody.includes('{{{ pm:unsubscribe }}}')||!m.TextBody.includes('/newsletter/unsubscribe?token='))throw Error('Unsubscribe links missing');
 if(!safe('<script>').includes('&lt;'))throw Error('HTML escaping failed');
 console.log('PASS: content whitelist, escaped copy and provider/local unsubscribe links');
 process.exit(0);
}
const enabled=process.env.LANDSHOP_NEWSLETTER_LIVE_ENABLED==='true';
if(!isSend||!enabled){
 console.log('Landshop newsletter dispatch is DISABLED. No subscriber data read, no messages sent.');
 console.log('Today (Africa/Lagos): '+date+'. To send: approved campaign + explicit enable + verified Postmark Broadcast sender + service role.');
 process.exit(0);
}
if(process.env.GITHUB_REF!=='refs/heads/main')throw Error('Live sends are allowed only from the production main branch');
const url=process.env.LANDSHOP_SUPABASE_URL;
const adminKey=process.env.LANDSHOP_SUPABASE_SERVICE_ROLE_KEY;
const postmarkKey=process.env.LANDSHOP_POSTMARK_BROADCAST_TOKEN;
const sender=process.env.LANDSHOP_NEWSLETTER_FROM;
if(!url||!adminKey||!postmarkKey||!sender||!/@landshopnigeria\.com>?$/i.test(sender)){
 throw Error('Verified Landshop service role, broadcaster token or sender not configured; no email sent.');
}
const db=createClient(url,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:campaign,error:campaignError}=await db.from('landshop_newsletter_campaigns')
 .select('id,article_slug,status').eq('send_date',date).eq('status','approved').maybeSingle();
if(campaignError)throw Error('Campaign lookup failed');
if(!campaign){console.log('No approved campaign for '+date+'. No messages sent.');process.exit(0)}
const article=findArticle(campaign.article_slug);
if(!article)throw Error('Approved campaign article is not included in the published Landshop article source; fail closed');
let page;
try{page=await fetch(article.url,{method:'GET',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});}
catch{throw Error('Cannot validate public article URL. No email sent.')}
if(!page.ok)throw Error('Public article URL is not live: '+page.status);
let lastId='',seen=0,claimed=0,sent=0,failed=0;
const cap=Number(process.env.LANDSHOP_NEWSLETTER_MAX_RECIPIENTS||'2000');
if(!Number.isInteger(cap)||cap<1||cap>5000)throw Error('Invalid maximum recipients safeguard');
// One scheduled run per day. Partial sends can be resumed manually; the unique
// delivery ledger prevents duplicates and leaves ambiguous network outcomes claimed.
while(seen<cap){
 let q=db.from('landshop_newsletter_subscribers')
  .select('id,email,status,unsubscribe_token').eq('status','subscribed').order('id',{ascending:true})
  .limit(Math.min(100,cap-seen));
 if(lastId)q=q.gt('id',lastId);
 const {data:members,error}=await q;
 if(error)throw Error('Subscriber read failed');
 if(!members?.length)break;
 seen+=members.length;lastId=members.at(-1).id;
 // Re-check status immediately before claiming to avoid stale subscriptions.
 const {data:current,error:currentError}=await db.from('landshop_newsletter_subscribers')
  .select('id,email,status,unsubscribe_token').in('id',members.map(x=>x.id)).eq('status','subscribed');
 if(currentError)throw Error('Subscriber consent re-check failed');
 if(!current.length)continue;
 const {data:stillApproved,error:approvalError}=await db.from('landshop_newsletter_campaigns')
  .select('id').eq('id',campaign.id).eq('status','approved').maybeSingle();
 if(approvalError||!stillApproved)throw Error('Campaign was cancelled. Sending stopped.');
 const {data:newClaims,error:claimError}=await db.from('landshop_newsletter_deliveries')
  .upsert(current.map(x=>({campaign_id:campaign.id,subscriber_id:x.id,status:'claimed'})),
   {onConflict:'campaign_id,subscriber_id',ignoreDuplicates:true})
  .select('id,subscriber_id');
 if(claimError)throw Error('Idempotency ledger write failed: no email sent to this batch');
 const claimedMap=new Map((newClaims||[]).map(x=>[x.subscriber_id,x.id]));
 const ready=current.filter(x=>claimedMap.has(x.id));
 if(!ready.length)continue;
 claimed+=ready.length;
 const body=ready.map(x=>messageFor(article,x,sender));
 let response,results;
 try{
  response=await fetch('https://api.postmarkapp.com/email/batch',{
   method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','X-Postmark-Server-Token':postmarkKey},
   body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Provider HTTP '+response.status);
  results=await response.json();
  if(!Array.isArray(results)||results.length!==ready.length)throw Error('Invalid provider response length');
 }catch{
  // Important: HTTP failures and timeouts may still have delivered messages.
  // Claimed rows remain unretryable to prevent duplicate recipient emails.
  throw Error('Broadcast outcome ambiguous: '+ready.length+' claims preserved without retry. Verify Postmark before manual reconciliation.');
 }
 for(let i=0;i<ready.length;i++){
  const result=results[i],ok=result?.ErrorCode===0;
  const update=ok?{status:'sent',provider_message_id:String(result.MessageID||''),completed_at:new Date().toISOString()}
   :{status:'failed',failure_type:Number(result?.ErrorCode)===406?'recipient_suppressed':'provider_rejected',completed_at:new Date().toISOString()};
  const {error:recordError}=await db.from('landshop_newsletter_deliveries')
   .update(update).eq('id',claimedMap.get(ready[i].id)).eq('status','claimed');
  if(recordError)throw Error('A delivery record could not be updated; stop and investigate before another run');
  if(ok)sent++;else failed++;
 }
 console.log('Digest batch processed: '+ready.length+' recipients; sent='+sent+' rejected='+failed+'. Emails/tokens not logged.');
}
console.log('Landshop '+date+' newsletter run complete. Inspected='+seen+', claimed='+claimed+', sent='+sent+', rejected='+failed);
if(failed)process.exitCode=1;
