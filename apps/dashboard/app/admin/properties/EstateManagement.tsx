'use client';
import BrandedSelect from '../../../components/BrandedSelect';

import {useState,type FormEvent} from 'react';
import {createBrowserClient} from '@supabase/ssr';
type Estate={id:string;name:string;state:string|null;city:string|null;lga:string|null;area:string|null;status:string;source_note?:string|null;created_by?:string|null};
const states=['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Federal Capital Territory','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
function client(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw Error('Database unavailable');return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}})}
export default function EstateManagement({initial,canApprove}:{initial:Estate[];canApprove:boolean}){
 const [estates,setEstates]=useState(initial),[name,setName]=useState(''),[state,setState]=useState('Lagos'),[city,setCity]=useState(''),[lga,setLga]=useState(''),[area,setArea]=useState('');
 const [selected,setSelected]=useState(''),[status,setStatus]=useState('review'),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const field={width:'100%',padding:13,border:'1px solid #cee3d6',borderRadius:11,background:'#fff',fontSize:14};
 async function add(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setMessage('');
  try{
   const {data,error}=await client().rpc('landshop_estate_create',{p_name:name.trim(),p_state:state,p_city:city.trim(),p_lga:lga.trim(),p_area:area.trim()});
   if(error||!data)throw Error(error?.message||'Could not create estate');
   setEstates(x=>[...x,{id:String(data),name:name.trim(),state,city:city.trim(),lga:lga.trim(),area:area.trim(),status:'draft'}]);
   setName('');setCity('');setLga('');setArea('');setMessage('Estate added as a draft. Publication requires an independent review and actual location verification.');
  }catch(e){setMessage(e instanceof Error?e.message:'Creation failed')}finally{setBusy(false)}
 }
 async function transition(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setMessage('');
  try{
   const {error}=await client().rpc('landshop_estate_transition',{p_id:selected,p_status:status,p_reason:reason.trim()});
   if(error)throw Error(error.message);
   setEstates(v=>v.map(x=>x.id===selected?{...x,status}:x));
   setReason('');setMessage('Estate review decision saved. The estate is now '+status+'.');
  }catch(e){setMessage(e instanceof Error?e.message:'Review failed')}finally{setBusy(false)}
 }
 return <section style={{background:'#fff',border:'1px solid #d5e9db',borderRadius:18,padding:'clamp(20px,3vw,30px)',display:'grid',gap:17}}>
  <div><small style={{color:'#d76813',fontWeight:850,letterSpacing:1}}>LANDSHOP VERIFIED INVENTORY</small><h2 style={{margin:'10px 0'}}>Estate & Location Registry</h2><p style={{color:'#647c6b',fontSize:13,lineHeight:1.7}}>Draft names and source-backed prices are not public listings. Add estate details, review Nigerian geography and approve the estate before property publication.</p></div>
  <div style={{display:'grid',gap:10,maxHeight:300,overflowY:'auto'}}>{estates.map(e=><div key={e.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:13,flexWrap:'wrap',padding:12,background:'#f2faf5',borderRadius:11}}>
   <div><strong style={{fontSize:14}}>{e.name}</strong><small style={{display:'block',fontSize:12,color:'#688175',marginTop:5}}>{[e.city,e.state,e.area].filter(Boolean).join(' · ')}</small></div>
   <span style={{color:e.status==='published'?'#078665':'#d97517',fontSize:12,fontWeight:800}}>{e.status.toUpperCase()}</span>
  </div>)}{!estates.length&&<p>No estate records yet.</p>}</div>
  <form onSubmit={add} style={{display:'grid',gap:12,borderTop:'1px solid #e1eee5',paddingTop:20}}>
   <h3 style={{margin:0}}>Add an estate draft</h3>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
    <label>Estate name<input required minLength={4} maxLength={180} value={name} onChange={e=>setName(e.target.value)} style={field}/></label>
    <label>Nigerian state / FCT<BrandedSelect value={state} onChange={e=>setState(e.target.value)} style={field}>{states.map(s=><option key={s}>{s}</option>)}</BrandedSelect></label>
    <label>City / Town<input required value={city} maxLength={100} onChange={e=>setCity(e.target.value)} style={field}/></label>
    <label>LGA<input value={lga} maxLength={100} onChange={e=>setLga(e.target.value)} style={field}/></label>
    <label>Area / District<input value={area} maxLength={120} onChange={e=>setArea(e.target.value)} style={field}/></label>
   </div><button disabled={busy} style={{justifySelf:'start',padding:'12px 20px',background:'#2ba47a',border:0,color:'#fff',borderRadius:10,fontWeight:800}}>Create draft estate</button>
  </form>
  {canApprove&&<form onSubmit={transition} style={{display:'grid',gap:12,borderTop:'1px solid #e1eee5',paddingTop:20}}>
   <h3 style={{margin:0}}>Independent estate review</h3>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
    <label>Estate<BrandedSelect required value={selected} style={field} onChange={e=>setSelected(e.target.value)}><option value="">Choose estate</option>{estates.map(e=><option value={e.id} key={e.id}>{e.name} — {e.state} ({e.status})</option>)}</BrandedSelect></label>
    <label>Decision<BrandedSelect style={field} value={status} onChange={e=>setStatus(e.target.value)}><option value="review">Send draft to review</option><option value="published">Approve estate location</option><option value="archived">Archive published estate</option></BrandedSelect></label>
   </div>
   <label>Documented reason<textarea required minLength={20} maxLength={1000} rows={3} style={{...field,resize:'vertical'}} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Confirm estate identity, correct state/city, and authority to market this development"/></label>
   <button disabled={busy||!selected||reason.trim().length<20} style={{justifySelf:'start',padding:'12px 19px',border:0,borderRadius:10,color:'white',background:'#f26b10',fontWeight:800}}>Record estate review</button>
  </form>}
  {message&&<p role="status" style={{fontSize:13,color:'#0b755b',padding:12,background:'#e9f8f0',borderRadius:10}}>{message}</p>}
 </section>;
}
