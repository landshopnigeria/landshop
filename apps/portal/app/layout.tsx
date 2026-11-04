import {Suspense} from 'react';
import NavigationFeedback from '../../../packages/shared/NavigationFeedback';
import ReleaseVersionNotice from '../../../packages/shared/ReleaseVersionNotice';
import '../../../packages/shared/EnterpriseReadability.css';
import '../../../packages/shared/BrandedSelect.css';
import type { Metadata } from 'next';
import './globals.css';
import '../../../packages/shared/EnterpriseMotion.css';
export const dynamic='force-dynamic';
export const revalidate=0;
export const metadata:Metadata={title:'Landshop Portal',description:'Secure Landshop account registration, verification and sign-in',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){
 return <html lang="en"><head><meta name="landshop-release" content={process.env.NEXT_PUBLIC_LANDSHOP_RELEASE_SHA||'unversioned'}/></head><body><ReleaseVersionNotice/><Suspense fallback={null}><NavigationFeedback/></Suspense>{children}</body></html>;
}
