import type {Metadata} from 'next';
import './globals.css';
import './content-pages.css';
import './reference-updates.css';
import './homepage-v16.css';
export const metadata:Metadata={title:'Landshop Nigeria — Building Wealth Through Real Estate',description:'Everyone Deserves Affordable Property. Explore Landshop products, properties and mortgage pathways.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><head><meta name="landshop-release" content={process.env.NEXT_PUBLIC_LANDSHOP_RELEASE_SHA||'unversioned'}/></head><body>{children}</body></html>}
