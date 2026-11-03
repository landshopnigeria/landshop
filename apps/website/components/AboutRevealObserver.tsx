'use client';
import {useEffect} from 'react';

/** Progressive enhancement only: content remains visible with JS or reduced motion. */
export default function AboutRevealObserver(){
 useEffect(()=>{
  const root=document.querySelector('.ls-about-showcase');
  if(!root||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(!('IntersectionObserver' in window))return;
  const blocks=root.querySelectorAll('.ls-about-animate');
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    if(entry.isIntersecting){
     entry.target.classList.add('is-in-view');
     observer.unobserve(entry.target);
    }
   });
  },{threshold:.1,rootMargin:'0px 0px -30px 0px'});
  blocks.forEach(block=>observer.observe(block));
  root.classList.add('ls-about-motion-ready');
  return()=>{observer.disconnect();root.classList.remove('ls-about-motion-ready')};
 },[]);
 return null;
}
