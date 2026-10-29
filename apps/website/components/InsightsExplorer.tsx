
'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {guides,insightCategories} from '../lib/editorial';
export default function InsightsExplorer(){
 const [category,setCategory]=useState<string>('All');
 const [keyword,setKeyword]=useState('');
 const shown=useMemo(()=>guides.filter(g=>(category==='All'||g.category===category)&&[g.title,g.description,g.category,...g.tags].join(' ').toLowerCase().includes(keyword.trim().toLowerCase())),[category,keyword]);
 return <section className="v16-explorer">
  <div className="v16-explorer-tools"><div className="v16-category-row" aria-label="Filter insights">{insightCategories.map(c=><button type="button" key={c} className={category===c?'v16-pill-active':''} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><label className="v16-insights-search"><span className="v16-sr">Search guides</span><input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Search helpful guides…" type="search" maxLength={80}/></label></div>
  <div className="v16-insights-cards">{shown.length?shown.map(guide=><article key={guide.slug} className="v16-insight-card"><Link href={'/insights/'+guide.slug} aria-label={'Read '+guide.title}><div className="v16-article-image"><img src={guide.image} alt={'Illustrative property context for '+guide.title} loading="lazy"/><span>{guide.category}</span></div></Link><div className="v16-article-body"><span className="v16-overline">LANDSHOP INSIGHTS · {guide.product.toUpperCase()}</span><h2><Link href={'/insights/'+guide.slug}>{guide.title}</Link></h2><p>{guide.description}</p><Link href={'/insights/'+guide.slug} className="v16-read-link">Read article <span aria-hidden="true">↗</span></Link></div></article>):<div className="v16-no-results"><h2>No matching guides</h2><p>Try another topic or reset the filters.</p><button type="button" onClick={()=>{setKeyword('');setCategory('All')}}>Reset filters</button></div>}</div>
 </section>;
}
