import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
 // Public sign-in and recovery pages validate auth in their own client/callback.
 // Avoid an unnecessary network Auth lookup before their first render.
 if(['/', '/auth/callback', '/reset-password', '/update-password', '/api/release-health',
     '/api/auth/email-action'].includes(request.nextUrl.pathname))
  return NextResponse.next({request});
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
 const {data:{user}}=await supabase.auth.getUser();
 if(user){
  const {data:state,error}=await supabase.rpc('landshop_my_account_state');
  if(error||state!=='active')return NextResponse.redirect('https://app.landshopnigeria.com/account-unavailable',{headers:{'Cache-Control':'private, no-store'}});
 }
 return response;
}

export const config={runtime:'nodejs',matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
