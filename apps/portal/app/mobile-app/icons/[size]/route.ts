import {createElement} from 'react';
import {ImageResponse} from 'next/og';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{size:string}>}){
 const raw=(await params).size;
 if(raw!=='192'&&raw!=='512')return new Response('Not found',{status:404});
 const n=Number(raw);
 const brand=createElement('div',{style:{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'linear-gradient(150deg,#f5fff9,#ffffff 46%,#d6f3e2)',borderRadius:n*.2}},
  createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',width:n*.55,height:n*.55,background:'#073f34',borderRadius:n*.16,color:'#fff',fontWeight:800,fontSize:n*.31,letterSpacing:-n*.02}},'L'),
  createElement('div',{style:{display:'flex',width:n*.32,height:n*.025,borderRadius:6,background:'#f26b10',marginTop:-n*.012}}),
  createElement('div',{style:{display:'flex',fontSize:n*.092,fontWeight:800,color:'#073f34',letterSpacing:n*.002,marginTop:n*.045}},'LANDSHOP'));
 return new ImageResponse(brand,{width:n,height:n});
}
