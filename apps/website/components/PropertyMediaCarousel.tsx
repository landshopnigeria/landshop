'use client';
import {useEffect,useRef,useState} from 'react';
import type {PublicMedia} from '../lib/property-showcase';
import type {SupportedVideo} from '../lib/property-video';
import SiteIcon,{IconChip} from './SiteIcon';
type Props={title:string;images:PublicMedia[];videos:SupportedVideo[]};
export default function PropertyMediaCarousel({title,images,videos}:Props){
 const [active,setActive]=useState(0),[expanded,setExpanded]=useState(false),[zoom,setZoom]=useState(false);
 const touch=useRef<number|null>(null);
 const items=images.length?images.map(i=>({type:'image' as const,src:i.src,title:i.title})):videos.slice(0,4).map(v=>({type:'video' as const,src:v.embed,title:v.title}));
 useEffect(()=>{setActive(0)},[title,images.length,videos.length]);
 useEffect(()=>{
  if(!expanded)return;
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setExpanded(false);if(e.key==='ArrowLeft')setActive(v=>(v+items.length-1)%items.length);if(e.key==='ArrowRight')setActive(v=>(v+1)%items.length)};
  document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);
 },[expanded,items.length]);
 const current=items[active];
 const move=(by:number)=>{setZoom(false);setActive(v=>(v+by+items.length)%items.length)};
 if(!items.length)return <section className="ld-media-empty" aria-label="Property gallery not yet available"><IconChip name="camera"/><strong>Original property photography is being prepared.</strong><p>We only display property-specific images and approved videos. Request authentic property media from the Landshop team.</p></section>;
 return <div className={'ld-gallery '+(expanded?'ld-gallery-expanded':'')} role="region" aria-label={title+' media carousel'} aria-roledescription="carousel">
  <div className="ld-gallery-stage" tabIndex={0} aria-label="Property media, use left and right arrows to navigate" onKeyDown={e=>{if(e.key==="ArrowLeft"){e.preventDefault();move(-1)}if(e.key==="ArrowRight"){e.preventDefault();move(1)}if(e.key==="Escape")setExpanded(false)}} onTouchStart={e=>{touch.current=e.touches[0]?.clientX??null}} onTouchEnd={e=>{if(touch.current===null||!items.length)return;const delta=e.changedTouches[0].clientX-touch.current;if(Math.abs(delta)>55)move(delta<0?1:-1);touch.current=null}}>
   {current.type==='image'?<img key={current.src} src={current.src} alt={title+' — '+current.title} className={"ld-gallery-image "+(zoom?"ld-gallery-zoom":"")} onClick={()=>setExpanded(true)} title="Click to enlarge" fetchPriority={active===0?'high':'auto'} decoding="async"/>:
    <iframe key={current.src} title={current.title} src={current.src} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>}
   {items.length>1&&<><button type="button" className="ld-gallery-prev" aria-label="Previous media" onClick={()=>move(-1)}><SiteIcon name="chevron" size={25}/></button><button type="button" className="ld-gallery-next" aria-label="Next media" onClick={()=>move(1)}><SiteIcon name="chevron" size={25}/></button></>}
   {current.type==="image"&&expanded&&<button type="button" className="ld-gallery-zoom-control" onClick={()=>setZoom(v=>!v)}>{zoom?"Zoom out":"Zoom in"}</button>}
   <div className="ld-gallery-counter">{String(active+1).padStart(2,'0')} / {String(items.length).padStart(2,'0')}</div>
   {current.type==='image'&&<button type="button" className="ld-gallery-full" onClick={()=>{setExpanded(v=>!v);setZoom(false)}} aria-label={expanded?'Exit enlarged gallery':'Enlarge gallery'}>{expanded?'Close':'Full screen'}</button>}
  </div>
  <div className="ld-gallery-thumbs" aria-label="Select a gallery item">{items.map((item,i)=><button key={item.src} type="button" aria-label={'View '+item.title} aria-current={active===i?'true':undefined} onClick={()=>setActive(i)}>
   {item.type==='image'?<img src={item.src} alt="" loading="lazy" decoding="async"/>:<span><SiteIcon name="camera" size={22}/>Play video</span>}
  </button>)}</div>
  <p className="ld-gallery-caption" aria-live="polite">{current.title}</p>
 </div>;
}
