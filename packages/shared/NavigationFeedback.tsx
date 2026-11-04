'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

/**
 * Keep navigation visually immediate: no global "Opening" / "Loading" banners.
 *
 * Use a delegated pointer/focus warmup instead of attaching an event handler
 * to every link. Do not prefetch auth, admin, account, API, payment or
 * form-submission endpoints: those should remain authoritative and private.
 *
 * Next <Link> continues to manage its own client-side cache and transitions.
 */
const publicPaths=/^\/(?:about|products|develop|incubate|grow|devpro|estatepro|properties|projects|locations|services|company|insights|blog|articles|contact|careers|thrift|applications|mobile-app|search)(?:\/|$)/i;
export default function NavigationFeedback(){
 const router=useRouter();
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  const warmed=new Set<string>();
  let lastAnchor:HTMLAnchorElement|null=null;
  const warm=(event:Event)=>{
   const target=event.target;
   const anchor=target instanceof Element?target.closest('a[href]'):null;
   if(!(anchor instanceof HTMLAnchorElement))return;
   if(anchor===lastAnchor&&event.type==='pointerover')return;
   lastAnchor=anchor;
   if(anchor.hasAttribute('download')||anchor.hasAttribute('data-native-navigation')||(anchor.target&&anchor.target!=='_self'))return;
   let url:URL;
   try{url=new URL(anchor.href,window.location.href)}catch{return}
   if(url.origin!==location.origin||!publicPaths.test(url.pathname)||url.pathname===location.pathname&&url.search===location.search)return;
   const href=url.pathname+url.search;
   if(warmed.has(href))return;
   if(warmed.size>=35)return; // Bound network / memory on long browsing sessions.
   clearTimeout(timer);
   timer=setTimeout(()=>{
    warmed.add(href);
    // Background prefetch never blocks navigation and never shows a message.
    try{router.prefetch(href)}catch{/* A normal click still works. */}
   },event.type==='pointerover'?95:0);
  };
  document.addEventListener('pointerover',warm,{passive:true});
  document.addEventListener('focusin',warm);
  document.addEventListener('touchstart',warm,{passive:true});
  return()=>{
   clearTimeout(timer);
   document.removeEventListener('pointerover',warm);
   document.removeEventListener('focusin',warm);
   document.removeEventListener('touchstart',warm);
  };
 },[router]);
 return null;
}
