import {NextRequest,NextResponse} from 'next/server';
import {createServerClient} from '@supabase/ssr';

export async function POST(request:NextRequest){
 const headers={'Cache-Control':'no-store'};
 if(request.headers.get('origin')!==request.nextUrl.origin)
   return NextResponse.json({error:'Invalid origin'},{status:403,headers});
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))
   return NextResponse.json({error:'Expected JSON'},{status:415,headers});
 const raw=await request.text();
 if(raw.length>800)return NextResponse.json({error:'Invalid request'},{status:413,headers});
 let payload:{documentId?:unknown};
 try{payload=JSON.parse(raw)}catch{return NextResponse.json({error:'Invalid JSON'},{status:400,headers})}
 const docId=payload?.documentId;
 if(typeof docId!=='string'||!/^[0-9a-f-]{36}$/i.test(docId))
   return NextResponse.json({error:'Invalid document'},{status:400,headers});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({error:'Not configured'},{status:503,headers});
 let response=NextResponse.json({error:'Not authenticated'},{status:401,headers});
 const db=createServerClient(url,key,{
   cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true},
   cookies:{
    getAll(){return request.cookies.getAll()},
    setAll(changes){changes.forEach(({name,value,options})=>response.cookies.set(name,value,options))}
   }
 });
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)return response;
 const {data:doc,error:docError}=await db.from('kyc_documents')
   .select('object_path,submission_id').eq('id',docId).maybeSingle();
 if(docError||!doc)return NextResponse.json({error:'Not available'},{status:404,headers});
 const {error:logError}=await db.rpc('landshop_kyc_log_document_access',{p_document_id:docId});
 if(logError)return NextResponse.json({error:'Document access denied'},{status:403,headers});
 const {data:link,error:signError}=await db.storage.from('landshop-kyc')
   .createSignedUrl(doc.object_path,60);
 if(signError||!link?.signedUrl)return NextResponse.json({error:'Unable to access document'},{status:503,headers});
 response=NextResponse.json({url:link.signedUrl,expiresInSeconds:60},{headers});
 return response;
}
