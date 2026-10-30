import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request:NextRequest) {
 const code=request.nextUrl.searchParams.get('code');
 const tokenHash=request.nextUrl.searchParams.get('token_hash');
 const type=request.nextUrl.searchParams.get('type');
 const origin='https://portal.landshopnigeria.com';
 if(!code && !tokenHash)return NextResponse.redirect(new URL('/?error=missing_code',origin));
 // Keep the response object that receives authentication cookies.
 const response=NextResponse.redirect('https://app.landshopnigeria.com/dashboard');
 response.headers.set('Cache-Control','no-store');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.redirect(new URL('/?error=configuration',origin));
 const supabase=createServerClient(url,key,{
   cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
   cookies:{
     getAll(){return request.cookies.getAll()},
     setAll(changes){changes.forEach(({name,value,options})=>response.cookies.set(name,value,options))}
   }
 });
 let error:null|unknown=null;
 if(code){const result=await supabase.auth.exchangeCodeForSession(code);error=result.error}
 else if(tokenHash && (type==='signup'||type==='recovery'||type==='invite'||type==='email_change'||type==='magiclink')){
   const result=await supabase.auth.verifyOtp({token_hash:tokenHash,type:type==='magiclink'?'magiclink':type});
   error=result.error;
 }else{return NextResponse.redirect(new URL('/?error=invalid_callback',origin))}
 if(error)return NextResponse.redirect(new URL('/?error=auth_callback',origin));
 if(type==='recovery')response.headers.set('Location',origin+'/update-password');
 else{
  // Metadata controls UX routing only, never permissions.
  const {data:{user}}=await supabase.auth.getUser();
  if(user?.user_metadata?.staff_signup===true)
    response.headers.set('Location','https://app.landshopnigeria.com/staff');
 }
 return response;
}
