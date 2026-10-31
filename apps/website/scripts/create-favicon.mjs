import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// Wrap the owner's original transparent PNG in an ICO container without
// changing the approved artwork. Next.js additionally serves app/icon.png.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const png=readFileSync(path.join(root,'favicon.png'));
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
if(!png.subarray(0,8).equals(signature))throw Error('Expected approved Landshop PNG artwork');
const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
if(width<1||height<1||width>256||height>256)throw Error('Favicon source must be 1–256px PNG');
const header=Buffer.alloc(22);
header.writeUInt16LE(1,2); // 1 = icon
header.writeUInt16LE(1,4); // 1 embedded PNG image
header[6]=width===256?0:width;
header[7]=height===256?0:height;
header.writeUInt16LE(1,10);
header.writeUInt16LE(32,12);
header.writeUInt32LE(png.length,14);
header.writeUInt32LE(header.length,18);
const target=path.join(root,'favicon.ico');
writeFileSync(target,Buffer.concat([header,png]));
console.log('Landshop official logo favicon generated:',width+'x'+height);
