import {NextRequest,NextResponse} from 'next/server';
import {authorizedImporter} from '../../../../../../lib/property-import-auth';

export const runtime='nodejs';
export async function POST(request:NextRequest){
 const headers={'Cache-Control':'no-store'};
 if(request.headers.get('origin')!==request.nextUrl.origin)
  return NextResponse.json({error:'Invalid origin'},{status:403,headers});
 const auth=await authorizedImporter(request);
 if(!auth)return NextResponse.json({error:'Staff login required'},{status:403,headers});
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))
  return NextResponse.json({error:'Expected JSON'},{status:415,headers});
 let payload:{object_path?:unknown};
 try{const raw=await request.text();if(raw.length>700)throw Error();payload=JSON.parse(raw)}
 catch{return NextResponse.json({error:'Invalid request'},{status:400,headers})}
 const path=payload.object_path;
 if(typeof path!=='string' || !new RegExp('^'+auth.user.id+'/[a-zA-Z0-9_.-]{1,160}[.](csv|xlsx|xml|pdf|docx|zip)$','i').test(path))
  return NextResponse.json({error:'File reference is not authorized'},{status:403,headers});
 const {data:objects,error:objectError}=await auth.db.storage.from('landshop-import-uploads')
  .list(auth.user.id,{search:path.split('/').pop(),limit:100});
 if(objectError||!objects?.some(o=>o.name===path.split('/').pop()))
  return NextResponse.json({error:'Upload not found'},{status:404,headers});
 const worker=process.env.LANDSHOP_INTERNAL_WORKER_URL,token=process.env.LANDSHOP_INTERNAL_WORKER_TOKEN;
 if(!worker||!token)return NextResponse.json({error:'Import worker not configured'},{status:503,headers});
 try{
  const response=await fetch(new URL('/internal/imports',worker),{
    method:'POST',cache:'no-store',
    headers:{'Content-Type':'application/json','X-Landshop-Worker-Token':token},
    body:JSON.stringify({object_path:path}),signal:AbortSignal.timeout(15000)
  });
  if(!response.ok)return NextResponse.json({error:'Import worker rejected job'},{status:503,headers});
  const result=await response.json();
  return NextResponse.json({job_id:result.job_id,status:'queued'},{headers});
 }catch{return NextResponse.json({error:'Import worker unavailable'},{status:503,headers})}
}
