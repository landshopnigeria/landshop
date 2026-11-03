'use client';
import {useEffect,useRef,useState} from 'react';

const targets=[2017,7000,17,102];
const records=[
 {label:'Founded',after:'',before:'',path:'M7 2v4M17 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z'},
 {label:'Qualified Leads',after:'+',before:'',path:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6M2 21v-2a6 6 0 0 1 12 0v2H2Zm14 0h6v-2a5 5 0 0 0-5-5'},
 {label:'Closed Property Deals',after:'+',before:'',path:'m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5'},
 {label:'Client Value',after:'M+',before:'₦',path:'M3 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm0 1V5a2 2 0 0 1 2-2h13m-3 9h6'}
];
export default function AboutImpactCounters(){
 const ref=useRef<HTMLDivElement>(null);
 const [values,setValues]=useState(targets),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(false);
 useEffect(()=>{
  const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.25});
  if(ref.current)observer.observe(ref.current);
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const change=()=>setReduced(mq.matches);
  change();mq.addEventListener('change',change);
  return()=>{observer.disconnect();mq.removeEventListener('change',change)};
 },[]);
 useEffect(()=>{
  if(!visible||reduced){setValues(targets);return;}
  let frame=0,cycle=0,cancelled=false;
  const animate=()=>{
   if(cancelled)return;
   const start=performance.now();
   const tick=(now:number)=>{
    if(cancelled)return;
    const fraction=Math.min(1,(now-start)/2600),eased=1-Math.pow(1-fraction,3);
    setValues(targets.map(n=>Math.round(n*eased)));
    if(fraction<1)frame=requestAnimationFrame(tick);
    else cycle=window.setTimeout(animate,13500);
   };
   frame=requestAnimationFrame(tick);
  };
  animate();
  return()=>{cancelled=true;cancelAnimationFrame(frame);window.clearTimeout(cycle)};
 },[visible,reduced]);
 return <div className="ls-about-impact-grid" ref={ref} aria-label="Landshop impact counters">
  {records.map((item,i)=><div className="ls-about-impact-stat" key={item.label}>
   <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.path}/></svg>
   <strong aria-label={item.label+': '+item.before+targets[i].toLocaleString('en-NG')+item.after}>{item.before}{values[i].toLocaleString('en-NG')}{item.after}</strong>
   <span>{item.label}</span>
  </div>)}
 </div>;
}
