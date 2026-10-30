'use client';
import BrandedSelect from '../../../../components/BrandedSelect';

import {useState,type FormEvent} from 'react';
import {createBrowserClient} from '@supabase/ssr';
type Estate={id:string;name:string;state:string|null;city:string|null;status:string};
type RecordData={id:string;title:string;property_type:string;status:string;estate_id:string|null;amount_kobo:number|null;sale_mode:string|null;bedrooms:number|null;bathrooms:number|null;land_area_sqm:number|null;floor_area_sqm:number|null;source_url:string|null;source_price_note:string|null;price_last_confirmed_at:string|null;price_is_starting_at:boolean};
function client(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!u||!k)throw Error('Database unavailable');return createBrowserClient(u,k,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',secure:true,sameSite:'lax'}})}
const style={border:'1px solid #cfe0d4',borderRadius:10,padding:'12px 13px',background:'#fff',minWidth:0,width:'100%',color:'#174432',fontSize:14};
export default function DraftBasicsEditor({property,estates,canApprove}:{property:RecordData;estates:Estate[];canApprove:boolean}){
 const [f,setF]=useState({title:property.title,type:property.property_type,estate:property.estate_id||'',price:property.amount_kobo==null?'':String(property.amount_kobo/100),mode:property.sale_mode||'Buy',
 bedrooms:property.bedrooms==null?'':String(property.bedrooms),bathrooms:property.bathrooms==null?'':String(property.bathrooms),
 land:property.land_area_sqm==null?'':String(property.land_area_sqm),floor:property.floor_area_sqm==null?'':String(property.floor_area_sqm)});
 const [isStarting,setIsStarting]=useState(Boolean(property.price_is_starting_at));
 const [note,setNote]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[confirmed,setConfirmed]=useState(Boolean(property.price_last_confirmed_at));
 const change=(key:keyof typeof f,value:string)=>setF(x=>({...x,[key]:value}));
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  try{
   const num=(v:string,positive=false)=>{if(!v.trim())return null;const n=Number(v);if(!Number.isFinite(n)||(positive&&n<=0))throw Error('Invalid number');return n};
   const price=num(f.price,true),kobo=price==null?null:Math.round(price*100);
   if(price!=null&&(!Number.isSafeInteger(kobo)||price>900000000000))throw Error('Price is out of range');
   if(!f.estate)throw Error('Select the true estate first');
   const {error}=await client().rpc('landshop_property_update_draft',{p_id:property.id,p_title:f.title,p_type:f.type,
    p_estate:f.estate,p_amount_kobo:kobo,p_sale_mode:f.mode,p_bedrooms:num(f.bedrooms),p_bathrooms:num(f.bathrooms),
    p_land_sqm:num(f.land,true),p_floor_sqm:num(f.floor,true)});
   if(error)throw Error(error.message||'Draft update failed');
   const {error:startingError}=await client().rpc('landshop_property_mark_starting_price',{p_property:property.id,p_is_starting:isStarting});
   if(startingError)throw Error('Draft updated but price classification needs review: '+startingError.message);
   setConfirmed(false);setMessage('Draft details saved. Current price must be independently reconfirmed before publication.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to update draft')}finally{setBusy(false)}
 }
 async function confirm(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  try{if(note.trim().length<20)throw Error('Record the current price source and date');
   const {error}=await client().rpc('landshop_property_confirm_price',{p_id:property.id,p_reason:note.trim()});
   if(error)throw Error(error.message||'Price approval failed');
   setConfirmed(true);setNote('');setMessage('Independent price confirmation and audit record saved. Current for 30 days, subject to actual availability.');
  }catch(e){setMessage(e instanceof Error?e.message:'Price could not be confirmed')}finally{setBusy(false)}
 }
 return <section style={{background:'white',padding:'clamp(20px,3vw,30px)',border:'1px solid #d8e9de',borderRadius:18,margin:'22px 0'}}>
  <small style={{color:'#de741f',fontWeight:800,letterSpacing:1}}>PROPERTY INVENTORY / SOURCE CONTROL</small><h2 style={{fontSize:25}}>Property identity, estate &amp; asking price</h2>
  <p style={{fontSize:13,color:'#68816f',lineHeight:1.7}}>The source-backed starting price is not a confirmed live offer. Confirm the unit, availability, exact location, price and genuine media with the owner/developer before approval.</p>
  {property.source_url&&<p style={{fontSize:13}}><a href={property.source_url} target="_blank" rel="noopener noreferrer" style={{color:'#0b8768'}}>View original Landshop advertised source ↗</a></p>}
  {property.source_price_note&&<p style={{fontSize:12,color:'#956112',padding:12,background:'#fff6e9',borderRadius:10}}>{property.source_price_note}</p>}
  <form onSubmit={save} style={{display:'grid',gap:14}}>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:13}}>
   <label>Property title<input style={style} minLength={5} maxLength={180} required value={f.title} onChange={e=>change('title',e.target.value)}/></label>
   <label>Property type<BrandedSelect style={style} value={f.type} onChange={e=>change('type',e.target.value)}>{['land','house','apartment','commercial','shortlet'].map(t=><option key={t}>{t}</option>)}</BrandedSelect></label>
   <label>Estate and state<BrandedSelect style={style} required value={f.estate} onChange={e=>change('estate',e.target.value)}><option value="">Choose estate</option>{estates.map(x=><option key={x.id} value={x.id}>{x.name} — {x.state} ({x.status})</option>)}</BrandedSelect></label>
   <label>Sale purpose<BrandedSelect style={style} value={f.mode} onChange={e=>change('mode',e.target.value)}>{['Buy','Rent','Shortlet'].map(t=><option key={t}>{t}</option>)}</BrandedSelect></label>
   <label>Current asking price (₦)<input style={style} required min={1} type="number" step="1" value={f.price} onChange={e=>change('price',e.target.value)}/></label>
   <label style={{display:'flex',alignItems:'center',gap:10,fontSize:13,fontWeight:750}}><input type="checkbox" checked={isStarting} onChange={e=>setIsStarting(e.target.checked)} style={{accentColor:'#2ba47a',width:20,height:20}}/> This is a “From” starting price</label>
   <label>Bedrooms<input style={style} min={0} max={100} type="number" value={f.bedrooms} onChange={e=>change('bedrooms',e.target.value)}/></label>
   <label>Bathrooms<input style={style} min={0} max={100} type="number" value={f.bathrooms} onChange={e=>change('bathrooms',e.target.value)}/></label>
   <label>Land size (m²)<input style={style} min={0} step=".01" type="number" value={f.land} onChange={e=>change('land',e.target.value)}/></label>
   <label>Floor area (m²)<input style={style} min={0} step=".01" type="number" value={f.floor} onChange={e=>change('floor',e.target.value)}/></label>
   </div>
   <button disabled={busy||property.status!=='draft'} style={{justifySelf:'start',padding:'13px 20px',color:'white',background:'#2ba47a',border:0,borderRadius:11,fontWeight:800}}>{busy?'Saving…':'Save verified draft details'}</button>
   {property.status!=='draft'&&<small>Properties under review/published cannot be edited here; use a new authorization cycle to change pricing.</small>}
  </form>
  {canApprove&&property.status!=='published'&&<form onSubmit={confirm} style={{marginTop:24,paddingTop:21,borderTop:'1px solid #e3eee6',display:'grid',gap:11}}>
   <strong>Independent current-price confirmation</strong><p style={{fontSize:12,color:'#6c846f'}}>A second authorized reviewer must independently confirm the latest price. Confirmation expires after 30 days.</p>
   <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} minLength={20} maxLength={1000} placeholder="Source and date: Landshop owner/developer-approved price schedule, contact person and unit availability" style={{...style,resize:'vertical'}}/>
   <button disabled={busy||note.trim().length<20} style={{justifySelf:'start',padding:'12px 20px',border:0,background:'#f26b10',borderRadius:10,color:'white',fontWeight:800}}>Confirm current price</button>
  </form>}
  <p style={{fontSize:12,color:confirmed?'#0b8264':'#c57012',fontWeight:800}}>{confirmed?'Price confirmation recorded (check date for freshness)':'Current source price awaits independent confirmation'}</p>
  {message&&<p role="status" style={{color:'#0b7655',fontSize:13}}>{message}</p>}
 </section>;
}
