import {requireLandshopStaff} from '../../lib/admin-access';
import CommandWorkspace from './CommandWorkspace';
import './modern-command.css';
export default async function Layout({children}:{children:React.ReactNode}){
 const {user}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 return <CommandWorkspace email={user.email||'Management account'}>{children}</CommandWorkspace>;
}
