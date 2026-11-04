'use client';
export default function RouteError({reset}:{reset:()=>void}){
 return <section role="alert" style={{padding:'clamp(24px,5vw,64px)',maxWidth:800,margin:'0 auto',color:'#075345'}}>
  <h1>This page could not finish loading</h1>
  <p>Please try again. If the connection is still unavailable, return to the home page and retry shortly.</p>
  <button type="button" onClick={reset} style={{background:'#00886c',color:'#fff',border:0,borderRadius:8,padding:'12px 20px',cursor:'pointer'}}>Try again</button>
  <a href="/" style={{display:'inline-block',margin:16,color:'#006b55'}}>Return home</a>
 </section>;
}
