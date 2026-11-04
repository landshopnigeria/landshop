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

  // Versioned property/editorial media are browser-cacheable, but HTML and
  // release-health endpoints must remain fresh. New photos use new filenames.
  {source:'/owner/:path*',headers:[{key:'Cache-Control',value:'public, max-age=86400, stale-while-revalidate=604800'}]},
  {source:'/estates/:path*',headers:[{key:'Cache-Control',value:'public, max-age=86400, stale-while-revalidate=604800'}]},
  {source:'/media/:path*',headers:[{key:'Cache-Control',value:'public, max-age=3600, stale-while-revalidate=86400'}]},
  {source:'/brand/:path*',headers:[{key:'Cache-Control',value:'public, max-age=86400, stale-while-revalidate=604800'}]},
  // Exact owner-supplied About photographs; never match the /about HTML route.
  {source:'/about/landshop-landmark-building.webp',headers:[{key:'Cache-Control',value:'public, max-age=86400, stale-while-revalidate=604800'}]},
  {source:'/about/landshop-site-team-huddle.webp',headers:[{key:'Cache-Control',value:'public, max-age=86400, stale-while-revalidate=604800'}]},
  {source:'/about/landshop-white-estate-gate.webp',headers:[{key:'Cache-Control',value:'public, max-age=86400, stale-while-revalidate=604800'}]},
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
  {source:'/blog',destination:'/insights',permanent:true},
  {source:'/projects/blue-diamond',destination:'/projects/blue-diamonds',permanent:true},
  {source:'/properties/blue-diamond',destination:'/properties/blue-diamonds',permanent:true},
  {source:'/projects/blue-diamonds-estate',destination:'/projects/blue-diamonds',permanent:true},
  {source:'/properties/blue-diamonds-estate',destination:'/properties/blue-diamonds',permanent:true}
 ];}
};
