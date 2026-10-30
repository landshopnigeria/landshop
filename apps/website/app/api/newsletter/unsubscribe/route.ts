import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const dynamic='force-dynamic';
const answer=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(request:NextRequest){
 const origin=request.headers.get('origin');
 const allowed=['https://www.landshopnigeria.com','https://landshopnigeria.com','http://localhost:3000'];
 if(origin&&!allowed.includes(origin))return answer({ok:false,message:'Invalid request origin.'},403);
 const length=Number(request.headers.get('content-length')||0);
 if(length>512)return answer({ok:false,message:'Invalid request.'},413);
 let body:{token?:unknown};
 try{body=await request.json()}catch{return answer({ok:false,message:'Invalid request.'},400)}
 const token=typeof body.token==='string'?body.token.trim():'';
 if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(token))
  return answer({ok:false,message:'Unsubscribe link is invalid.'},400);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return answer({ok:false,message:'Newsletter preferences are temporarily unavailable.'},503);
 try{
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await client.rpc('landshop_newsletter_unsubscribe',{p_token:token});
  if(error)throw error;
  // Do not reveal whether any particular email or token exists.
  return answer({ok:true,message:'Your newsletter preference has been updated.'},200);
 }catch{return answer({ok:false,message:'Could not update your preference. Please try again later.'},503)}
}
