import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Landshop Portal',description:'Secure Landshop account registration, verification and sign-in'};
export default function Layout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>{children}</body></html>;
}
