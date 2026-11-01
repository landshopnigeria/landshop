'use client';
import {useState} from 'react';
import {excelWorkbook,wordDocument} from './export-openxml';
type Row=Record<string,string|number|null>;
const esc=(x:unknown)=>{
 const raw=String(x??'');
 // Spreadsheet software interprets leading =, +, -, @, tabs and newlines as formulas.
 // Escape untrusted cells so an exported customer field cannot execute a formula.
 const safe=/^[\\s]*[=+@-]/.test(raw)||/^[\\t\\r\\n]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
};
export default function ExportRecords({rows,basename}:{rows:Row[];basename:string}){
 const [notice,setNotice]=useState('');
 function download(format:'csv'|'json'|'xlsx'|'docx'){
  if(rows.length===0){setNotice('No authorized records are available to export.');return}
  const headers=Object.keys(rows[0]);
  const filename=basename+'-'+new Date().toISOString().slice(0,10)+'.'+format;
  let blob:Blob;
  if(format==='xlsx'){
   blob=new Blob([new Uint8Array(excelWorkbook(rows))],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }else if(format==='docx'){
   blob=new Blob([new Uint8Array(wordDocument(rows,basename.replaceAll('-',' ')))],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }else{
   const content=format==='json'?JSON.stringify(rows,null,2):
    [headers.map(esc).join(','),...rows.map(row=>headers.map(k=>esc(row[k])).join(','))].join('\\r\\n');
   blob=new Blob([content],{type:format==='csv'?'text/csv;charset=utf-8':'application/json;charset=utf-8'});
  }
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  setNotice('Export prepared from the authorized records currently loaded. Large datasets may require paginated export.');
 }
 return <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
  <button type="button" onClick={()=>download('csv')}>Export CSV</button>
  <button type="button" onClick={()=>download('json')}>Export JSON</button>
  <button type="button" onClick={()=>download('xlsx')}>Export Excel (.xlsx)</button>
  <button type="button" onClick={()=>download('docx')}>Export Word (.docx)</button>
  <button type="button" onClick={()=>window.print()}>Print / Save as PDF</button>
  {notice&&<p role="status">{notice}</p>}
 </div>;
}
