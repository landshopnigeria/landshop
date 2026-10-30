import type {Metadata} from 'next';
import './globals.css';
import './content-pages.css';
import './reference-updates.css';
import './homepage-v16.css';
import './site-navigation.css';
import './icon-treatments.css';
import './home-three.css';
import './v22-premium.css';
import SiteHeader from '../components/SiteHeader';
// Every marketing page must be served fresh while the V16 site is actively updated.
// Next.js static-prerendered HTML previously sent s-maxage=31536000 (one year).
// Keep hashed /_next/static assets cacheable; only route HTML is dynamic.
export const dynamic='force-dynamic';
export const metadata:Metadata={metadataBase:new URL('https://www.landshopnigeria.com'),title:'Landshop Nigeria — Building Wealth Through Real Estate',description:'Everyone Deserves Affordable Property. Explore Landshop products, properties and mortgage pathways.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><head><meta name="landshop-release" content={process.env.NEXT_PUBLIC_LANDSHOP_RELEASE_SHA||'unversioned'}/></head><body><SiteHeader/>{children}</body></html>}
