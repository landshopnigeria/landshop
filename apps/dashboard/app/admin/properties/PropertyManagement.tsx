'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';

type Property={id:string;title:string;property_type:string;status:string;amount_kobo:number|null;created_by:string|null};
function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Landshop database not configured');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
}
export default function PropertyManagement({initial,currentUserId,canApprove}:{initial:Property[];currentUserId:string;canApprove:boolean}){
 const [items,setItems]=useState(initial),[title,setTitle]=useState(''),[type,setType]=useState('land'),[price,setPrice]=useState('');
 const [selection,setSelection]=useState(''),[nextStatus,setNextStatus]=useState('review'),[reason,setReason]=useState('');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const field={padding:13,border:'1px solid #cce0d5',borderRadius:12,maxWidth:'100%',background:'#fff'};
 async function create(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setMessage('');setBusy(true);
  try{
   const amount=price.trim()?Number(price):null;
   if(amount!==null&&(!Number.isSafeInteger(amount)||amount<0||amount>90000000000000))throw Error('Enter a valid price in NGN.');
   const value=amount===null?null:amount*100;
   if(value!==null&&!Number.isSafeInteger(value))throw Error('Price exceeds safe precision.');
   const {data,error}=await db().rpc('landshop_property_create',{p_title:title,p_type:type,p_amount_kobo:value,p_estate:null});
   if(error)throw Error('Could not create draft. Check staff permissions and inputs.');
   setItems(previous=>[{id:String(data),title,property_type:type,status:'draft',amount_kobo:value,created_by:currentUserId},...previous]);
   setTitle('');setPrice('');setMessage('Draft created. A separate reviewer must authorize publication.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to create property')}finally{setBusy(false)}
 }
 async function transition(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  try{
   const {error}=await db().rpc('landshop_property_transition',{p_id:selection,p_status:nextStatus,p_reason:reason.trim()});
   if(error)throw Error('Transition rejected. Check workflow stage, second-reviewer rule, and your permissions.');
   setItems(prev=>prev.map(x=>x.id===selection?{...x,status:nextStatus}:x));
   setReason('');setMessage('Decision saved with audit history.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to process decision')}finally{setBusy(false)}
 }
 return <div style={{display:'grid',gap:28}}>
  <section style={{padding:26,background:'white',borderRadius:20,border:'1px solid #dbe8df'}}>
   <h2>Create a draft property</h2><form onSubmit={create} style={{display:'flex',flexWrap:'wrap',gap:12}}>
    <input style={{...field,flex:'1 1 250px'}} value={title} onChange={e=>setTitle(e.target.value)} minLength={5} maxLength={180} required placeholder="Property title" aria-label="Property title"/>
    <select style={field} value={type} onChange={e=>setType(e.target.value)} aria-label="Property type">
     {['land','house','apartment','commercial','shortlet'].map(x=><option value={x} key={x}>{x}</option>)}
    </select>
    <input style={field} type="number" min={0} step={1} value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price (₦)" aria-label="Price in naira"/>
    <button disabled={busy} style={{padding:'13px 24px',background:'#087f62',color:'white',border:0,borderRadius:12}}>Create Draft</button>
   </form>
  </section>
  {canApprove&&<section style={{padding:26,background:'white',borderRadius:20,border:'1px solid #dbe8df'}}>
   <h2>Publication approval</h2>
   <form onSubmit={transition} style={{display:'grid',gap:12,maxWidth:700}}>
    <label>Property to review <select style={field} required value={selection} onChange={e=>setSelection(e.target.value)}>
     <option value="">Select property</option>{items.map(x=><option value={x.id} key={x.id}>{x.title} — {x.status}</option>)}
    </select></label>
    <label>Action <select style={field} value={nextStatus} onChange={e=>setNextStatus(e.target.value)}>
     <option value="review">Send draft to review</option><option value="published">Publish reviewed property</option><option value="archived">Archive published property</option>
    </select></label>
    <label>Reason and evidence <textarea minLength={15} maxLength={1000} required style={{...field,width:'100%',minHeight:95}} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Describe the checks and approval basis"/></label>
    <button disabled={busy||!selection||reason.trim().length<15} style={{background:'#087f62',color:'white',border:0,borderRadius:12,padding:14}}>Record Decision</button>
   </form>
  </section>}
  <section style={{padding:26,background:'white',borderRadius:20,border:'1px solid #dbe8df'}}>
   <h2>Property inventory <small>({items.length})</small></h2>
   {!items.length?<p>No verified inventory available.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}>
    <thead><tr>{['Property','Type','Status','Price','Created by'].map(x=><th key={x} style={{textAlign:'left',padding:12,borderBottom:'1px solid #ddd'}}>{x}</th>)}</tr></thead>
    <tbody>{items.map(p=><tr key={p.id}>
     <td style={{padding:12,borderBottom:'1px solid #eee'}}>{p.title}</td><td style={{padding:12}}>{p.property_type}</td>
     <td style={{padding:12}}>{p.status}</td>
     <td style={{padding:12}}>{p.amount_kobo===null?'Price on request':(p.amount_kobo/100).toLocaleString('en-NG',{style:'currency',currency:'NGN'})}</td>
     <td style={{padding:12}}>{p.created_by===currentUserId?'You':'Landshop staff'}</td>
    </tr>)}</tbody></table></div>}
   <p style={{fontSize:13}}>Images, title and ownership documents must be verified before any property is made publicly visible.</p>
  </section>
  <p role="status" aria-live="polite">{message}</p>
 </div>;
}
