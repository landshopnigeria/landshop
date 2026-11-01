import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
 let response = NextResponse.next({request});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return response;

 const supabase=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{
   getAll(){return request.cookies.getAll()},
   setAll(changes){
    changes.forEach(({name,value})=>request.cookies.set(name,value));
    response=NextResponse.next({request});
    changes.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    response.headers.set('Cache-Control','private, no-store');
   }
  }
 });
 const {data:{user},error}=await supabase.auth.getUser();
 if(request.nextUrl.pathname==='/admin'||request.nextUrl.pathname.startsWith('/admin/')){
  if(error||!user)return NextResponse.redirect(new URL('/staff/sign-in',request.url));
  const {data:manager,error:accessError}=await supabase.rpc('landshop_is_management',{p_user:user.id});
  if(accessError||manager!==true)return NextResponse.redirect(new URL('/staff',request.url));
  response.headers.set('Cache-Control','private, no-store');
 }
 return response;
}

export const config={runtime:'nodejs',matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
