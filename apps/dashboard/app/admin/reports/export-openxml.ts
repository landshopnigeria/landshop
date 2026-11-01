/* Small standards-compliant Open XML export builder.
 * Exports only records already authorized and loaded by the caller.
 * ZIP store entries keep document generation dependency-free.
 */
type Cell=string|number|null;
type Row=Record<string,Cell>;
const encoder=new TextEncoder();
function xml(value:unknown){
 return String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function crc32(bytes:Uint8Array){
 let crc=-1;
 for(const byte of bytes){crc^=byte;for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}
 return (crc^-1)>>>0;
}
function zip(files:Record<string,string>):Uint8Array{
 const parts:Uint8Array[]=[];const central:Uint8Array[]=[];let offset=0;
 const u16=(v:DataView,p:number,n:number)=>v.setUint16(p,n,true);
 const u32=(v:DataView,p:number,n:number)=>v.setUint32(p,n>>>0,true);
 for(const [name,contents] of Object.entries(files)){
  const filename=encoder.encode(name),payload=encoder.encode(contents),crc=crc32(payload);
  const local=new Uint8Array(30+filename.length),l=new DataView(local.buffer);
  u32(l,0,0x04034b50);u16(l,4,20);u16(l,6,0x0800);u16(l,8,0);
  u32(l,14,crc);u32(l,18,payload.length);u32(l,22,payload.length);
  u16(l,26,filename.length);local.set(filename,30);
  parts.push(local,payload);
  const cd=new Uint8Array(46+filename.length),d=new DataView(cd.buffer);
  u32(d,0,0x02014b50);u16(d,4,20);u16(d,6,20);u16(d,8,0x0800);
  u32(d,16,crc);u32(d,20,payload.length);u32(d,24,payload.length);
  u16(d,28,filename.length);u32(d,42,offset);cd.set(filename,46);
  central.push(cd);offset+=local.length+payload.length;
 }
 const directoryLength=central.reduce((sum,part)=>sum+part.length,0);
 const end=new Uint8Array(22),v=new DataView(end.buffer);
 u32(v,0,0x06054b50);u16(v,8,central.length);u16(v,10,central.length);
 u32(v,12,directoryLength);u32(v,16,offset);
 const all=[...parts,...central,end],result=new Uint8Array(offset+directoryLength+end.length);
 let p=0;for(const part of all){result.set(part,p);p+=part.length}
 return result;
}
function excelColumn(number:number){let letters='';for(let n=number+1;n>0;n=Math.floor((n-1)/26)){letters=String.fromCharCode(65+(n-1)%26)+letters}return letters}
export function excelWorkbook(rows:Row[]):Uint8Array{
 const keys=Object.keys(rows[0]||{});
 const cells=(values:Cell[],i:number)=>values.map((value,j)=>{
  const ref=excelColumn(j)+(i+1);
  // All user-controlled values are text, preventing spreadsheet formula execution.
  return '<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>';
 }).join('');
 const body=[keys,...rows.map(row=>keys.map(key=>row[key]))]
  .map((values,i)=>'<row r="'+(i+1)+'">'+cells(values,i)+'</row>').join('');
 const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+body+'</sheetData></worksheet>';
 return zip({
  '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
  '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
  'xl/workbook.xml':'<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Landshop Records" sheetId="1" r:id="rId1"/></sheets></workbook>',
  'xl/_rels/workbook.xml.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
  'xl/worksheets/sheet1.xml':sheet
 });
}
export function wordDocument(rows:Row[],title:string):Uint8Array{
 const keys=Object.keys(rows[0]||{});
 const cell=(value:unknown,header=false)=>'<w:tc><w:p><w:r>'+(header?'<w:rPr><w:b/></w:rPr>':'')+'<w:t xml:space="preserve">'+xml(value)+'</w:t></w:r></w:p></w:tc>';
 const table='<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr>'+
  '<w:tr>'+keys.map(k=>cell(k,true)).join('')+'</w:tr>'+
  rows.map(row=>'<w:tr>'+keys.map(key=>cell(row[key])).join('')+'</w:tr>').join('')+'</w:tbl>';
 const document='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>'+xml(title)+'</w:t></w:r></w:p>'+table+'<w:sectPr/></w:body></w:document>';
 return zip({
  '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  'word/document.xml':document
 });
}
