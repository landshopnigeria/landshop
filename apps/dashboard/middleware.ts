import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function privateRedirect(request:NextRequest,path:string){
 const redirect=NextResponse.redirect(new URL(path,request.url));
 redirect.headers.set('Cache-Control','private, no-store, max-age=0');
 return redirect;
}

export async function middleware(request: NextRequest) {
 // Public staff sign-in, registration, legal pages and callback run their own
 // auth flow. Keep getUser() and authorization on every protected route.
 if(['/', '/staff/sign-in', '/staff/sign-up', '/staff/terms', '/staff/privacy',
     '/auth/callback', '/account-unavailable', '/api/release-health'].includes(request.nextUrl.pathname))
  return NextResponse.next({request});
 // Reject anonymous browser requests before any RSC rendering or Auth RPC.
 // A cookie name only decides whether to perform deeper Auth validation; it
 // never authorizes access. Valid sessions still require getUser() and role checks.
 const protectedPath=request.nextUrl.pathname;
 const privateStaff=protectedPath==='/staff'||protectedPath.startsWith('/staff/');
 const privateCustomer=protectedPath==='/dashboard'||protectedPath.startsWith('/dashboard/');
 const privateManagement=protectedPath==='/admin'||protectedPath.startsWith('/admin/');
 const potentialSession=request.cookies.getAll().some(({name})=>
  /^sb-[a-z0-9-]+-auth-token(?:\\.[0-9]+)?$/i.test(name));
 if((privateStaff||privateCustomer||privateManagement)&&!potentialSession){
  if(privateCustomer)return privateRedirect(request,'https://portal.landshopnigeria.com/');
  if(privateManagement)return privateRedirect(request,'/staff/sign-in?next='+encodeURIComponent(protectedPath+request.nextUrl.search));
  return privateRedirect(request,'/staff/sign-in');
 }
 // Provider callbacks authenticate at their own handlers (Basic/HMAC). Do not
 // depend on an unrelated browser session or Supabase Auth network lookup.
 if(request.nextUrl.pathname.startsWith('/api/communications/webhooks/'))return NextResponse.next();
 let response = NextResponse.next({request});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key){
  if(privateCustomer)return privateRedirect(request,'https://portal.landshopnigeria.com/');
  if(privateManagement)return privateRedirect(request,'/staff/sign-in?next='+encodeURIComponent(protectedPath+request.nextUrl.search));
  if(privateStaff)return privateRedirect(request,'/staff/sign-in');
  return response;
 }

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
 // Guard entire private sections before Server Component streaming starts.
 // Otherwise an anonymous RSC redirect can become HTTP 200 with a client-side
 // refresh, leaving guest auth smoke tests and intermediaries with a false 200.
 // The individual pages still validate their user, organization and role.
 if(error||!user){
  const path=request.nextUrl.pathname;
  if(path==='/staff'||path.startsWith('/staff/'))
   return privateRedirect(request,'/staff/sign-in');
  if(path==='/dashboard'||path.startsWith('/dashboard/'))
   return privateRedirect(request,'https://portal.landshopnigeria.com/');
 }
 if(user){
  const {data:state,error:stateError}=await supabase.rpc('landshop_my_account_state');
  if(stateError||state!=='active')return privateRedirect(request,'/account-unavailable');
 }
 if(request.nextUrl.pathname==='/admin'||request.nextUrl.pathname.startsWith('/admin/')){
  if(error||!user)return privateRedirect(request,'/staff/sign-in?next='+encodeURIComponent(request.nextUrl.pathname+request.nextUrl.search));
  const {data:manager,error:accessError}=await supabase.rpc('landshop_is_management',{p_user:user.id});
  if(accessError||manager!==true){
   // This evidence page separately authorizes verified staff uploads and manager reviews.
   if(request.nextUrl.pathname!=='/admin/properties/project-media')
    return privateRedirect(request,'/staff?access=management_required');
  }
  response.headers.set('Cache-Control','private, no-store');
 }
 return response;
}

export const config={runtime:'nodejs',matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
