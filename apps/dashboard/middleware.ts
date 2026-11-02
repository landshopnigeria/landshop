import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function privateRedirect(request:NextRequest,path:string){
 const redirect=NextResponse.redirect(new URL(path,request.url));
 redirect.headers.set('Cache-Control','private, no-store, max-age=0');
 return redirect;
}

export async function middleware(request: NextRequest) {
 // Provider callbacks authenticate at their own handlers (Basic/HMAC). Do not
 // depend on an unrelated browser session or Supabase Auth network lookup.
 if(request.nextUrl.pathname.startsWith('/api/communications/webhooks/'))return NextResponse.next();
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
  if(error||!user)return privateRedirect(request,'/staff/sign-in');
  const {data:manager,error:accessError}=await supabase.rpc('landshop_is_management',{p_user:user.id});
  if(accessError||manager!==true)return privateRedirect(request,'/staff');
  response.headers.set('Cache-Control','private, no-store');
 }
 return response;
}

export const config={runtime:'nodejs',matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
