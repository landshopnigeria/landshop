'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
type Batch={id:string;source_filename:string;status:string;created_by:string;approved_by:string|null;created_at:string};
function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Database not configured');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'}});
}
export default function ImportReview({initial,currentUser}:{initial:Batch[];currentUser:string}){
 const [items,setItems]=useState(initial),[selected,setSelected]=useState('');
 const [records,setRecords]=useState<{row_number:number;normalized:Record<string,string>;errors:string[]}[]>([]);
 const [reason,setReason]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const batch=items.find(x=>x.id===selected);
 async function inspect(id:string){
  setSelected(id);setRecords([]);setMessage('');
  const {data,error}=await db().from('property_import_rows').select('row_number,normalized,errors')
   .eq('batch_id',id).order('row_number',{ascending:true}).limit(100);
  if(error){setMessage('Unable to inspect staged rows.');return}
  setRecords((data||[]) as typeof records);
 }
 async function approve(ok:boolean){
  setBusy(true);setMessage('');
  try{
   if(!batch||batch.created_by===currentUser)throw Error('The submitting employee cannot approve their batch');
   const {error}=await db().rpc('landshop_import_approve',{p_batch:batch.id,p_approve:ok,p_reason:reason.trim()});
   if(error)throw Error('Approval rejected. Check duplicate and validation errors or reviewer permissions.');
   setItems(rows=>rows.map(x=>x.id===selected?{...x,status:ok?'approved':'rejected',approved_by:currentUser}:x));
   setMessage('Decision saved with audit history.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to approve')}
  finally{setBusy(false)}
 }
 async function promote(){
  setBusy(true);setMessage('');
  try{
   if(!batch||batch.approved_by===currentUser)throw Error('A second operator must promote this approved batch.');
   const {data,error}=await db().rpc('landshop_import_promote',{p_batch:batch.id});
   if(error)throw Error('Import promotion failed. Inspect duplicates or permissions.');
   setItems(rows=>rows.map(x=>x.id===selected?{...x,status:'imported'}:x));
   setMessage(String(data)+' draft properties created. None were published.');
  }catch(e){setMessage(e instanceof Error?e.message:'Promotion failed')}
  finally{setBusy(false)}
 }
 return <div style={{display:'grid',gap:24}}>
  <section style={{background:'white',border:'1px solid #daebe0',padding:24,borderRadius:20}}>
   <h2>Staged import batches</h2>
   <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
    {items.map(x=><button key={x.id} onClick={()=>inspect(x.id)}
     style={{padding:12,border:selected===x.id?'2px solid #078a6d':'1px solid #bed6c8',borderRadius:12,background:'white'}}>
     {x.source_filename} · {x.status}</button>)}
   </div>
  </section>
  {batch&&<section style={{background:'white',borderRadius:20,padding:25}}>
   <h2>{batch.source_filename} — {batch.status}</h2>
   <p>Staged by {batch.created_by===currentUser?'you':'another Landshop employee'}.</p>
   <div style={{overflowX:'auto',maxHeight:390}}>
    <table style={{width:'100%',borderCollapse:'collapse'}}>
     <thead><tr>{['Row','Title','Type','Price','Errors'].map(x=><th key={x} style={{padding:12,textAlign:'left'}}>{x}</th>)}</tr></thead>
     <tbody>{records.map(r=><tr key={r.row_number}>
      <td style={{padding:12}}>{r.row_number}</td><td style={{padding:12}}>{r.normalized.title}</td>
      <td style={{padding:12}}>{r.normalized.property_type}</td><td style={{padding:12}}>{r.normalized.price}</td>
      <td style={{padding:12,color:r.errors.length?'#a2491b':'#087e66'}}>{r.errors.length?r.errors.join(', '):'Clear'}</td>
     </tr>)}</tbody>
    </table>
   </div>
   {batch.status==='validated'&&<div style={{display:'grid',gap:10}}>
    <label>Independent review reason<textarea rows={3} maxLength={1000} minLength={15} required
     value={reason} onChange={e=>setReason(e.target.value)} style={{width:'100%',padding:12}}/></label>
    <div style={{display:'flex',gap:10}}>
     <button disabled={busy||reason.trim().length<15||batch.created_by===currentUser} onClick={()=>approve(true)}>Approve Validated Import</button>
     <button disabled={busy||reason.trim().length<15||batch.created_by===currentUser} onClick={()=>approve(false)}>Reject Import</button>
    </div>
   </div>}
   {batch.status==='approved'&&<button disabled={busy||batch.approved_by===currentUser} onClick={promote}>
    Promote Approved Rows to Draft Properties</button>}
   <p role="status" aria-live="polite">{message}</p>
  </section>}
 </div>;
}
