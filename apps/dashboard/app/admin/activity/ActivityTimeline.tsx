'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
export type Activity={id:string;category:string;title:string;status:string;time:string;href:string};
export default function ActivityTimeline({activities,categories}:{activities:Activity[];categories:readonly string[]}){
 const [category,setCategory]=useState('all'),[query,setQuery]=useState('');
 const [limit,setLimit]=useState(60);
 const options=useMemo(()=>['all',...new Set(categories)], [categories]);
 const filtered=useMemo(()=>activities.filter(row=>
  (category==='all'||row.category===category) &&
  (!query||((row.title+' '+row.category+' '+row.status).toLowerCase().includes(query.toLowerCase())))),
 [activities,category,query]);
 return <section style={{borderRadius:19,background:'#fff',border:'1px solid #dce9e1',marginTop:24,overflow:'hidden'}}>
  <div style={{padding:22,display:'flex',flexWrap:'wrap',gap:13,alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #e3eee6'}}>
   <div><h2 style={{margin:0,fontSize:22}}>Operational Event Timeline</h2><p style={{fontSize:12,color:'#7a9082',margin:'6px 0 0'}}>Management-visible records, sorted by server timestamp</p></div>
   <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
    <input aria-label="Search activity" placeholder="Search events…" value={query} onChange={e=>{setQuery(e.target.value);setLimit(60)}} style={{padding:'10px 12px',border:'1px solid #d5e7dc',borderRadius:9,fontSize:12,minWidth:175}}/>
    <select aria-label="Filter activity type" value={category} onChange={e=>{setCategory(e.target.value);setLimit(60)}} style={{padding:'10px 12px',border:'1px solid #d5e7dc',borderRadius:9,background:'#fff',fontSize:12}}>
     {options.map(x=><option key={x} value={x}>{x==='all'?'All systems':x}</option>)}
    </select>
   </div>
  </div>
  {!filtered.length?<div style={{padding:27,color:'#718879',fontSize:13}}>No matching activity records are currently visible to your authorized role.</div>:
  <div style={{overflowX:'auto'}}>
   <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
    <thead><tr>{['Time (WAT)','System','Event','Status','Management'].map(h=><th key={h} style={{padding:14,textAlign:'left',fontSize:11,letterSpacing:.7,color:'#648271',background:'#f7fbf8',borderBottom:'1px solid #e1ebe4'}}>{h}</th>)}</tr></thead>
    <tbody>{filtered.slice(0,limit).map(row=><tr key={row.id} style={{borderBottom:'1px solid #e7efe8'}}>
     <td style={{padding:'14px 12px',color:'#5c7769',fontSize:12,whiteSpace:'nowrap'}}>{new Date(row.time).toLocaleString('en-NG',{timeZone:'Africa/Lagos',dateStyle:'medium',timeStyle:'short'})}</td>
     <td style={{padding:12,fontSize:12,fontWeight:800,color:'#0c785f'}}>{row.category}</td>
     <td style={{padding:12,fontSize:12}}>{row.title}</td>
     <td style={{padding:12,textTransform:'capitalize',fontWeight:700,color:row.status==='failed'||row.status==='rejected'?'#b16e25':'#24775b',fontSize:12}}>{row.status}</td>
     <td style={{padding:12}}><Link href={row.href} style={{color:'#0b8166',fontSize:12,fontWeight:800}}>Open module →</Link></td>
    </tr>)}</tbody>
   </table>
   {limit<filtered.length&&<div style={{padding:20,textAlign:'center'}}><button type="button" onClick={()=>setLimit(n=>n+70)} style={{padding:'11px 18px',background:'#0b8568',color:'#fff',borderRadius:9,fontWeight:800,border:0}}>Show more ({filtered.length-limit} remaining)</button></div>}
  </div>}
 </section>;
}
