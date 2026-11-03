'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '@supabase/ssr';
import ExportRecords from '../reports/ExportRecords';
type Account={id:string;email:string;full_name:string|null;phone:string|null;account_type:string;staff_number:string|null;realtor_registration_number:string|null;issuing_body:string|null;kyc_status:string|null;employment_state:string|null;memberships:{role:string;status:string}[]};
function db(){return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',secure:true,sameSite:'lax'}})}
export default function AccountDirectory(){
 const [query,setQuery]=useState(''),[search,setSearch]=useState(''),[offset,setOffset]=useState(0),[rows,setRows]=useState<Account[]>([]),[total,setTotal]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [selected,setSelected]=useState<Account|null>(null),[name,setName]=useState(''),[phone,setPhone]=useState(''),[reason,setReason]=useState('');
 const load=useCallback(async()=>{setBusy(true);setMessage('');try{
  const {data,error}=await db().rpc('landshop_command_directory',{p_search:search,p_offset:offset,p_limit:50});
  if(error)throw error;setRows(data.rows||[]);setTotal(data.total||0);
 }catch{setRows([]);setMessage('Records could not be loaded. Check your management session and the directory migration.')}finally{setBusy(false)}},[search,offset]);
 useEffect(()=>{void load()},[load]);
 async function save(){if(!selected)return;setBusy(true);setMessage('');try{
  const {error}=await db().rpc('landshop_command_update_profile',{p_user:selected.id,p_name:name,p_phone:phone,p_reason:reason});
  if(error)throw error;setSelected(null);await load();setMessage('Profile saved. The change and reason were recorded in the audit log.');
 }catch(e){setMessage(e instanceof Error?e.message:'Profile update failed.')}finally{setBusy(false)}}
 return <section>
  <form onSubmit={e=>{e.preventDefault();setOffset(0);setSearch(query.trim());setSelected(null)}} style={{display:'flex',gap:12,flexWrap:'wrap',margin:'24px 0'}}>
   <label>Search email, name, staff or realtor number <input maxLength={160} value={query} onChange={e=>setQuery(e.target.value)} style={{padding:12,maxWidth:'100%'}}/></label><button disabled={busy}>Search</button><button type="button" onClick={()=>void load()} disabled={busy}>Refresh</button>
  </form>
  {message&&<p role="status">{message}</p>}
  <p aria-live="polite">{busy?'Loading records…':`${total} matching accounts. Showing ${rows.length?offset+1:0}–${offset+rows.length}.`}</p>
  <ExportRecords basename="landshop-account-directory-page" rows={rows.map(r=>({user_id:r.id,email:r.email,name:r.full_name,phone:r.phone,account_type:r.account_type,roles:r.memberships.map(m=>m.role+' ('+m.status+')').join('; '),staff_number:r.staff_number,realtor_registration_number:r.realtor_registration_number,issuing_body:r.issuing_body,kyc_status:r.kyc_status,employment_state:r.employment_state}))}/>
  <div style={{overflowX:'auto',margin:'22px 0',background:'white'}}><table style={{width:'100%',minWidth:850,borderCollapse:'collapse'}}><thead><tr>{['Account','Type / Roles','Registration records','Manage'].map(h=><th key={h} style={{padding:14,textAlign:'left'}}>{h}</th>)}</tr></thead>
  <tbody>{rows.map(r=><tr key={r.id} style={{borderTop:'1px solid #dce8e1'}}><td style={{padding:14}}><strong>{r.full_name||'Name not submitted'}</strong><div>{r.email}</div><small>{r.phone||'Phone not submitted'}</small></td><td>{r.account_type}<div>{r.memberships.map(m=>m.role.replaceAll('_',' ')+' · '+m.status).join(', ')}</div></td><td>Staff: {r.staff_number||'Not issued'}<div>Realtor: {r.realtor_registration_number||'Not submitted'}</div><small>{r.issuing_body}</small></td><td><button type="button" onClick={()=>{setSelected(r);setName(r.full_name||'');setPhone(r.phone||'');setReason('')}}>Edit profile</button><div><Link href={'/admin/users/'+r.id}>Submitted records</Link></div>{r.account_type!=='customer'&&<Link href="/admin/workforce">Roles & staff suspension</Link>}</td></tr>)}</tbody></table></div>
  {!busy&&!rows.length&&<p>No accounts match this search.</p>}
  <nav aria-label="Account directory pages" style={{display:'flex',gap:16}}><button disabled={busy||offset===0} onClick={()=>setOffset(Math.max(0,offset-50))}>Previous</button><button disabled={busy||offset+rows.length>=total} onClick={()=>setOffset(offset+50)}>Next</button></nav>
  {selected&&<section style={{background:'white',padding:24,marginTop:24,borderRadius:14}}><h2>Edit {selected.email}</h2><form onSubmit={e=>{e.preventDefault();void save()}} style={{display:'grid',gap:14,maxWidth:600}}><label>Full name <input required maxLength={160} value={name} onChange={e=>setName(e.target.value)}/></label><label>Phone <input maxLength={40} value={phone} onChange={e=>setPhone(e.target.value)}/></label><label>Reason for change <textarea required minLength={10} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}/></label><div><button disabled={busy}>Save profile</button> <button type="button" onClick={()=>setSelected(null)}>Cancel</button></div></form></section>}
 </section>;
}
