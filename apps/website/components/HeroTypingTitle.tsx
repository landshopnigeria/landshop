'use client';
import {useEffect,useState} from 'react';

/**
 * Animate only this small headline component so the full homepage does not
 * re-render on every keystroke. Keep full server-rendered headline for SEO.
 */
export default function HeroTypingTitle({title,first,second,paused}:{
 title:string;first:string;second:string;paused:boolean;
}){
 const length=first.length+1+second.length;
 const [characters,setCharacters]=useState(length);
 const [deleting,setDeleting]=useState(false);

 // Play the headline from the beginning whenever its slide becomes active.
 useEffect(()=>{setCharacters(0);setDeleting(false)},[title]);

 // Hover, touch, keyboard focus and reduced-motion all show the entire
 // headline immediately, allowing visitors to read without moving text.
 useEffect(()=>{
  if(paused){setCharacters(length);setDeleting(false)}
 },[paused,length]);

 useEffect(()=>{
  if(paused)return;
  // Type, hold at the end, erase and repeat until the next slide.
  const delay=!deleting&&characters>=length?1850:
   deleting&&characters<=0?260:deleting?38:67;
  const timer=window.setTimeout(()=>{
   if(!deleting&&characters>=length){setDeleting(true);return}
   if(deleting&&characters<=0){setDeleting(false);return}
   setCharacters(n=>Math.max(0,Math.min(length,n+(deleting?-1:1))));
  },delay);
  return()=>window.clearTimeout(timer);
 },[characters,deleting,paused,length]);

 const visible=paused?length:characters;
 return <h1 className={'hero-v16-title ls-v23-hero-title ls-v23-typewriter-title'+(paused?' ls-v23-typewriter-paused':'')} aria-label={title}>
  <span aria-hidden="true">{first.slice(0,visible)}</span>{' '}<strong aria-hidden="true">{second.slice(0,Math.max(0,visible-first.length-1))}</strong>
 </h1>;
}
