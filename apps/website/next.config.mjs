import path from 'node:path';
import {fileURLToPath} from 'node:url';
const currentDir=path.dirname(fileURLToPath(import.meta.url));
/** Landshop monorepo standalone build. Tracing root covers workspace dependencies. */
const nextConfig={
  output:'standalone',
  outputFileTracingRoot:path.resolve(currentDir,'../..'),
  reactStrictMode:true,
  poweredByHeader:false,
};
export default nextConfig;
