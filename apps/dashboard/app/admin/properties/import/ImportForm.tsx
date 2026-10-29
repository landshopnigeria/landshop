'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';

type RecordRow=Record<string,string>;
const REQUIRED=['title','property_type','price','estate','state','city'] as const;
const ALLOWED=['title','property_type','price','estate','state','city','lga','area','plot_number','size_sqm','sale_mode','bedrooms'];
const parseCsv=(text:string):string[][]=>{
 const lines:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(ch==='"'){
   if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;
  }else if(ch===','&&!quoted){row.push(cell);cell='';}
  else if((ch==='\n'||ch==='\r')&&!quoted){
   if(ch==='\r'&&text[i+1]==='\n')i++;
   row.push(cell);if(row.some(Boolean))lines.push(row);
   row=[];cell='';
  }else cell+=ch;
 }
 if(quoted)throw Error('CSV has an unclosed quoted value.');
 row.push(cell);if(row.some(Boolean))lines.push(row);
 return lines;
};
function supabase(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Import service is not configured');
 return createBrowserClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',path:'/',sameSite:'lax',secure:true}});
}
export default function ImportForm(){
 const [rows,setRows]=useState<RecordRow[]>([]),[name,setName]=useState(''),[message,setMessage]=useState('');
 const [busy,setBusy]=useState(false),[batch,setBatch]=useState('');
 async function fileChange(file?:File){
  setRows([]);setBatch('');setMessage('');
  if(!file)return;
  try{
   if(!file.name.toLowerCase().endsWith('.csv'))throw Error('Select a CSV file.');
   if(file.size>200000)throw Error('For this release, CSV files must be under 200 KB.');
   const text=await file.text();const table=parseCsv(text);
   const columns=(table.shift()||[]).map(x=>x.trim().toLowerCase().replace(/^\ufeff/,''));
   if(columns.length!==new Set(columns).size)throw Error('Duplicate column names found.');
   if(REQUIRED.some(x=>!columns.includes(x)))throw Error('CSV must include title, property_type, price, estate, state and city columns.');
   if(columns.some(x=>!ALLOWED.includes(x)))throw Error('File has unsupported columns: '+columns.filter(x=>!ALLOWED.includes(x)).join(', '));
   if(table.length>100)throw Error('Maximum 100 rows per import batch.');
   const records=table.map((row,index)=>{
    if(row.length!==columns.length)throw Error('Incorrect column count in row '+(index+2));
    return Object.fromEntries(columns.map((field,i)=>[field,row[i].trim().slice(0,2000)]));
   });
   if(!records.length)throw Error('No property records were found.');
   setName(file.name);setRows(records);
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to read CSV')}
 }
 async function stage(){
  setBusy(true);setMessage('');
  try{
   const {data,error}=await supabase().rpc('landshop_property_import_stage',{p_filename:name,p_rows:rows});
   if(error||!data)throw Error('Import staging failed. Verify staff permissions and database setup.');
   setBatch(String(data));setMessage('Batch staged with full location and price columns. Another authorized reviewer must approve it; a separate promoter creates drafts. Nothing was published.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to stage import')}
  finally{setBusy(false)}
 }
 return <main style={{minHeight:'100vh',background:'#f2f8f4',padding:'clamp(18px,5vw,60px)',fontFamily:'Arial,sans-serif',color:'#064438'}}>
  <a href="/admin/properties">← Property management</a><h1>Bulk property import</h1>
  <p>Upload a CSV to validate and stage property data. No uploaded row automatically becomes a public listing.</p>
  <section style={{maxWidth:850,background:'white',border:'1px solid #d2e7dc',borderRadius:22,padding:30}}>
   <h2>Import a CSV</h2><p>Required columns: <strong>title, property_type, price, estate, state, city</strong>. Optional: lga, area, plot_number, size_sqm, sale_mode, bedrooms.</p>
   <p><a href="/templates/landshop-property-import.csv" download="landshop-property-import.csv" style={{color:'#087f62',fontWeight:800}}>Download approved Landshop CSV template ↓</a></p>
   <p>Property types: land, house, apartment, commercial, shortlet. Enter actual NGN figures (not kobo) from a current authorized price sheet. State and estate should reflect the true property location. Do not use general estate photos as a substitute for property-unit media.</p>
   <input type="file" accept=".csv,text/csv" onChange={e=>fileChange(e.target.files?.[0])} aria-label="Upload property CSV"/>
   {!!rows.length&&<><h3>Preview — {rows.length} rows</h3><div style={{maxHeight:380,overflow:'auto',border:'1px solid #e2eee6'}}>
    <table style={{width:'100%',borderCollapse:'collapse'}}>
     <thead><tr>{['Title','Type','Price (₦)','Estate','State','City'].map(x=><th key={x} style={{padding:12,textAlign:'left'}}>{x}</th>)}</tr></thead>
     <tbody>{rows.slice(0,20).map((r,i)=><tr key={i}>
      {[r.title,r.property_type,r.price||'—',r.estate||'—',r.state||'—',r.city||'—'].map((v,j)=><td key={j} style={{padding:12,borderTop:'1px solid #edf3ed'}}>{v}</td>)}
     </tr>)}</tbody></table>
    </div>
    <button type="button" onClick={stage} disabled={busy||!!batch} style={{marginTop:22,padding:'13px 24px',background:'#07876a',color:'white',border:0,borderRadius:12}}>
      {busy?'Validating…':'Stage for Review'}</button></>}
   {batch&&<div style={{marginTop:15,padding:14,background:'#ecf9f2',borderRadius:10}}><p><strong>Batch ID:</strong> {batch}</p><a style={{color:'#087c61',fontWeight:800}} href="/admin/properties/import/review">Open staff import review →</a></div>}
   <p role="status" aria-live="polite">{message}</p>
  </section>
 </main>;
}
