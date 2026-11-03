import {requireLandshopStaff} from '../../../lib/admin-access';
import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {redirect} from 'next/navigation';
import NexusHost from './NexusHost';
import {NEXUS_WORKSPACE_HTML} from './NexusWorkspaceHTML';
import './nexus-host.css';
export const dynamic='force-dynamic';
export default async function Page(){
 const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const {data,error}=await db.from('automation_workflows').select('id,name,description,version,state,draft_graph').order('name');
 if(error)return <main>Workflows could not be loaded. Refresh to retry.</main>;
 return <NexusHost initial={(data||[]) as any} html={NEXUS_WORKSPACE_HTML}/>;
}
