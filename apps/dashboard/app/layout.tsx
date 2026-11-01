import '../../../packages/shared/EnterpriseReadability.css';
import '../../../packages/shared/BrandedSelect.css';
import './staff/staff-auth.css';
import './enterprise-showcase.css';
import type {Metadata} from 'next';
export const dynamic='force-dynamic';
export const revalidate=0;
export const metadata:Metadata={title:'Landshop Enterprise App'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><head><meta name="landshop-release" content={process.env.NEXT_PUBLIC_LANDSHOP_RELEASE_SHA||'unversioned'}/></head><body style={{margin:0}}>{children}</body></html>}
