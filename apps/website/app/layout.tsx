import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Landshop Nigeria — Develop. Incubate. Grow.',description:'Everyone Deserves Affordable Property. Explore Landshop products, properties and mortgage pathways.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
