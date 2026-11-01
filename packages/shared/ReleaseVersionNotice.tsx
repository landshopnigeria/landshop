'use client';
import {useEffect,useRef,useState} from 'react';

/** Alert users with already-open tabs when a newer verified application build is live.
 * Does not reload forms automatically or touch authentication/session storage.
 */
export default function ReleaseVersionNotice(){
 const [stale,setStale]=useState(false);
 const checking=useRef(false);
 useEffect(()=>{
  const loaded=process.env.NEXT_PUBLIC_LANDSHOP_RELEASE_SHA||'';
  if(!/^[a-f0-9]{40}$/.test(loaded))return;
  let alive=true;
  async function verify(){
   if(checking.current)return;
   checking.current=true;
   try{
    const response=await fetch('/api/release-health?version_check='+Date.now(),{
     cache:'no-store',credentials:'same-origin',
     headers:{'Cache-Control':'no-cache, no-store','Pragma':'no-cache'}
    });
    if(!response.ok)return;
    const result=await response.json() as {commit?:unknown;status?:unknown};
    if(alive&&result.status==='serving-nextjs'&&typeof result.commit==='string'
      &&/^[a-f0-9]{40}$/.test(result.commit)&&result.commit!==loaded){
     setStale(true);
    }
   }catch{ /* Do not interrupt a working page for transient connectivity errors. */ }
   finally{checking.current=false}
  }
  const onFocus=()=>void verify();
  const onVisible=()=>{if(document.visibilityState==='visible')void verify()};
  window.addEventListener('focus',onFocus);
  window.addEventListener('pageshow',onFocus);
  document.addEventListener('visibilitychange',onVisible);
  void verify();
  return()=>{
   alive=false;
   window.removeEventListener('focus',onFocus);
   window.removeEventListener('pageshow',onFocus);
   document.removeEventListener('visibilitychange',onVisible);
  };
 },[]);
 if(!stale)return null;
 return <div role="status" aria-live="polite" data-landshop-stale-build="true"
  style={{position:'fixed',zIndex:2147483000,bottom:16,left:16,right:16,maxWidth:520,
   padding:'14px 18px',borderRadius:13,display:'flex',alignItems:'center',
   justifyContent:'space-between',gap:15,boxShadow:'0 14px 50px #092b2570',
   color:'#fff',background:'#073f34',fontFamily:'Arial,sans-serif',fontSize:14}}>
  <span>A newer Landshop update is available. Refresh to load the latest website.</span>
  <button type="button" onClick={()=>window.location.reload()}
   style={{background:'#f26b10',color:'#fff',border:0,borderRadius:9,
    padding:'11px 15px',fontWeight:750,cursor:'pointer',whiteSpace:'nowrap'}}>Refresh</button>
 </div>;
}
