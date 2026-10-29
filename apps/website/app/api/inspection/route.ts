import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {NextResponse,type NextRequest} from 'next/server';
export const runtime='nodejs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const origins=new Set(['https://www.landshopnigeria.com','https://landshopnigeria.com','http://localhost:3000','http://127.0.0.1:3000']);
function response(status:number,message:string,reference?:string){return NextResponse.json({ok:status<300,message,reference},{status,headers:{'Cache-Control':'no-store'}})}
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');if(origin&&!origins.has(origin))return response(403,'Origin not permitted');
 if(!req.headers.get('content-type')?.startsWith('application/json'))return response(415,'JSON required');
 let p:Record<string,unknown>;
 try{const input=await req.text();if(input.length>8000)return response(413,'Request too large');
 const o:unknown=JSON.parse(input);if(!o||typeof o!=='object'||Array.isArray(o))return response(400,'Invalid request');
 p=o as Record<string,unknown>;}catch{return response(400,'Unable to read request')}
 if(p.website)return response(422,'Unable to process request');
 const value=(key:string)=>typeof p[key]==='string'?(p[key] as string).trim():'';
 const id=value('property_id'),name=value('full_name'),email=value('email').toLowerCase(),phone=value('phone');
 const whatsapp=value('whatsapp'),date=value('date'),time=value('time'),kind=value('inspection_type'),message=value('message');
 const attendees=Number(p.attendees||1);
 if(!uuid.test(id)||name.length<2||name.length>120||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||
 phone.length<7||phone.length>30||whatsapp.length>30||!/^\d{4}-\d{2}-\d{2}$/.test(date)||
 !['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].includes(time)||
 !['physical','virtual'].includes(kind)||!Number.isInteger(attendees)||attendees<1||attendees>20||message.length>1200||p.consent!==true)
 return response(422,'Please check the property, contact details, preferred date/time, inspection type and consent.');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return response(503,'Inspection bookings are temporarily unavailable. Please contact customer care.');
 const fingerprint=createHash('sha256').update(JSON.stringify([id,email,date,time,kind])).digest('hex');
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data,error}=await db.rpc('landshop_inspection_request',{p_property:id,p_name:name,p_email:email,p_phone:phone,
 p_whatsapp:whatsapp,p_date:date,p_time:time,p_type:kind,p_attendees:attendees,p_message:message,p_consent:true,p_fingerprint:fingerprint});
 if(error){if(error.code==='23505')return response(409,'You already requested this property at the same date and time.');
 console.error('landshop.inspection.failed',{code:error.code});
 return response(422,'The inspection request could not be recorded. Confirm the preferred date, property and availability, or contact Landshop.');}
 if(typeof data!=='string'||!uuid.test(data))return response(503,'Request reference could not be verified.');
 return response(201,'Inspection request recorded and awaiting staff confirmation.','LS-I-'+data.slice(0,8).toUpperCase());
}
