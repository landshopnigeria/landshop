import test from 'node:test';
import assert from 'node:assert/strict';
import {KYC_EXTENSIONS,MAX_KYC_BYTES,hasExpectedSignature,kycObjectKey,validateKycFile} from './kyc-file.ts';
const uuid='550e8400-e29b-41d4-a716-446655440000';
const sub='550e8400-e29b-41d4-a716-446655440001';
const id='550e8400-e29b-41d4-a716-446655440002';
const signatures={
 'image/jpeg':new Uint8Array([255,216,255,224,0,16,74,70,73,70,0,0]),
 'image/png':new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]),
 'image/webp':new Uint8Array([82,73,70,70,18,0,0,0,87,69,66,80]),
 'application/pdf':new Uint8Array([37,80,68,70,45,49,46,55,0,0,0,0])
};
test('recognizes supported file signatures and rejects swapped MIME labels',()=>{
 for(const [mime,bytes] of Object.entries(signatures)){
  validateKycFile('government_id',mime,bytes.length);
  assert.ok(hasExpectedSignature(bytes,mime));
  for(const different of Object.keys(signatures)){
   if(different!==mime)assert.equal(hasExpectedSignature(bytes,different),false);
  }
 }
});
test('rejects unsupported formats, disallowed portraits and size manipulation',()=>{
 for(const mime of ['image/heic','application/octet-stream','text/html','image/svg+xml','']){
  assert.throws(()=>validateKycFile('government_id',mime,120),/Only JPG/);
 }
 assert.throws(()=>validateKycFile('portrait','application/pdf',120),/photograph/);
 for(const size of [-1,0,NaN,Infinity,MAX_KYC_BYTES+1,1.2]){
  assert.throws(()=>validateKycFile('government_id','image/jpeg',size),/smaller than 10 MB/);
 }
 assert.doesNotThrow(()=>validateKycFile('portrait','image/jpeg',MAX_KYC_BYTES));
});
test('does not accept short, empty or forged magic bytes',()=>{
 assert.equal(hasExpectedSignature(new Uint8Array(), 'image/jpeg'),false);
 assert.equal(hasExpectedSignature(new Uint8Array([255,216,255]), 'image/jpeg'),false);
 assert.equal(hasExpectedSignature(new Uint8Array(12), 'image/png'),false);
});
test('restricts storage keys to canonical user/submission identifiers and document type',()=>{
 assert.equal(kycObjectKey(uuid,sub,'portrait',id,'image/jpeg'),uuid+'/'+sub+'/portrait-'+id+'.jpg');
 assert.equal(kycObjectKey(uuid,sub,'government_id',id,'application/pdf'),uuid+'/'+sub+'/government_id-'+id+'.pdf');
 assert.throws(()=>kycObjectKey('../other',sub,'portrait',id,'image/jpeg'),/identifier/);
 assert.throws(()=>kycObjectKey(uuid,'../../secret','portrait',id,'image/jpeg'),/identifier/);
 assert.throws(()=>kycObjectKey(uuid,sub,'../../secret',id,'image/jpeg'),/category/);
 assert.equal(KYC_EXTENSIONS['image/webp'],'webp');
});
