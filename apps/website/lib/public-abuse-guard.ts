import {createHash} from 'node:crypto';
import {NextResponse,type NextRequest} from 'next/server';
/**
 * Bounded best-effort abuse throttle for public anonymous form endpoints.
 * Uses hashed identifiers without retaining raw IPs. Per-process, not distributed;
 * keep reverse-proxy/WAF and database policies enabled for production-wide limits.
 */
type Entry={count:number,until:number};
const BUCKETS=new Map<string,Entry>();
const MAX_KEYS=12_000;
function hash(value:string){return createHash('sha256').update(value).digest('hex').slice(0,28)}
function token(req:NextRequest){
 const forwarded=(req.headers.get('x-forwarded-for')||'').split(',')[0]?.trim()||'';
 const proxyIp=req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||forwarded;
 return hash(proxyIp.slice(0,80)||'unknown-client:'+String(req.headers.get('user-agent')||'').slice(0,120));
}
function limit(key:string,cap:number,windowMs:number){
 const now=Date.now(),existing=BUCKETS.get(key);
 if(BUCKETS.size>MAX_KEYS){
  for(const [k,v] of BUCKETS){if(v.until<=now)BUCKETS.delete(k);}
  if(BUCKETS.size>MAX_KEYS){const oldest=BUCKETS.keys().next().value;if(oldest)BUCKETS.delete(oldest);}
 }
 if(!existing||existing.until<=now){BUCKETS.set(key,{count:1,until:now+windowMs});return 0;}
 existing.count+=1;
 return existing.count>cap?Math.max(1,Math.ceil((existing.until-now)/1000)):0;
}
export function publicFormThrottle(req:NextRequest,scope:string,cap=24,windowMs=10*60_000){
 const retry=limit(scope+':ip:'+token(req),cap,windowMs);
 return retry?NextResponse.json({ok:false,message:'Too many requests. Please try again later.'},{
  status:429,headers:{'Cache-Control':'no-store','Retry-After':String(retry),'X-Content-Type-Options':'nosniff'}
 }):null;
}
export function publicEmailThrottle(email:string,scope:string,cap=6,windowMs=10*60_000){
 if(!email)return null;
 const retry=limit(scope+':email:'+hash(email.toLowerCase()),cap,windowMs);
 return retry?NextResponse.json({ok:false,message:'Too many requests for this email. Try again later.'},{
  status:429,headers:{'Cache-Control':'no-store','Retry-After':String(retry),'X-Content-Type-Options':'nosniff'}
 }):null;
}
