'use client';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import ApprovedArrow from './ApprovedArrow';
import {usePathname} from 'next/navigation';
import './InvestmentPopup.css';

const STORAGE_KEY='landshop:investment-popup:v1';
const SESSION_START='landshop:investment-popup-start:v1';
const DISMISSED_UNTIL='landshop:investment-popup-cta-until:v1';
const TRIGGERS=[10_000,30_000,50_000];
const HOUR=60*60*1000;
type Impression={at:number,slot:number};

function readImpressions():Impression[]{
 try {
  const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
  return Array.isArray(value)?value.filter((item):item is Impression=>Number.isFinite(item?.at)&&Number.isInteger(item?.slot)&&item.slot>=0&&item.slot<3&&Date.now()-item.at<HOUR&&item.at<=Date.now()):[];
 } catch{return []}
}

export default function InvestmentPopup(){
 const pathname=usePathname();
 const [open,setOpen]=useState(false);
 const started=useRef(0);
 const lastFocus=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  try {
   const previous=Number(sessionStorage.getItem(SESSION_START));
   started.current=Number.isFinite(previous)&&previous>0&&previous<=Date.now()?previous:Date.now();
   sessionStorage.setItem(SESSION_START,String(started.current));
  } catch{started.current=Date.now()}
  // A short interval lets the timer continue through client-side navigation.
  const interval=window.setInterval(()=>{
   if(document.hidden||open||pathname?.startsWith('/auth')||pathname?.startsWith('/signin'))return;
   if(document.querySelector('[role="dialog"],[aria-modal="true"]'))return;
   const focused=document.activeElement;
   if(focused instanceof HTMLElement&&focused.matches('input,textarea,select,[contenteditable="true"]'))return;
   try{if(Number(localStorage.getItem(DISMISSED_UNTIL))>Date.now())return}catch{}
   const elapsed=Date.now()-started.current;
   const impressions=readImpressions();
   if(impressions.length>=3)return;
   const eligible=TRIGGERS.findIndex((delay,slot)=>elapsed>=delay&&!impressions.some(item=>item.slot===slot));
   if(eligible<0)return;
   const next=[...impressions,{at:Date.now(),slot:eligible}];
   try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next))}catch{}
   lastFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
   setOpen(true);
  },1000);
  return()=>window.clearInterval(interval);
 },[open,pathname]);
 useEffect(()=>{
  if(!open)return;
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
  window.addEventListener('keydown',onKey);
  const priorOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const closeButton=document.getElementById('ls-investment-close');
  closeButton?.focus();
  return()=>{window.removeEventListener('keydown',onKey);document.body.style.overflow=priorOverflow;lastFocus.current?.focus()};
 },[open]);
 const onInvest=()=>{
  try{localStorage.setItem(DISMISSED_UNTIL,String(Date.now()+24*HOUR))}catch{}
  setOpen(false);
 };
 if(!open)return null;
 return <div className="ls-investment-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}} role="presentation">
  <section className="ls-investment-popup" role="dialog" aria-modal="true" aria-labelledby="ls-investment-heading" aria-describedby="ls-investment-description">
   <button id="ls-investment-close" type="button" className="ls-investment-close" aria-label="Close investment offer" onClick={()=>setOpen(false)}>×</button>
   <div className="ls-investment-photo" role="img" aria-label="Landshop Nigerian residential estate"/>
   <div className="ls-investment-content">
    <span className="ls-investment-eyebrow">LANDSHOP NIGERIA</span>
    <h2 id="ls-investment-heading">Your Next Property Investment Starts Here.</h2>
    <p id="ls-investment-description">Discover property ownership and investment opportunities designed around your goals.</p>
    <Link href="/incubate" onClick={onInvest} className="ls-investment-action">Invest Now <ApprovedArrow/></Link>
    <p className="ls-investment-note">Explore opportunities at your own pace.</p>
   </div>
  </section>
 </div>;
}
