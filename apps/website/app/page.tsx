'use client';
import {useEffect,useState} from 'react';
const products=[
 {name:'Develop',title:'Own Your Tomorrow',copy:'Property acquisition — Prime and Luxury opportunities.',url:'/develop'},
 {name:'Incubate',title:'Build Wealth With Property',copy:'Explore vetted property investment opportunities.',url:'/incubate'},
 {name:'Grow',title:'Move Into Ownership',copy:'Beta Mortgage and Mortgage Xtra financing pathways.',url:'/grow'}
];
const portal='https://portal.landshopnigeria.com';
export default function Home(){
 const [slide,setSlide]=useState(0);
 useEffect(()=>{let timer=setInterval(()=>setSlide(v=>(v+1)%3),6500);return()=>clearInterval(timer)},[]);
 return <main style={{fontFamily:'Arial,sans-serif',margin:0,color:'#123d32'}}>
  <div style={{background:'#eef8f2',padding:'9px 6%',textAlign:'right'}}><a href={portal}>Account</a> &nbsp; <a href={portal+'/signup?role=realtor'}>Become a Realtor</a></div>
  <header style={{position:'sticky',top:0,background:'#ffffffda',backdropFilter:'blur(16px)',borderBottom:'1px solid #d6e6de',padding:'20px 6%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:20}}>
   <strong style={{fontSize:28,color:'#078f71'}}>Landshop</strong><nav style={{display:'flex',flexWrap:'wrap',gap:13,fontSize:13}}>{['Home','Product','Company','Services','Properties','Insights / Blog','Contact Us'].map(x=><a key={x} href={'/'+x.toLowerCase().replaceAll(' ','-')}>{x}</a>)}</nav><a href={portal} style={{background:'#078f71',color:'white',padding:13,borderRadius:13}}>Get Started</a></header>
  <section style={{minHeight:520,background:'linear-gradient(120deg,#043d34,#096b62)',color:'white',padding:'10% 6%'}}>
  <small>{String(slide+1).padStart(2,'0')} / 03 — {products[slide].name.toUpperCase()}</small>
  <h1 style={{fontSize:'clamp(42px,6vw,80px)',maxWidth:800}}>{products[slide].title}</h1><p>{products[slide].copy}</p>
  <div style={{display:'flex',gap:12,marginTop:25}}><a href={portal} style={{padding:14,borderRadius:10,background:'#078f71',color:'white'}}>Get Started</a><a href={products[slide].url} style={{padding:14,border:'1px solid white',borderRadius:10,color:'white'}}>Explore {products[slide].name}</a></div>
  <div style={{marginTop:25}}>{products.map((p,i)=><button key={i} aria-label={'Show '+p.name} onClick={()=>setSlide(i)} style={{marginRight:9,background:i===slide?'#f59b35':'#ceddd6',padding:9,border:0,borderRadius:9}}/>)}</div>
  </section><section style={{padding:'60px 6%'}}><h2>Develop · Incubate · Grow</h2><p>Everyone Deserves Affordable Property.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:22}}>{products.map(p=><article key={p.name} style={{padding:25,border:'1px solid #d7e7de',borderRadius:20}}><h3>{p.name}</h3><p>{p.copy}</p><a href={p.url}>Learn More ↗</a></article>)}</div></section>
  <footer style={{padding:'55px 6%',background:'#063d35',color:'white'}}><h2>Landshop</h2><p>Develop · Incubate · Grow</p><a style={{color:'white'}} href="mailto:care@landshopnigeria.com">care@landshopnigeria.com</a></footer>
 </main>
}
