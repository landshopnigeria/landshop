import '../../../packages/shared/EnterpriseReadability.css';
import '../../../packages/shared/BrandedSelect.css';
import './staff/staff-auth.css';
import './enterprise-showcase.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Landshop Enterprise App'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body style={{margin:0}}>{children}</body></html>}
