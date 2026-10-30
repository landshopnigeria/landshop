import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');
 const allowed=new Set(['https://www.landshopnigeria.com','https://landshopnigeria.com','http://localhost:3000']);
 if(origin&&!allowed.has(origin))return reply({ok:false,message:'Invalid request origin.'},403);
 const length=Number(req.headers.get('content-length')||'0');
 if(length>2048)return reply({ok:false,message:'Request too large.'},413);
 let data:{email?:unknown;website?:unknown};
 try{data=await req.json()}catch{return reply({ok:false,message:'Invalid request.'},400)}
 if(typeof data.website==='string'&&data.website.trim())return reply({ok:true},200);
 const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
 if(email.length<5||email.length>254||!(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)))
  return reply({ok:false,message:'Enter a valid email address.'},400);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return reply({ok:false,message:'Subscription service is temporarily unavailable.'},503);
 try{
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await client.rpc('landshop_newsletter_subscribe',{p_email:email,p_source:'global-footer'});
  if(error)throw error;
  return reply({ok:true,message:'Subscription saved.'},201);
 }catch{return reply({ok:false,message:'We could not complete your subscription right now.'},503)}
}
