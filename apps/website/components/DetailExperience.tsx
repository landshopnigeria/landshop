'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import './detail-experience.css';

export type DetailItem={slug:string;title:string;image?:string;href:string;description?:string};
export type DetailData={
 kind:'Project'|'Service'|'Product';title:string;eyebrow:string;description:string;
 status:string;category:string;location:string;date:string;tags:string[];
 images:{src:string;caption:string;alt?:string}[];
 facts:[string,string][];overview:string;highlights:string[];
 milestones:[string,string][];disclaimer:string;related:DetailItem[];
 primaryHref:string;primaryLabel:string;secondaryHref?:string;secondaryLabel?:string;
};
export default function DetailExperience({data:d}:{data:DetailData}){
 const [slide,setSlide]=useState(0),[tab,setTab]=useState('Overview'),[page,setPage]=useState(0),[expanded,setExpanded]=useState(false);
 const images=d.images,active=images[slide%images.length];
 useEffect(()=>{setSlide(0);setTab('Overview');setPage(0)},[d.title]);
 useEffect(()=>{if(images.length<2)return;const id=window.setInterval(()=>{if(!document.hidden&&!document.querySelector('.lde-gallery')?.matches(':hover')&&!expanded)setSlide(i=>(i+1)%images.length)},6000);return()=>window.clearInterval(id)},[images.length,expanded]);
 useEffect(()=>{if(!expanded)return;const fn=(e:KeyboardEvent)=>{if(e.key==='Escape')setExpanded(false);if(e.key==='ArrowRight')setSlide(i=>(i+1)%images.length);if(e.key==='ArrowLeft')setSlide(i=>(i+images.length-1)%images.length)};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[expanded,images.length]);
 const totalPages=Math.max(1,Math.ceil(d.related.length/3));
 return <section className="lde" aria-label={d.title+' details'}>
  <div className="lde-head"><div><div className="lde-eyebrow">{d.eyebrow}</div><h1>{d.title}<span>.</span></h1><p>{d.description}</p><div className="lde-status">{d.status}</div></div></div>
  <div className="lde-columns">
   <div className="lde-main">
    <div className="lde-gallery">
     <button type="button" className="lde-feature" onClick={()=>setExpanded(true)} aria-label="Enlarge current photograph">
      <img src={active.src} alt={active.alt||active.caption} />
      <span className="lde-counter">{slide+1} / {images.length}</span>
     </button>
     {images.length>1&&<><button className="lde-prev" aria-label="Previous photograph" onClick={()=>setSlide((slide+images.length-1)%images.length)}>‹</button><button className="lde-next" aria-label="Next photograph" onClick={()=>setSlide((slide+1)%images.length)}>›</button></>}
     <p className="lde-caption">{active.caption}</p>
    </div>
    <div className="lde-thumbs" aria-label="Photo gallery thumbnails">{images.map((im,i)=><button key={im.src} onClick={()=>setSlide(i)} aria-label={'Show image '+(i+1)} aria-pressed={slide===i} className={slide===i?'selected':''}><img src={im.src} alt={im.alt||im.caption} loading="lazy"/></button>)}</div>
    <div className="lde-facts">{d.facts.map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    <div className="lde-tabs" role="tablist" aria-label="Details">{['Overview','Progress','Documents','Gallery','FAQs'].map(t=><button key={t} role="tab" aria-selected={tab===t} className={tab===t?'selected':''} onClick={()=>setTab(t)}>{t}</button>)}</div>
    <div className="lde-tab-body">
     {tab==='Overview'&&<><h2>About {d.title}.</h2><p>{d.overview}</p><div className="lde-checks">{d.highlights.map(x=><div key={x}><span>✓</span>{x}</div>)}</div></>}
     {tab==='Progress'&&<><h2>{d.kind==='Project'?'Project record and milestones':'How it works'}.</h2><div className="lde-timeline">{d.milestones.map(([year,detail],i)=><div key={i}><strong>{year}</strong><p>{detail}</p></div>)}</div></>}
     {tab==='Documents'&&<><h2>Documents and verification.</h2><p>{d.disclaimer}</p><Link className="lde-link" href={d.primaryHref}>Request verified information →</Link></>}
     {tab==='Gallery'&&<><h2>Project photo record.</h2><p>Browse the photographs above. Archive photographs document earlier activity and do not confirm current availability or completion.</p><div className="lde-checks">{images.map(im=><div key={im.src}><span>✓</span>{im.caption}</div>)}</div></>}
     {tab==='FAQs'&&<><h2>Frequently asked questions.</h2><details><summary>Is the information current?</summary><p>{d.disclaimer}</p></details><details><summary>Can I request a consultation or inspection?</summary><p>Yes. Use the enquiry action to reach the official Landshop contact or inspection workflow. Requests require confirmation.</p></details><details><summary>How do I get project documents?</summary><p>Request an approved project-specific document pack before making any financial commitment.</p></details></>}
    </div>
   </div>
   <aside className="lde-side"><div className="lde-sidecard"><h3>{d.kind} information</h3><dl><div><dt>Category</dt><dd>{d.category}</dd></div><div><dt>Location</dt><dd>{d.location}</dd></div><div><dt>Date / stage</dt><dd>{d.date}</dd></div><div><dt>Status</dt><dd>{d.status}</dd></div></dl><h4>Tags</h4><div className="lde-tags">{d.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div>
    <div className="lde-sidecard lde-enquiry"><div className="lde-eyebrow">GET IN TOUCH</div><h3>Enquire about {d.title}.</h3><p>Ask about verified records, availability, documentation or a guided appointment.</p><Link className="lde-primary" href={d.primaryHref}>{d.primaryLabel} →</Link>{d.secondaryHref&&<Link className="lde-secondary" href={d.secondaryHref}>{d.secondaryLabel||'Explore more'} →</Link>}<small>Your enquiry is handled through Landshop's existing secure workflows.</small></div>
   </aside>
  </div>
  <div className="lde-related"><div className="lde-related-title"><div><div className="lde-eyebrow">EXPLORE MORE</div><h2>Related {d.kind.toLowerCase()}s.</h2></div><span>{d.related.length} available pages</span></div><div className="lde-cards">{d.related.slice(page*3,page*3+3).map(r=><Link href={r.href} className="lde-related-card" key={r.href}>{r.image?<img src={r.image} alt={r.title} loading="lazy"/>:<div className="lde-no-photo">Photography awaiting project verification</div>}<div><h3>{r.title}</h3><p>{r.description||'Explore more Landshop information and services.'}</p><strong>View details →</strong></div></Link>)}</div>{totalPages>1&&<div className="lde-pagination" aria-label="Related page pagination">{Array.from({length:totalPages},(_,i)=><button key={i} onClick={()=>setPage(i)} aria-current={page===i?'page':undefined}>{i+1}</button>)}</div>}</div>
  {expanded&&<div className="lde-lightbox" role="dialog" aria-modal="true" aria-label="Expanded project photo"><button className="lde-close" onClick={()=>setExpanded(false)} aria-label="Close enlarged photograph">×</button><button onClick={()=>setSlide((slide+images.length-1)%images.length)} aria-label="Previous photo">‹</button><figure><img src={active.src} alt={active.alt||active.caption}/><figcaption>{active.caption}</figcaption></figure><button onClick={()=>setSlide((slide+1)%images.length)} aria-label="Next photo">›</button></div>}
 </section>;
}
