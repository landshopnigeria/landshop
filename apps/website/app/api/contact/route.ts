import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {NextResponse,type NextRequest} from 'next/server';
export const runtime='nodejs';
const ALLOWED_ORIGINS=new Set(['https://www.landshopnigeria.com','https://landshopnigeria.com','http://localhost:3000','http://127.0.0.1:3000']);
const TOPICS=new Set(['Develop','Incubate','Grow','Property Acquisition','Property Inspection','Mortgage Guidance','Customer Support','Property Updates','Other']);
function reply(status:number,message:string,ok=false,reference?:string){return NextResponse.json({ok,message,reference},{status,headers:{'Cache-Control':'no-store'}})}
export async function POST(request:NextRequest){
 const origin=request.headers.get('origin');
 if(origin&&!ALLOWED_ORIGINS.has(origin))return reply(403,'This request origin is not permitted.');
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return reply(415,'Send the form as JSON.');
 let payload:Record<string,unknown>;
 try{
  const raw=await request.text();
  if(raw.length>9000)return reply(413,'Your message is too long.');
  const parsed:unknown=JSON.parse(raw);
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return reply(400,'Please complete the enquiry form.');
  payload=parsed as Record<string,unknown>;
 }catch{return reply(400,'The submitted form could not be read.');}
 if(payload.website)return reply(200,'If your message is valid, it will be reviewed.');
 const full_name=typeof payload.full_name==='string'?payload.full_name.trim():'';
 const email=typeof payload.email==='string'?payload.email.trim().toLowerCase():'';
 const phone=typeof payload.phone==='string'?payload.phone.trim():'';
 const topic=typeof payload.topic==='string'?payload.topic:'';
 const message=typeof payload.message==='string'?payload.message.trim():'';
 if(full_name.length<2||full_name.length>120||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||phone.length>30||!TOPICS.has(topic)||message.length<20||message.length>3000||payload.consent!==true)return reply(422,'Please check your name, email, enquiry type, message and consent.');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return reply(503,'Enquiry submission is temporarily unavailable. Please contact care@landshopnigeria.com.');
 // A daily digest prevents accidental repeat submissions without storing the raw sender IP.
 const date=new Date().toISOString().slice(0,10);
 const fingerprint=createHash('sha256').update(JSON.stringify([date,email,topic,message.toLowerCase()])).digest('hex');
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data,error}=await db.rpc('landshop_contact_submit',{p_name:full_name,p_email:email,p_phone:phone,p_topic:topic,p_message:message,p_consent:true,p_fingerprint:fingerprint});
 if(error){
  if(error.code==='23505')return reply(409,'You have already submitted this enquiry today. To add details, please write a new message.');
  console.error('landshop.contact.failed',{code:error.code});
  return reply(503,'Your enquiry could not be recorded. Please try again or email care@landshopnigeria.com.');
 }
 if(typeof data!=='string'||!data)return reply(503,'Enquiry reference could not be generated. Please contact customer care.');
 return reply(201,'Enquiry saved to the Landshop support queue.',true,'LS-C-'+data.slice(0,8).toUpperCase());
}
