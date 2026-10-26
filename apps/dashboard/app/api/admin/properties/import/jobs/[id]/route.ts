import {NextRequest,NextResponse} from 'next/server';
import {authorizedImporter} from '../../../../../../../lib/property-import-auth';
export const runtime='nodejs';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const headers={'Cache-Control':'no-store'};
 const auth=await authorizedImporter(request);
 if(!auth)return NextResponse.json({error:'Access denied'},{status:403,headers});
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))
  return NextResponse.json({error:'Invalid job reference'},{status:400,headers});
 const worker=process.env.LANDSHOP_INTERNAL_WORKER_URL,token=process.env.LANDSHOP_INTERNAL_WORKER_TOKEN;
 if(!worker||!token)return NextResponse.json({error:'Worker unavailable'},{status:503,headers});
 try{
  const response=await fetch(new URL('/internal/imports/'+id,worker),{
    cache:'no-store',headers:{'X-Landshop-Worker-Token':token},signal:AbortSignal.timeout(12000)
  });
  if(!response.ok)return NextResponse.json({error:'Job lookup failed'},{status:503,headers});
  const data=await response.json();
  return NextResponse.json(data,{headers});
 }catch{return NextResponse.json({error:'Worker unreachable'},{status:503,headers})}
}
