import {createHash} from 'node:crypto';
import {NextResponse,type NextRequest} from 'next/server';

/**
 * Free, bounded, best-effort in-process abuse control for Landshop's email
 * recovery endpoints. Hashed buckets retain neither raw email nor raw IP.
 * Proxy headers can be forged and processes do not share memory: retain
 * Supabase's provider-side Auth limits and upstream WAF rules as additional
 * layers; never claim this is distributed enforcement.
 */
type Bucket={count:number;until:number};
const buckets=new Map<string,Bucket>();
// Independent quota counters are never evicted by spoofed IP buckets.
const GLOBAL_BUCKETS=new Map<string,Bucket>();
const MAX_BUCKETS=7000;
const hash=(value:string)=>createHash('sha256').update(value).digest('hex').slice(0,32);

function consume(key:string,max:number,periodMs:number):number{
 const now=Date.now();
 if(buckets.size>=MAX_BUCKETS){
  for(const [item,value] of buckets)if(value.until<=now)buckets.delete(item);
  if(buckets.size>=MAX_BUCKETS){
   const oldest=buckets.keys().next().value;
   if(oldest)buckets.delete(oldest);
  }
 }
 const previous=buckets.get(key);
 if(!previous||previous.until<=now){
  buckets.set(key,{count:1,until:now+periodMs});
  return 0;
 }
 previous.count+=1;
 return previous.count>max?Math.max(1,Math.ceil((previous.until-now)/1000)):0;
}
function clientFingerprint(request:NextRequest):string{
 const ip=request.headers.get('x-real-ip')||
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||
  request.headers.get('cf-connecting-ip')||
  'unknown:'+String(request.headers.get('user-agent')||'').slice(0,120);
 return hash(ip.slice(0,120));
}
function globalConsume(action:string,max:number,windowMs:number){
 const now=Date.now(),entry=GLOBAL_BUCKETS.get(action);
 if(!entry||entry.until<=now){GLOBAL_BUCKETS.set(action,{count:1,until:now+windowMs});return 0;}
 entry.count+=1;
 return entry.count>max?Math.max(1,Math.ceil((entry.until-now)/1000)):0;
}
export function authEmailThrottle(request:NextRequest,action:string,email:string){
 const ipRetry=consume(action+':ip:'+clientFingerprint(request),10,30*60_000);
 const emailRetry=consume(action+':email:'+hash(email.toLowerCase()),3,30*60_000);
 // Abuse cannot bypass this per-process ceiling by rotating forwarded IPs.
 const globalRetry=(ipRetry||emailRetry)?0:globalConsume(action,600,30*60_000);
 const retry=Math.max(ipRetry,emailRetry,globalRetry);
 return retry?NextResponse.json(
  {ok:false,message:'Too many email requests. Please try again later.'},
  {status:429,headers:{'Cache-Control':'private, no-store','Retry-After':String(retry),'X-Content-Type-Options':'nosniff'}}
 ):null;
}
