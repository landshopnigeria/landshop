import type {Metadata} from 'next';
export const metadata:Metadata={title:'Landshop Nigeria',description:'Everyone Deserves Affordable Property.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body style={{margin:0}}>{children}</body></html>}
