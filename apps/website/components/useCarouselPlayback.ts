'use client';
import {useEffect,useRef,useState,type FocusEvent} from 'react';

/** Shared playback controls for Landshop carousels.
 * Advance only while the carousel is not hovered, focused or being touched.
 * Honour reduced-motion preferences and stop while the document is hidden.
 * Manual navigation remains available at all times.
 */
export function useCarouselPlayback({count,onAdvance,delay=6500,disabled=false}:{
 count:number;onAdvance:()=>void;delay?:number;disabled?:boolean;
}){
 const [hovered,setHovered]=useState(false);
 const [focused,setFocused]=useState(false);
 const [touching,setTouching]=useState(false);
 const [documentVisible,setDocumentVisible]=useState(true);
 const [motionReduced,setMotionReduced]=useState(false);
 const advance=useRef(onAdvance);
 advance.current=onAdvance;
 useEffect(()=>{
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const checkMotion=()=>setMotionReduced(motion.matches);
  const checkVisibility=()=>setDocumentVisible(!document.hidden);
  checkMotion();checkVisibility();
  motion.addEventListener('change',checkMotion);
  document.addEventListener('visibilitychange',checkVisibility);
  return()=>{motion.removeEventListener('change',checkMotion);document.removeEventListener('visibilitychange',checkVisibility)};
 },[]);
 const paused=disabled||count<2||hovered||focused||touching||motionReduced||!documentVisible;
 useEffect(()=>{
  if(paused)return;
  const id=window.setInterval(()=>advance.current(),delay);
  return()=>window.clearInterval(id);
 },[paused,delay]);
 const handlers={
  onMouseEnter:()=>setHovered(true),
  onMouseLeave:()=>setHovered(false),
  onFocusCapture:()=>setFocused(true),
  onBlurCapture:(event:FocusEvent<HTMLElement>)=>{
   if(!event.currentTarget.contains(event.relatedTarget as Node|null))setFocused(false);
  },
  onTouchStart:()=>setTouching(true),
  onTouchEnd:()=>setTouching(false),
  onTouchCancel:()=>setTouching(false)
 };
 return {paused,handlers};
}
