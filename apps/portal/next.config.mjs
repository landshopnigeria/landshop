import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
export default {output:'standalone',outputFileTracingRoot:path.resolve(dir,'../..'),reactStrictMode:true,poweredByHeader:false,
 async headers(){return [

  // Cache stable photos/icons, never authenticated HTML or API responses.
  {source:'/media/:path*',headers:[{key:'Cache-Control',value:'public, max-age=3600, stale-while-revalidate=86400'}]},
  {source:'/owner/:path*',headers:[{key:'Cache-Control',value:'public, max-age=86400, stale-while-revalidate=604800'}]},
  {source:'/brand/:path*',headers:[{key:'Cache-Control',value:'public, max-age=86400, stale-while-revalidate=604800'}]},
  {source:'/images/:path*',headers:[{key:'Cache-Control',value:'public, max-age=86400, stale-while-revalidate=604800'}]},
  {source:'/:path*',headers:[
   {key:'Strict-Transport-Security',value:'max-age=31536000; includeSubDomains'},
   {key:'X-Content-Type-Options',value:'nosniff'},
   {key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'},
   {key:'X-Frame-Options',value:'DENY'},
   {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
   {key:'Cross-Origin-Opener-Policy',value:'same-origin-allow-popups'},
   {key:'Content-Security-Policy',value:"frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests"}
  ]}
 ];}};
