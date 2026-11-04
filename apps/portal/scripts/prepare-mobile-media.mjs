/** Copy unmodified, owner-approved photos to the mobile PWA's verified /media path.
 * Namecheap serves /media assets reliably; no cross-origin image dependencies.
 * Copying (not re-encoding) preserves the owner images' exact bytes.
 */
import {copyFileSync,existsSync,mkdirSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const appRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicRoot=path.join(appRoot,'public');
const destination=path.join(publicRoot,'media','mobile');
const assets=[
 ['owner/2026/famous-gardens-homepage-2026-11-mobile.jpg','famous-gardens-homepage-2026-11-mobile.jpg'],
 ['owner/2026/site-client-inspection.webp','site-client-inspection.webp'],
 ['owner/2026/famous-completed-homes.webp','famous-completed-homes.webp'],
 ['owner/2026/product-grow.webp','product-grow.webp'],
 ['estates/green-island/site-progress-1.webp','green-island-site-progress-1.webp'],
 ['estates/blue-diamonds/entrance-concept.webp','blue-diamonds-entrance-concept.webp']
];
mkdirSync(destination,{recursive:true});
for(const [sourceName,destName] of assets){
 const source=path.join(publicRoot,sourceName),target=path.join(destination,destName);
 if(!existsSync(source)||!statSync(source).isFile()||statSync(source).size>500_000)throw new Error('Approved portal media missing or oversized: '+sourceName);
 copyFileSync(source,target);
 if(statSync(target).size!==statSync(source).size)throw new Error('Portal media copy mismatch: '+destName);
}
console.log('Prepared '+assets.length+' original mobile photos on verified portal media path');
