'use client';
import {useMemo,useState} from 'react';
import type {Product,FAQ} from '../lib/landshop-faq';
import {productFAQs} from '../lib/landshop-faq';
const stop=new Set(['the','to','of','and','a','an','i','for','is','in','on','my','do','what','how','can','are','it','with','landshop','about','your']);
const tokens=(input:string)=>new Set(input.toLowerCase().replace(/[^a-z0-9% ]/g,' ').split(/\s+/).map(x=>x.trim()).filter(x=>x.length>1&&!stop.has(x)));
function match(question:string,options:FAQ[]):FAQ|null{
 const keys=tokens(question);if(keys.size===0)return null;
 const scored=options.map(item=>{
  const terms=tokens(item.question+' '+(item.keywords||[]).join(' '));let overlap=0;
  for(const k of keys)if(terms.has(k))overlap+=1;
  return {item,score:overlap};
 }).sort((a,b)=>b.score-a.score);
 return scored[0]?.score>0?scored[0].item:null;
}
export default function FAQAssistant({product}:{product:Product}){
 const [question,setQuestion]=useState(''),[answer,setAnswer]=useState<FAQ|null|undefined>(undefined);
 const options=useMemo(()=>productFAQs[product], [product]);
 return <div style={{maxWidth:1240,margin:'0 auto',padding:'48px clamp(20px,5vw,70px)'}}>
  <span style={{fontSize:11,color:'#078a65',fontWeight:800,letterSpacing:2}}>PRODUCT KNOWLEDGE CENTER</span>
  <h2 style={{fontSize:'clamp(28px,3vw,39px)',marginBottom:8}}>Questions & Answers</h2>
  <p style={{maxWidth:760,lineHeight:1.6,color:'#577466'}}>Ask a product question or browse frequently asked questions. Responses come from a reviewed reference knowledge base, not an automatic financial approval.</p>
  <form onSubmit={e=>{e.preventDefault();setAnswer(match(question,options))}} style={{display:'flex',flexWrap:'wrap',gap:10,margin:'22px 0'}}>
   <input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="e.g., Can I pay in instalments?" aria-label="Ask a question about this product" required maxLength={240}
    style={{flex:'1 1 260px',padding:'15px 16px',border:'1px solid #b9d8cb',borderRadius:12,fontSize:15}}/>
   <button type="submit" style={{border:0,borderRadius:12,background:'#067e63',color:'#fff',padding:'15px 23px',fontWeight:800}}>Find an Answer →</button>
  </form>
  {answer!==undefined&&<section aria-live="polite" role="status" style={{background:'#e8f7ef',padding:20,border:'1px solid #b8e1cd',borderRadius:14,marginBottom:24}}>
   {answer?<><strong>{answer.question}</strong><p style={{lineHeight:1.7,marginBottom:0}}>{answer.answer}</p></>:
   <p style={{margin:0}}>We could not match that question to an approved answer. Please <a href="mailto:care@landshopnigeria.com">contact Landshop support</a> for a product-specific response.</p>}
  </section>}
  <div style={{display:'grid',gap:10}}>
   {options.map((item,i)=><details key={item.question} style={{border:'1px solid #deebe3',borderRadius:12,background:'#fff',padding:'15px 18px'}}>
    <summary style={{fontSize:15,cursor:'pointer',fontWeight:700,color:'#123e32'}}>{String(i+1).padStart(2,'0')} · {item.question}</summary>
    <p style={{lineHeight:1.75,color:'#446559',margin:'15px 0 0'}}>{item.answer}</p>
   </details>)}
  </div>
  <p style={{fontSize:12,lineHeight:1.5,color:'#5b6c65',marginTop:20}}>Financial terms, rates, investment returns, refund policies and estate conditions must be verified against the latest signed product documentation.</p>
 </div>;
}
