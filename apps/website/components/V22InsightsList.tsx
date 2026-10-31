'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
type Article={slug:string;title:string;category:string;summary:string;image:string;imageAlt?:string;readingMinutes:number;tags?:string[]};
export default function V22InsightsList({articles,initialCategory='All'}:{articles:Article[];initialCategory?:string}){
 const [category,setCategory]=useState(initialCategory),[query,setQuery]=useState('');
 const categories=['All',...new Set(articles.map(a=>a.category))];
 const matches=useMemo(()=>articles.filter(a=>(category==='All'||a.category===category)&&[a.title,a.summary,a.category,...(a.tags||[])].join(' ').toLowerCase().includes(query.trim().toLowerCase())),[articles,category,query]);
 return <section className="v22-root v22-section"><div className="v22-container">
  <div className="v22-heading"><div><span className="v22-eyebrow">THE LANDSHOP JOURNAL</span><h2>Explore insights that matter.</h2></div><label className="v22-search-label">Search insights<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search property, mortgage, lifestyle…" maxLength={100}/></label></div>
  <div className="v22-category-tabs" role="group" aria-label="Filter articles by category">{categories.map(c=><button type="button" key={c} aria-pressed={category===c} onClick={()=>setCategory(c)} className={category===c?'active':''}>{c}</button>)}</div>
  <p aria-live="polite" className="v22-count">{matches.length} article{matches.length===1?'':'s'} found</p>
  <div className="v22-insights-grid">{matches.map(a=><article className="v22-insight-card" key={a.slug}><Link href={'/insights/'+a.slug} className="v22-insight-cover"><img src={a.image} alt={a.imageAlt||'Real documentary image illustrating '+a.title} loading="lazy"/></Link><div className="v22-insight-content"><small>{a.category} · {a.readingMinutes} MIN READ</small><h3><Link href={'/insights/'+a.slug}>{a.title}</Link></h3><p>{a.summary}</p><Link className="v22-text-link" href={'/insights/'+a.slug}>Read article →</Link></div></article>)}</div>
  {!matches.length&&<div className="v22-action-panel"><h3>No matching articles</h3><p>Try a different category or remove the search text.</p><button type="button" className="v22-btn" onClick={()=>{setQuery('');setCategory('All')}}>Clear filters</button></div>}
  </div></section>;
}
