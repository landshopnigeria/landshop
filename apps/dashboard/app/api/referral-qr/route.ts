import {NextRequest,NextResponse} from 'next/server';
import {createServerClient} from '@supabase/ssr';

/** Authenticated, on-demand QR generation. Never reveals another member's code. */
export async function GET(request:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({error:'Unavailable'},{status:503});
 const response=NextResponse.next();
 const db=createServerClient(url,key,{
  cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
  cookies:{
   getAll(){return request.cookies.getAll()},
   setAll(changes){changes.forEach(({name,value,options})=>response.cookies.set(name,value,options));}
  }
 });
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:'Sign in to access your referral QR'},{status:401});
 const {data}=await db.from('referral_codes').select('code').eq('user_id',user.id).maybeSingle();
 if(!data?.code)return NextResponse.json({error:'Referral code unavailable'},{status:404});
 const invite='https://portal.landshopnigeria.com/?mode=signup&ref='+encodeURIComponent(data.code);
 const qr='https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data='+encodeURIComponent(invite);
 try{
  const external=await fetch(qr,{cache:'no-store',signal:AbortSignal.timeout(6500)});
  if(!external.ok||!(external.headers.get('content-type')||'').includes('image/png'))throw Error('Provider error');
  const bytes=await external.arrayBuffer();
  if(bytes.byteLength>256000||bytes.byteLength<100)throw Error('Unexpected image size');
  const download=request.nextUrl.searchParams.get('download')==='1';
  const headers=new Headers({
   'Content-Type':'image/png','Cache-Control':'private, no-store',
   'Content-Disposition':(download?'attachment':'inline')+'; filename="Landshop-'+data.code+'-Referral-QR.png"'
  });
  const imageResponse=new NextResponse(bytes,{status:200,headers});
  for(const cookie of response.cookies.getAll())imageResponse.cookies.set(cookie);
  return imageResponse;
 }catch{return NextResponse.json({error:'QR generation is temporarily unavailable. Copy your referral link instead.'},{status:503})}
}
