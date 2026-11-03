'use client';
import {useState} from 'react';
import {excelWorkbook,wordDocument} from './export-openxml';
type Row=Record<string,string|number|null>;
const esc=(x:unknown)=>{
 const raw=String(x??'');
 // Spreadsheet software interprets leading =, +, -, @, tabs and newlines as formulas.
 // Escape untrusted cells so an exported customer field cannot execute a formula.
 const safe=/^\s*[=+@-]/.test(raw)||/^[\t\r\n]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
};
export default function ExportRecords({rows,basename}:{rows:Row[];basename:string}){
 const [notice,setNotice]=useState('');
 function download(format:'csv'|'json'|'xlsx'|'docx'){
  if(rows.length===0){setNotice('No authorized records are available to export.');return}
  const headers=Array.from(new Set(rows.flatMap(row=>Object.keys(row))));
  const filename=basename+'-'+new Date().toISOString().slice(0,10)+'.'+format;
  let blob:Blob;
  if(format==='xlsx'){
   blob=new Blob([new Uint8Array(excelWorkbook(rows))],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }else if(format==='docx'){
   blob=new Blob([new Uint8Array(wordDocument(rows,basename.replaceAll('-',' ')))],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }else{
   const content=format==='json'?JSON.stringify(rows,null,2):
    [headers.map(esc).join(','),...rows.map(row=>headers.map(k=>esc(row[k])).join(','))].join('\r\n');
   blob=new Blob([content],{type:format==='csv'?'text/csv;charset=utf-8':'application/json;charset=utf-8'});
  }
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  setNotice('Export prepared from the authorized records currently loaded. Large datasets may require paginated export.');
 }
 function pdf(){if(!rows.length){setNotice('No records to print.');return}const popup=window.open('','_blank');if(!popup){setNotice('Allow popups to prepare the PDF report.');return}popup.opener=null;const escape=(x:unknown)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));popup.document.write('<!doctype html><html><head><title>'+escape(basename)+'</title><style>body{font:12px Arial;color:#183b3b;padding:24px}h1{font-size:22px}article{break-inside:avoid;border-top:2px solid #0e8581;margin-top:24px;padding-top:12px}dl>div{display:grid;grid-template-columns:180px 1fr;border-bottom:1px solid #eee;padding:7px 0}dt{font-weight:bold}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}@page{margin:16mm}button{padding:10px 18px}@media print{button{display:none}}</style></head><body><h1>Landshop · '+escape(basename.replaceAll('-',' '))+'</h1><p>'+rows.length+' authorized records · '+escape(new Date().toLocaleString('en-NG',{timeZone:'Africa/Lagos'}))+'</p><button id="print">Print / Save as PDF</button>'+rows.map((row,i)=>'<article><h2>Record '+(i+1)+'</h2><dl>'+Object.entries(row).map(([key,value])=>'<div><dt>'+escape(key.replaceAll('_',' '))+'</dt><dd>'+escape(value)+'</dd></div>').join('')+'</dl></article>').join('')+'</body></html>');popup.document.close();popup.document.getElementById('print')?.addEventListener('click',()=>popup.print());setNotice('PDF report opened with every exported field. Choose Print / Save as PDF.');}
 return <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
  <button type="button" onClick={()=>download('csv')}>Export CSV</button>
  <button type="button" onClick={()=>download('json')}>Export JSON</button>
  <button type="button" onClick={()=>download('xlsx')}>Export Excel (.xlsx)</button>
  <button type="button" onClick={()=>download('docx')}>Export Word (.docx)</button>
  <button type="button" onClick={pdf}>Print / Save as PDF</button>
  {notice&&<p role="status">{notice}</p>}
 </div>;
}
