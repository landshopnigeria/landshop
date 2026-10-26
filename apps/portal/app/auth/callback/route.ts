import {NextRequest,NextResponse} from 'next/server';
import {createServerClient} from '@supabase/ssr';
export async function GET(request:NextRequest){
 const origin=request.nextUrl.origin, code=request.nextUrl.searchParams.get('code');
 if(!code)return NextResponse.redirect(new URL('/?error=missing_code',origin));
 const response=NextResponse.redirect(new URL('/?verified=1',origin));
 const supabase=createServerClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
 {cookies:{getAll(){return request.cookies.getAll()},setAll(changes){changes.forEach(c=>response.cookies.set(c.name,c.value,c.options))}}}
 );
 const {error}=await supabase.auth.exchangeCodeForSession(code);
 if(error)return NextResponse.redirect(new URL('/?error=auth_callback',origin));
 // TODO: Cross-subdomain secure session handoff, role lookup and KYC gate.
 return response;
}
