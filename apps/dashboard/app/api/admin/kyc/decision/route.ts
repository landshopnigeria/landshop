import {NextRequest,NextResponse} from 'next/server';
import {createServerClient} from '@supabase/ssr';

export async function POST(request:NextRequest){
 const origin=request.headers.get('origin');
 if(origin!==request.nextUrl.origin)return NextResponse.json({error:'Invalid request origin'},{status:403});
 const ct=request.headers.get('content-type')||'';
 if(!ct.toLowerCase().startsWith('application/json'))return NextResponse.json({error:'Expected JSON'},{status:415});
 const raw=await request.text();
 if(raw.length>3500)return NextResponse.json({error:'Payload too large'},{status:413});
 let body:unknown;
 try{body=JSON.parse(raw)}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 if(!body||typeof body!=='object')return NextResponse.json({error:'Invalid request'},{status:400});
 const {submissionId,decision,reason}=body as Record<string,unknown>;
 if(typeof submissionId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)||
    !['approved','rejected'].includes(String(decision))||typeof reason!=='string'||
    reason.trim().length<15||reason.trim().length>1500)
  return NextResponse.json({error:'Invalid decision details'},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({error:'Identity backend not configured'},{status:503});
 let response:NextResponse=NextResponse.json({error:'Authorization failed'},{status:401});
 const supabase=createServerClient(url,key,{
   cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
   cookies:{
    getAll(){return request.cookies.getAll()},
    setAll(changes){
      changes.forEach(({name,value})=>request.cookies.set(name,value));
      changes.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    }
   }
 });
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return response;
 // The SQL function authorizes verified Landshop reviewers again and executes
 // changes to submission, profile, audit and outbox atomically.
 const {data,error}=await supabase.rpc('landshop_kyc_decide',{
   p_submission_id:submissionId,
   p_decision:decision,
   p_reason:reason.trim()
 });
 response=error?NextResponse.json({error:'Unable to record decision. Check reviewer permissions, documents, or application status.'},{status:403})
  :NextResponse.json({success:true,result:data},{status:200});
 response.headers.set('Cache-Control','no-store');
 return response;
}
