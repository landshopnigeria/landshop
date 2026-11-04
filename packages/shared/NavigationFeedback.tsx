'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
/** Immediate feedback for client navigation, with a native-link recovery path. */
export default function NavigationFeedback(){
 const pathname=usePathname(),search=useSearchParams();
 const [pending,setPending]=useState(''),[slow,setSlow]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const clear=()=>{clearTimeout(timer.current);setPending('');setSlow(false)};
 useEffect(()=>{clear();},[pathname,search]);
 useEffect(()=>{
  const onClick=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const anchor=(event.target instanceof Element?event.target:null)?.closest('a[href]');
   if(!(anchor instanceof HTMLAnchorElement)||anchor.hasAttribute('download')||(anchor.target&&anchor.target!=='_self')||anchor.hasAttribute('data-native-navigation'))return;
   const url=new URL(anchor.href,location.href);
   if(url.origin!==location.origin||url.pathname+url.search===location.pathname+location.search)return;
   clearTimeout(timer.current);setPending(url.pathname+url.search+url.hash);setSlow(false);
   timer.current=setTimeout(()=>setSlow(true),8000);
  };
  document.addEventListener('click',onClick,true);window.addEventListener('pageshow',clear);
  return()=>{document.removeEventListener('click',onClick,true);window.removeEventListener('pageshow',clear);clearTimeout(timer.current)};
 },[]);
 if(!pending)return null;
 return <aside role="status" aria-live="polite" style={{position:'fixed',bottom:16,left:'50%',transform:'translateX(-50%)',zIndex:2147483000,width:'calc(100% - 32px)',maxWidth:620,boxSizing:'border-box',padding:'12px 16px',border:'1px solid #b4d8cd',borderRadius:12,background:'#fff',color:'#075345',boxShadow:'0 5px 24px #003e3524',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',fontSize:14}}>
  <span>{slow?'This page is taking longer to open.':'Opening page…'}</span>
  {slow&&<a href={pending} data-native-navigation style={{color:'#006b55',fontWeight:700}}>Open page directly</a>}
  <button type="button" onClick={clear} style={{marginLeft:'auto',border:'1px solid #b4d8cd',borderRadius:6,padding:'6px 10px',background:'#fff',color:'#075345',cursor:'pointer'}}>Dismiss</button>
 </aside>;
}
