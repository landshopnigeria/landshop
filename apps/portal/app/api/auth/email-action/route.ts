import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {authEmailThrottle} from '../../../../lib/public-auth-email-throttle';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const ALLOWED_ORIGINS=new Set([
 'https://portal.landshopnigeria.com',
 'http://localhost:3001',
 'http://127.0.0.1:3001'
]);
const ANSWERS={
 recovery:'If this address is registered, a recovery email will arrive shortly.',
 resend:'If this address is awaiting confirmation, a fresh email has been requested.'
};
function reply(status:number,message:string,ok=false,retryAfter?:number){
 return NextResponse.json({ok,message},{
  status,headers:{
   'Cache-Control':'private, no-store, max-age=0',
   'X-Content-Type-Options':'nosniff',
   'X-Robots-Tag':'noindex, nofollow, noarchive',
   ...(retryAfter?{'Retry-After':String(retryAfter)}:{})
  }
 });
}
/**
 * Same-origin, bounded email actions. Use a server proxy to make abuse limits
 * effective for legitimate Landshop UI requests; Supabase provider limits
 * remain necessary because a caller can still use Supabase Auth directly.
 */
export async function POST(request:NextRequest){
 const origin=request.headers.get('origin');
 const fetchSite=request.headers.get('sec-fetch-site');
 if(!origin||!ALLOWED_ORIGINS.has(origin)||fetchSite==='cross-site')
  return reply(403,'Request origin is not allowed.');
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
  return reply(415,'Send this request as JSON.');
 const size=Number(request.headers.get('content-length')||'0');
 if(!Number.isFinite(size)||size>512)return reply(413,'Request too large.');
 let action:'recovery'|'resend';
 let email:string;
 try{
  const raw=await request.text();
  if(raw.length>512)return reply(413,'Request too large.');
  const parsed:unknown=JSON.parse(raw);
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return reply(400,'Invalid request.');
  const body=parsed as Record<string,unknown>;
  if(body.action!=='recovery'&&body.action!=='resend')return reply(400,'Invalid request.');
  if(typeof body.email!=='string')return reply(400,'Invalid request.');
  action=body.action;
  email=body.email.trim().toLowerCase();
  if(email.length<5||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email))
   return reply(422,'Enter a valid email address.');
 }catch{return reply(400,'Invalid request.');}
 const throttled=authEmailThrottle(request,action,email);
 if(throttled)return throttled;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return reply(503,'Email service is temporarily unavailable.');
 const supabase=createClient(url,key,{auth:{
  persistSession:false,autoRefreshToken:false,detectSessionInUrl:false
 }});
 try{
  const {error}=action==='recovery'
   ?await supabase.auth.resetPasswordForEmail(email,{
     redirectTo:'https://portal.landshopnigeria.com/auth/callback?type=recovery'
    })
   :await supabase.auth.resend({
     type:'signup',email,options:{
      emailRedirectTo:'https://portal.landshopnigeria.com/auth/callback'
     }
    });
  if(error){
   // Do not reveal whether an address exists or awaits verification.
   // Supabase Auth applies independent delivery limits.
   if(error.status===429)return reply(429,'Email request limit reached. Try again later.');
   console.error('landshop.auth-email.unavailable',{action,status:error.status||500});
   return reply(503,'Email service is temporarily unavailable.');
  }
  return reply(200,ANSWERS[action],true);
 }catch{
  return reply(503,'Email service is temporarily unavailable.');
 }
}
