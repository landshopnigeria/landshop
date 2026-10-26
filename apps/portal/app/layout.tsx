import type {Metadata} from 'next';
export const metadata:Metadata={title:'Landshop Portal',description:'Sign in or register securely with Landshop'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body style={{margin:0}}>{children}</body></html>}
