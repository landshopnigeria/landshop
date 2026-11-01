import '../../../packages/shared/EnterpriseReadability.css';
import '../../../packages/shared/BrandedSelect.css';
import type { Metadata } from 'next';
import './globals.css';
export const dynamic='force-dynamic';
export const revalidate=0;
export const metadata:Metadata={title:'Landshop Portal',description:'Secure Landshop account registration, verification and sign-in'};
export default function Layout({children}:{children:React.ReactNode}){
 return <html lang="en"><head><meta name="landshop-release" content={process.env.NEXT_PUBLIC_LANDSHOP_RELEASE_SHA||'unversioned'}/></head><body>{children}</body></html>;
}
