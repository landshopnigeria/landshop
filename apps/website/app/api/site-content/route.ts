import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {publicContentRoute} from '../../../../../packages/shared/content-model';
export async function GET(request:NextRequest){const route=request.nextUrl.searchParams.get('route')||'/';if(!publicContentRoute(route))return NextResponse.json([]);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)return NextResponse.json([]);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const {data,error}=await db.from('landshop_site_content_public').select('route,selector,kind,node_index,original,replacement').eq('route',route).limit(1000);
 return NextResponse.json(error?[]:data||[],{headers:{'Cache-Control':error?'no-store':'public, max-age=15, s-maxage=15','X-Content-Type-Options':'nosniff'}})}
