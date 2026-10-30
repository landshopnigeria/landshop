import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {createClient} from '@supabase/supabase-js';
import {findGuide} from '../../../lib/guides';
export const dynamic='force-dynamic';
function settings(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw Error('Comment service is not configured');return {url,key};}
const json=(payload:unknown,status=200)=>NextResponse.json(payload,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function authenticatedClient(){const {url,key}=settings();const cookieStore=await cookies();return createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},cookies:{
 getAll(){return cookieStore.getAll()},setAll(changes){try{changes.forEach(({name,value,options})=>cookieStore.set(name,value,options));}catch{ /* A read-only request cannot refresh cookies. */ }}
}});}
export async function GET(request:NextRequest){
 const slug=(request.nextUrl.searchParams.get('slug')||'').trim();
 if(!findGuide(slug))return json({ok:false,message:'Article not found'},404);
 try{
  const {url,key}=settings();const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.from('article_comments').select('id,body,created_at').eq('article_slug',slug).eq('status','approved').order('created_at',{ascending:false}).limit(40);
  if(error)throw error;
  return json({ok:true,comments:data||[]});
 }catch{return json({ok:false,message:'Comments temporarily unavailable'},503);}
}
export async function POST(request:NextRequest){
 const origin=request.headers.get('origin');
 if(origin && origin!=='https://www.landshopnigeria.com' && origin!=='https://landshopnigeria.com' && origin!=='http://localhost:3000')return json({ok:false,message:'Unrecognized request origin'},403);
 let payload:{slug?:unknown;body?:unknown};
 try{payload=await request.json()}catch{return json({ok:false,message:'Invalid request'},400)}
 const slug=typeof payload.slug==='string'?payload.slug.trim():'';
 const body=typeof payload.body==='string'?payload.body.trim():'';
 if(!findGuide(slug))return json({ok:false,message:'Article not found'},404);
 if(body.length<12||body.length>3000)return json({ok:false,message:'Your comment must be 12–3,000 characters'},400);
 try{
  const supabase=await authenticatedClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user||user.is_anonymous)return json({ok:false,message:'Please sign in to post a comment'},401);
  const cutoff=new Date(Date.now()-60*60*1000).toISOString();
  const {count,error:countError}=await supabase.from('article_comments').select('id',{count:'exact',head:true}).eq('author_id',user.id).gte('created_at',cutoff);
  if(countError)throw countError;
  if((count||0)>=4)return json({ok:false,message:'Comment limit reached. Please try again later'},429);
  const {error}=await supabase.from('article_comments').insert({article_slug:slug,body,author_id:user.id,status:'pending'});
  if(error)throw error;
  return json({ok:true,message:'Comment received and awaiting moderation.'},201);
 }catch{return json({ok:false,message:'Could not submit comment. Please try again.'},503);}
}
