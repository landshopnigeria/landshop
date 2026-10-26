import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
export default {output:'standalone',outputFileTracingRoot:path.resolve(dir,'../..'),reactStrictMode:true,poweredByHeader:false};
