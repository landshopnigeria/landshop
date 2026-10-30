'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import Link from 'next/link';

export type FooterSlide={
 id:string;kind:'testimonial'|'article';type:string;image:string;alt:string;heading:string;byline:string;href?:string;
 videoUrl?:string;
};
export function NewsletterSignup(){
 const [email,setEmail]=useState(''),[status,setStatus]=useState(''),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 const [trap,setTrap]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;
  setError(false);setStatus('');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||email.length>254){setError(true);setStatus('Enter a valid email address.');return;}
  setBusy(true);
  try{
   const res=await fetch('/api/newsletter/subscribe',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim(),website:trap})});
   const data=await res.json();
   if(!res.ok||!data.ok)throw Error(data.message||'Subscription could not be saved.');
   setStatus('You’re subscribed to Landshop property updates.');setEmail('');
  }catch(e){setError(true);setStatus(e instanceof Error?e.message:'Please try again later.');}
  finally{setBusy(false);}
 }
 return <section className="ls24-newsletter-section" aria-label="Landshop newsletter">
  <div className="ls24-newsletter-glass">
   <h2>Stay updated with property news and insights.</h2>
   <form className="ls24-newsletter-form" onSubmit={submit}>
    <label className="ls24-sr-only" htmlFor="ls24-email">Email address</label>
    <input id="ls24-email" type="email" autoComplete="email" name="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} placeholder="Enter your email address" required/>
    <input value={trap} onChange={e=>setTrap(e.target.value)} name="website" type="text" tabIndex={-1} aria-hidden="true" className="ls24-honeypot" autoComplete="off"/>
    <button type="submit" disabled={busy}>{busy?'Subscribing…':'Subscribe'} <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
   </form>
   {status&&<output role={error?'alert':'status'} aria-live="polite" className={'ls24-newsletter-result '+(error?'is-error':'')}>{status}</output>}
  </div>
 </section>
}
export function FooterCarousel({slides}:{slides:FooterSlide[]}){
 const [active,setActive]=useState(0),[paused,setPaused]=useState(false);
 const carouselRef=useRef<HTMLDivElement|null>(null);
 const count=slides.length;
 useEffect(()=>{
  if(paused||count<2||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ticker=window.setInterval(()=>setActive(i=>(i+1)%count),6500);
  return()=>window.clearInterval(ticker);
 },[paused,count]);
 if(!count)return <div className="ls24-carousel-empty"><Link href="/insights">Explore Landshop insights ↗</Link></div>;
 const current=slides[active%count];
 const go=(n:number)=>setActive((n+count)%count);
 return <div ref={carouselRef} className="ls24-carousel-shell" role="region" aria-roledescription="carousel" aria-label="Landshop testimonials and insights"
  onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
  onFocus={()=>setPaused(true)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setPaused(false)}}
  onKeyDown={e=>{if(e.key==='ArrowLeft'){e.preventDefault();go(active-1)}else if(e.key==='ArrowRight'){e.preventDefault();go(active+1)}}}>
  {current.videoUrl?<video key={current.id} className="ls24-carousel-photo" controls playsInline preload="metadata" poster={current.image} onPlay={()=>setPaused(true)} onPause={()=>setPaused(false)}><source src={current.videoUrl}/></video>:
   <img key={current.id} className="ls24-carousel-photo" src={current.image} alt={current.alt} loading="lazy"/>}
  <div className="ls24-carousel-layer" aria-hidden="true"/>
  <div className="ls24-carousel-top"><span className="ls24-carousel-type">{current.type}</span><span className="ls24-carousel-count">{String(active+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</span></div>
  <div className="ls24-carousel-bottom">
   <p className={'ls24-carousel-headline '+(current.kind==='testimonial'?'is-quote':'')}>{current.kind==='testimonial'?'“'+current.heading+'”':current.heading}</p>
   <span className="ls24-carousel-byline">{current.byline}</span>
   {current.href&&<Link className="ls24-carousel-link" href={current.href}>{current.kind==='article'?'Read article ↗':'View experience ↗'}</Link>}
  </div>
  <div className="ls24-carousel-controls">
   <div className="ls24-carousel-dots" role="group" aria-label="Choose a slide">{slides.map((slide,i)=><button type="button" key={slide.id} className={active===i?'active':''} onClick={()=>go(i)} aria-current={active===i?'true':undefined} aria-label={'Show '+slide.type.toLowerCase()+' '+(i+1)}/>)}</div>
   <div className="ls24-carousel-arrows"><button type="button" onClick={()=>go(active-1)} aria-label="Previous testimonial or article"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6"/></svg></button><button type="button" onClick={()=>go(active+1)} aria-label="Next testimonial or article"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6"/></svg></button></div>
  </div>
  {!paused&&count>1&&<div className="ls24-carousel-progress" aria-hidden="true" key={active}/>}
 </div>;
}
