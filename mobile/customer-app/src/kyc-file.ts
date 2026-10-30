/**
 * Platform-independent KYC upload validation.
 * Runs before any bytes leave the device. The server remains authoritative.
 */
export type KycDocumentType='portrait'|'government_id'|'utility_bill';
export const MAX_KYC_BYTES=10*1024*1024;
export const KYC_MIME=['image/jpeg','image/png','image/webp','application/pdf'] as const;
export type KycMime=(typeof KYC_MIME)[number];
export const KYC_EXTENSIONS:Record<KycMime,string>={
 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'
};
export function validateKycFile(type:KycDocumentType,mime:string,size:number):asserts mime is KycMime{
 if(!(KYC_MIME as readonly string[]).includes(mime))
  throw Error('Only JPG, PNG, WebP and PDF files are accepted.');
 if(type==='portrait'&&mime==='application/pdf')
  throw Error('A selfie must be a photograph, not a PDF.');
 if(!Number.isSafeInteger(size)||size<1||size>MAX_KYC_BYTES)
  throw Error('Choose a document smaller than 10 MB.');
}
/** Magic-byte checks cannot prove the content is harmless. The server must scan files. */
export function hasExpectedSignature(bytes:Uint8Array,mime:KycMime):boolean{
 if(bytes.length<12)return false;
 const matches=(signature:readonly number[],offset=0)=>
  signature.every((b,i)=>bytes[offset+i]===b);
 switch(mime){
  case 'image/jpeg':return matches([0xff,0xd8,0xff]);
  case 'image/png':return matches([137,80,78,71,13,10,26,10]);
  case 'image/webp':return matches([82,73,70,70])&&matches([87,69,66,80],8);
  case 'application/pdf':return matches([37,80,68,70,45]);
 }
}
/** Prevent unsafe upload filenames and MIME-type guesses from user input. */
export function kycObjectKey(userId:string,submissionId:string,type:KycDocumentType,uuid:string,mime:KycMime):string{
 const isUuid=(s:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(s);
 if(!isUuid(userId)||!isUuid(submissionId)||!isUuid(uuid))throw Error('Invalid KYC upload identifier.');
 if(!['portrait','government_id','utility_bill'].includes(type))throw Error('Invalid KYC document category.');
 return userId+'/'+submissionId+'/'+type+'-'+uuid+'.'+KYC_EXTENSIONS[mime];
}
