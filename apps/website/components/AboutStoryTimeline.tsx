'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';

const moments=[
 {title:'2017: The Beginning',body:'Founded to help more Nigerians access land and build wealth through property.',icon:'M7 2v4M17 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z'},
 {title:'Property Pathways',body:'Expanded our offering into property acquisition, homeownership and guided investment enquiries.',icon:'m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5'},
 {title:'Structured Access',body:'Clearer property journeys, documentation guidance and flexible ownership pathways.',icon:'m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10 9-5m-9 5L3 7m9 5v10'},
 {title:'Today',body:'A growing real estate brand supporting clients through property decisions and long-term value.',icon:'M4 20h16M7 17V9m5 8V4m5 13v-6'}
];
export default function AboutStoryTimeline(){
 const ref=useRef<HTMLDivElement>(null);
 const [active,setActive]=useState(0),[visible,setVisible]=useState(false),[hovered,setHovered]=useState(false),[reduced,setReduced]=useState(false);
 useEffect(()=>{
  const node=ref.current;
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion=()=>setReduced(mq.matches);
  motion();mq.addEventListener('change',motion);
  const io=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:0.24});
  if(node)io.observe(node);
  return()=>{io.disconnect();mq.removeEventListener('change',motion)};
 },[]);
 useEffect(()=>{
  if(!visible||hovered||reduced)return;
  const id=window.setInterval(()=>setActive(current=>(current+1)%moments.length),4200);
  return()=>window.clearInterval(id);
 },[visible,hovered,reduced]);
 const progress={'--ls-progress':String((active/(moments.length-1))*100)+'%'} as CSSProperties;
 return <div ref={ref} className={'ls-about-timeline ls-about-timeline-interactive'+(visible?' is-in-view':'')} style={progress} aria-label="Landshop company story timeline" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setHovered(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setHovered(false)}}>
  <div className="ls-about-timeline-line" aria-hidden="true"><span/></div>
  {moments.map((item,i)=><article key={item.title} className={'ls-about-milestone'+(i===active?' is-active':'')}>
   <button type="button" className="ls-about-milestone-control" aria-label={'Focus on '+item.title} aria-pressed={i===active} onClick={()=>setActive(i)}>
    <span className="ls-about-timeline-icon"><svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.icon}/></svg></span>
    <span className="ls-about-timeline-dot" aria-hidden="true"/>
   </button>
   <h3>{item.title}</h3><p>{item.body}</p>
  </article>)}
 </div>;
}
