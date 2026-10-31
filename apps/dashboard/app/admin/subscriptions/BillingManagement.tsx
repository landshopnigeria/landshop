'use client';
import {useState,type FormEvent} from 'react';
import {createBrowserClient} from '@supabase/ssr';
type Plan={id:string;code:string;name:string;description:string;amount_kobo:number;duration_days:number;is_active:boolean};
type Sub={id:string;user_id:string;plan_id:string;status:string;expires_at:string;updated_at:string};
type Payment={id:string;user_id:string;plan_id:string;reference:string;status:string;amount_kobo:number;provider_domain:string|null;paid_at:string|null;created_at:string};
function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Finance client configuration missing');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',path:'/',secure:true}});
}
const card:React.CSSProperties={background:'#fff',border:'1px solid #dbe9df',borderRadius:17,padding:'clamp(16px,2vw,23px)',minWidth:0};
const field:React.CSSProperties={padding:12,borderRadius:10,border:'1px solid #d3e4d8',fontSize:13,width:'100%',background:'#fff',color:'#1c503b'};
const button:React.CSSProperties={background:'#098362',color:'#fff',border:0,borderRadius:9,padding:'11px 15px',fontWeight:800,cursor:'pointer'};
const money=(kobo:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(kobo/100);
export default function BillingManagement({owner,plans,subscriptions,transactions}:{owner:boolean;plans:Plan[];subscriptions:Sub[];transactions:Payment[]}){
 const [rows,setRows]=useState(plans),[subs,setSubs]=useState(subscriptions),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [edit,setEdit]=useState<string|null>(null),[code,setCode]=useState(''),[name,setName]=useState(''),[description,setDescription]=useState(''),[amount,setAmount]=useState(''),[days,setDays]=useState('30'),[active,setActive]=useState(false);
 const [target,setTarget]=useState<string|null>(null),[action,setAction]=useState('suspend'),[reason,setReason]=useState('');
 function editPlan(plan?:Plan){
  setEdit(plan?.id||'new');setCode(plan?.code||'');setName(plan?.name||'');setDescription(plan?.description||'');
  setAmount(plan?String(plan.amount_kobo/100):'');setDays(String(plan?.duration_days||30));setActive(plan?.is_active||false);setMessage('');
 }
 async function save(e:FormEvent){
  e.preventDefault();setBusy(true);setMessage('');
  try{
   const naira=Number(amount),amountKobo=Math.round(naira*100);
   if(!Number.isSafeInteger(amountKobo)||amountKobo<10000)throw Error('Enter a valid NGN price of at least ₦100.');
   const {data,error}=await db().rpc('landshop_plan_save',{
    p_id:edit==='new'?null:edit,p_code:code.trim().toLowerCase(),
    p_name:name.trim(),p_description:description.trim(),p_amount_kobo:amountKobo,
    p_duration_days:Number(days),p_active:active
   });
   if(error||!data)throw Error(error?.message||'Unable to save plan');
   const {data:latest,error:loadError}=await db().from('landshop_subscription_plans')
    .select('id,code,name,description,amount_kobo,duration_days,is_active').order('created_at',{ascending:false}).limit(100);
   if(loadError)throw Error(loadError.message);
   setRows(latest||[]);setEdit(null);setMessage('Plan saved with an auditable owner decision.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to save plan')}finally{setBusy(false)}
 }
 async function decide(){
  if(!target||reason.trim().length<15){setMessage('Choose a subscription and document the reason (15+ characters).');return}
  setBusy(true);setMessage('');
  try{
   const {error}=await db().rpc('landshop_subscription_decide',{p_subscription:target,p_action:action,p_reason:reason});
   if(error)throw Error(error.message);
   const {data, error:refreshError}=await db().from('landshop_customer_subscriptions').select('id,user_id,plan_id,status,expires_at,updated_at').order('updated_at',{ascending:false}).limit(200);
   if(refreshError)throw Error(refreshError.message);
   setSubs(data||[]);setTarget(null);setReason('');setMessage('Subscription action recorded in the secure audit log.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to change subscription.')}finally{setBusy(false)}
 }
 return <div style={{display:'grid',gap:22}}>
  {message&&<p role="status" style={{padding:14,background:'#e9f7ed',borderRadius:11,color:'#0b7056',fontWeight:700}}>{message}</p>}
  <section style={card}>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
    <h2 style={{fontSize:23,margin:0}}>Subscription Plans</h2>
    {owner&&<button style={button} onClick={()=>editPlan()}>+ Create Approved Plan</button>}
   </div>
   {!rows.length?<p style={{color:'#799081'}}>No plans configured. Do not collect payments until the owner approves a price and publishes the plan.</p>:
   <div style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:620,borderCollapse:'collapse',marginTop:15}}>
    <thead><tr>{['Plan','Price','Period','Availability','Governance'].map(h=><th key={h} style={{padding:12,textAlign:'left',fontSize:12,borderBottom:'1px solid #deebe1'}}>{h}</th>)}</tr></thead>
    <tbody>{rows.map(p=><tr key={p.id}>
     <td style={{padding:13}}><strong>{p.name}</strong><small style={{display:'block',color:'#7a9082'}}>{p.code}</small></td>
     <td style={{padding:13}}>{money(p.amount_kobo)}</td><td style={{padding:13}}>{p.duration_days} days</td>
     <td style={{padding:13,color:p.is_active?'#07825e':'#b2712a'}}>{p.is_active?'Published':'Draft'}</td>
     <td style={{padding:13}}>{owner?<button style={{...button,padding:'8px 12px'}} onClick={()=>editPlan(p)}>Edit plan</button>:'Owner-only approval'}</td>
    </tr>)}</tbody>
   </table></div>}
   {owner&&edit&&<form onSubmit={save} style={{display:'grid',gap:12,marginTop:20,padding:18,background:'#f3faf5',borderRadius:12}}>
    <h3 style={{margin:0}}>{edit==='new'?'Create plan':'Update plan'} · Owner approval</h3>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
     <label>Plan code<input required pattern="[a-z][a-z0-9_-]{2,50}" style={field} value={code} onChange={e=>setCode(e.target.value)}/></label>
     <label>Display name<input required minLength={4} style={field} value={name} onChange={e=>setName(e.target.value)}/></label>
     <label>Amount (₦)<input type="number" min="100" step="0.01" required style={field} value={amount} onChange={e=>setAmount(e.target.value)}/></label>
     <label>Access duration (days)<input type="number" min="1" max="1095" required style={field} value={days} onChange={e=>setDays(e.target.value)}/></label>
    </div>
    <label>Description<textarea style={{...field,minHeight:76}} value={description} onChange={e=>setDescription(e.target.value)} maxLength={3000}/></label>
    <label style={{fontWeight:700,fontSize:13}}><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/> Publish this plan for paying customers</label>
    <div style={{display:'flex',gap:10}}><button disabled={busy} style={button}>Save Owner Decision</button><button type="button" onClick={()=>setEdit(null)} style={{...button,background:'#6e8b7d'}}>Cancel</button></div>
   </form>}
  </section>
  <section style={card}><h2 style={{fontSize:23,margin:0}}>Customer Subscriptions</h2>
   {!subs.length?<p style={{color:'#7b9084'}}>No verified subscriptions recorded yet.</p>:
   <div style={{display:'grid',gap:10,marginTop:14}}>
    {subs.map(s=><article key={s.id} style={{padding:13,border:'1px solid #e0ece3',borderRadius:12,display:'flex',justifyContent:'space-between',gap:14,flexWrap:'wrap'}}>
     <div style={{minWidth:0}}><strong>{rows.find(p=>p.id===s.plan_id)?.name||'Subscription'}</strong>
      <small style={{display:'block',fontSize:11,wordBreak:'break-all',color:'#7b9184'}}>Customer ID: {s.user_id}</small>
      <small>Expires: {new Date(s.expires_at).toLocaleString('en-NG')}</small>
     </div>
     <div style={{display:'grid',justifyItems:'end',gap:7}}><strong style={{textTransform:'capitalize',color:s.status==='active'&&new Date(s.expires_at)>new Date()?'#087a5e':'#b47028'}}>{s.status}</strong>
      {owner&&<button style={{...button,padding:'7px 11px'}} onClick={()=>setTarget(target===s.id?null:s.id)}>Manage access</button>}</div>
     {owner&&target===s.id&&<div style={{width:'100%',display:'grid',gap:9,padding:13,background:'#f4faf5',borderRadius:9}}>
      <select style={field} value={action} onChange={e=>setAction(e.target.value)}>
       <option value="suspend">Suspend</option><option value="cancel">Cancel</option><option value="reactivate">Reactivate only if unexpired</option>
      </select>
      <textarea style={{...field,minHeight:70}} placeholder="Document the reason for management intervention (15+ characters)." value={reason} onChange={e=>setReason(e.target.value)}/>
      <button type="button" disabled={busy||reason.trim().length<15} style={button} onClick={()=>{void decide()}}>Apply audited action</button>
     </div>}
    </article>)}
   </div>}
  </section>
  <section style={card}><h2 style={{fontSize:23,margin:0}}>Paystack Transaction Ledger</h2>
   <p style={{fontSize:12,color:'#6d8676',lineHeight:1.6}}>Success requires Paystack HMAC authentication, direct provider verification, exact amount and matching environment. The ledger preserves records; unverified checkout attempts are not revenue.</p>
   {!transactions.length?<p>No transactions yet.</p>:
   <div style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:700,borderCollapse:'collapse'}}>
    <thead><tr>{['Reference','Customer ID','Amount','Status','Environment','Time'].map(h=><th key={h} style={{textAlign:'left',padding:12,borderBottom:'1px solid #dcebe2',fontSize:12}}>{h}</th>)}</tr></thead>
    <tbody>{transactions.map(t=><tr key={t.id}>{[
     t.reference,t.user_id,money(t.amount_kobo),t.status,t.provider_domain||'Unverified',
     new Date(t.paid_at||t.created_at).toLocaleString('en-NG')
    ].map((v,i)=><td key={i} style={{padding:12,fontSize:11,wordBreak:'break-word'}}>{v}</td>)}</tr>)}</tbody>
   </table></div>}
  </section>
 </div>;
}
