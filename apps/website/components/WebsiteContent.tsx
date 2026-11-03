 'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {safeContentURL,pageStyleCSS,type SiteEdit} from '../../../packages/shared/content-model';
export default function WebsiteContent(){const path=usePathname();useEffect(()=>{
 let cancelled=false;let observer:MutationObserver|undefined;let timer:ReturnType<typeof setTimeout>|undefined;const changes:Array<()=>void>=[];
 fetch('/api/site-content?route='+encodeURIComponent(path)).then(r=>r.ok?r.json():[]).then((rows:SiteEdit[])=>{
 if(cancelled||!Array.isArray(rows)||!rows.length)return;
 const apply=()=>{if(cancelled)return;for(const row of rows){try{
 const el=document.querySelector(row.selector);if(!el||el.closest('script,style,input,textarea,select,[contenteditable]'))continue;
 if(row.kind==='text'){const node=el.childNodes[row.node_index];if(node?.nodeType===Node.TEXT_NODE&&node.nodeValue===row.original){node.nodeValue=row.replacement;changes.push(()=>{if(node.nodeValue===row.replacement)node.nodeValue=row.original})}}
 else if(row.kind==='style'){if(!(el instanceof HTMLElement)||el.getAttribute('style')!== (row.original||null)||document.querySelector('style[data-ls-edit="'+rows.indexOf(row)+'"]'))continue;const css=pageStyleCSS(row.selector,row.replacement);if(css){const tag=document.createElement('style');tag.dataset.lsEdit=String(rows.indexOf(row));tag.textContent=css;document.head.appendChild(tag);changes.push(()=>tag.remove())}}
 else if(safeContentURL(row.replacement,row.kind)){const attr=row.kind==='link'?'href':'src';if((row.kind==='link'&&el.tagName!=='A')||(row.kind==='image'&&el.tagName!=='IMG')||(row.kind==='video'&&!['VIDEO','SOURCE'].includes(el.tagName)))continue;if(el.getAttribute(attr)===row.original){const oldset=el.getAttribute('srcset');el.setAttribute(attr,row.replacement);if(row.kind==='image')el.removeAttribute('srcset');changes.push(()=>{if(el.getAttribute(attr)===row.replacement){el.setAttribute(attr,row.original);if(oldset)el.setAttribute('srcset',oldset)}})}}
 }catch{/* A changed selector is left untouched. */}}};apply();observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(apply,120)});observer.observe(document.body,{childList:true,subtree:true});
 }).catch(()=>{});return()=>{cancelled=true;observer?.disconnect();clearTimeout(timer);changes.reverse().forEach(undo=>undo())};
 },[path]);return null}
