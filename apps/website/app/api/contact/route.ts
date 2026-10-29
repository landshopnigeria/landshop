
import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {createHash} from 'node:crypto';
export const runtime='nodejs';
const topics=new Set(['Property Acquisition','Mortgage Guidance','Property Inspection','Develop','Incubate','Grow','Customer Support','Other']);
const windows=new Map<string,{count:number;until:number}>();
export async function POST(request:NextRequest){
 const origin=request.headers.get('origin');
 if(origin&&!['https://www.landshopnigeria.com','https://landshopnigeria.com','http://localhost:3000'].includes(origin))
  return NextResponse.json({message:'This request origin is not permitted.'},{status:403});
 const length=Number(request.headers.get('content-length')||0);
 if(length>12000)return NextResponse.json({message:'The message is too long.'},{status:413});
 const ip=request.headers.get('x-real-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unidentified';
 const key=createHash('sha256').update(ip).digest('hex'),now=Date.now();
 if(windows.size>2000){for(const [k,v] of windows){if(v.until<now)windows.delete(k)}}
 const bucket=windows.get(key);
 if(bucket&&bucket.until>now&&bucket.count>=4)return NextResponse.json({message:'Too many requests. Please try again later.'},{status:429});
 windows.set(key,{count:bucket&&bucket.until>now?bucket.count+1:1,until:now+60000});
 let body:Record<string,unknown>;
 try{const text=await request.text();if(text.length>12000)throw Error('large');body=JSON.parse(text) as Record<string,unknown>}
 catch{return NextResponse.json({message:'Invalid request content.'},{status:400})}
 if(String(body.website||'').trim())return NextResponse.json({message:'Your request was received.'},{status:202});
 const full_name=String(body.full_name||'').trim().slice(0,120);
 const email=String(body.email||'').trim().toLowerCase().slice(0,254);
 const phone=String(body.phone||'').trim().slice(0,30);
 const topic=String(body.topic||'').trim();
 const message=String(body.message||'').trim().slice(0,3000);
 const consent=body.consent==='yes';
 if(full_name.length<2||!/^.+@[^@ ]+\.[^@ ]+$/.test(email)||!topics.has(topic)||message.length<20||!consent||!(/^[+0-9()\s-]{0,30}$/.test(phone)))
  return NextResponse.json({message:'Check your name, email, topic, consent and message (minimum 20 characters).'}, {status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!anon)return NextResponse.json({message:'The enquiry service is temporarily unavailable; please use our published support email.'},{status:503});
 const date=new Date().toISOString().slice(0,10);
 const fingerprint=createHash('sha256').update([email,topic,message.replace(/\s+/g,' ').toLowerCase(),date].join('|')).digest('hex');
 try{
  const db=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {error}=await db.from('contact_enquiries').insert({full_name,email,phone:phone||null,topic,message,consent:true,fingerprint});
  if(error){
   if(error.code==='23505')return NextResponse.json({message:'This enquiry has already been received today.'},{status:200});
   return NextResponse.json({message:'The enquiry service could not record your request. Please use our published support email.'},{status:503});
  }
  return NextResponse.json({message:'Thank you. Landshop has recorded your enquiry and will respond using the contact details provided.'},{status:201});
 }catch{return NextResponse.json({message:'Enquiry submission is currently unavailable. Please contact Landshop directly.'},{status:503})}
}
