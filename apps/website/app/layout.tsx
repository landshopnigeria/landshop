import type {Metadata} from 'next';
import './globals.css';
import './content-pages.css';
import './reference-updates.css';
import './homepage-v16.css';
export const metadata:Metadata={title:'Landshop Nigeria — Develop. Incubate. Grow.',description:'Everyone Deserves Affordable Property. Explore Landshop products, properties and mortgage pathways.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
