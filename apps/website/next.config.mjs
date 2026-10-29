import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
export default {
 output:'standalone',outputFileTracingRoot:path.resolve(dir,'../..'),reactStrictMode:true,poweredByHeader:false,
 async redirects(){return [
  {source:'/contact-us',destination:'/contact',permanent:true},
  {source:'/about-us',destination:'/about',permanent:true},
  {source:'/my-account',destination:'https://portal.landshopnigeria.com',permanent:true},
  {source:'/property-list',destination:'/properties',permanent:true},
  {source:'/properties-list',destination:'/properties',permanent:true},
  {source:'/blog',destination:'/insights',permanent:true}
 ];}
};
