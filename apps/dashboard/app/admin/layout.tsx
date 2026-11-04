import {requireLandshopStaff} from '../../lib/admin-access';
import type {Metadata} from 'next';
export const metadata:Metadata={robots:{index:false,follow:false,noarchive:true,nosnippet:true}};
import CommandWorkspace from './CommandWorkspace';
import './modern-command.css';
export default async function Layout({children}:{children:React.ReactNode}){
 const {user}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 return <CommandWorkspace email={user.email||'Management account'}>{children}</CommandWorkspace>;
}
