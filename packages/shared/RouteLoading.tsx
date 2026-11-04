export default function RouteLoading(){
 return <section role="status" aria-live="polite" aria-busy="true" style={{padding:'clamp(24px,5vw,64px)',width:'100%',maxWidth:1200,margin:'0 auto',boxSizing:'border-box',color:'#006b55'}}>
  <p style={{fontSize:18,fontWeight:600}}>Opening page…</p>
  <p>Your page and available actions are loading.</p>
  <div aria-hidden="true" style={{display:'grid',gap:16,marginTop:24}}>{[85,65,75].map(width=><div key={width} style={{height:24,width:width+'%',borderRadius:8,background:'#e6f2ee'}}/>)}</div>
 </section>;
}
