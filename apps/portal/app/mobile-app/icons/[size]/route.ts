import {createElement} from 'react';
import {ImageResponse} from 'next/og';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{size:string}>}){
 const value=(await params).size;
 if(value!=='192'&&value!=='512')return new Response('Not found',{status:404});
 const size=Number(value);
 const approvedLogo=await readFile(path.join(process.cwd(),'public','media','logo-transparent.png'));
 const mark='data:image/png;base64,'+approvedLogo.toString('base64');
 const image=createElement('div',{style:{display:'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',background:'linear-gradient(145deg,#ffffff,#e7f5ec)',borderRadius:size*.2}},
   createElement('img',{src:mark,width:Math.round(size*.84),height:Math.round(size*.57),style:{objectFit:'contain'}}));
 return new ImageResponse(image,{width:size,height:size,headers:{'Cache-Control':'public, max-age=86400, stale-while-revalidate=604800'}});
}
