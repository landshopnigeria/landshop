import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
export default {
 output:'standalone',outputFileTracingRoot:path.resolve(dir,'../..'),reactStrictMode:true,poweredByHeader:false,
 async headers(){return [
  {source:'/:path*',headers:[
   {key:'Strict-Transport-Security',value:'max-age=31536000; includeSubDomains'},
   {key:'X-Content-Type-Options',value:'nosniff'},
   {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
   {key:'X-Frame-Options',value:'SAMEORIGIN'},
   {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=(), payment=()'},
   {key:'Cross-Origin-Opener-Policy',value:'same-origin-allow-popups'},
   {key:'Content-Security-Policy',value:"frame-ancestors 'self'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests"}
  ]},
  {source:'/api/:path*',headers:[{key:'Cache-Control',value:'private, no-store, max-age=0'},{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}]},
  {source:'/search',headers:[{key:'X-Robots-Tag',value:'noindex, follow'}]},
  {source:'/newsletter/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}]}
 ];},
 async redirects(){return [
  {source:'/contact-us',destination:'/contact',permanent:true},
  {source:'/about-us',destination:'/about',permanent:true},
  {source:'/my-account',destination:'https://portal.landshopnigeria.com',permanent:true},
  {source:'/property-list',destination:'/properties',permanent:true},
  {source:'/properties-list',destination:'/properties',permanent:true},
  {source:'/blog',destination:'/insights',permanent:true}
 ];}
};
