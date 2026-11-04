import {NextResponse} from 'next/server';
export const dynamic='force-static';
export function GET(){
 const manifest={
  name:'Landshop Nigeria | Mobile App',
  short_name:'Landshop',
  description:'Mobile-first property discovery, home finance and secure Landshop customer services.',
  start_url:'/mobile-app?screen=home',
  scope:'/mobile-app',
  display:'standalone',
  orientation:'portrait',
  background_color:'#ffffff',
  theme_color:'#073f34',
  icons:[
   {src:'/mobile-app/icons/192',type:'image/png',sizes:'192x192',purpose:'any maskable'},
   {src:'/mobile-app/icons/512',type:'image/png',sizes:'512x512',purpose:'any maskable'}
  ]
 };
 return NextResponse.json(manifest,{headers:{'Cache-Control':'public, max-age=3600','Content-Type':'application/manifest+json'}});
}
