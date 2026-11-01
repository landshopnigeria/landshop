import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {redirect} from 'next/navigation';
import NexusHost from './NexusHost';
import {NEXUS_WORKSPACE_HTML} from './NexusWorkspaceHTML';
import './nexus-host.css';
export const dynamic='force-dynamic';
export default async function Page(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return <main>Automation database configuration required.</main>;
 const store=await cookies();
 const db=createServerClient(url,key,{cookieOptions:{domain:'.landshopnigeria.com',sameSite:'lax',secure:true,path:'/'},
  cookies:{getAll(){return store.getAll()},setAll(list){try{list.forEach(x=>store.set(x.name,x.value,x.options))}catch{}}}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect('https://portal.landshopnigeria.com/');
 const {data:members}=await db.from('organization_members').select('organization_id,role')
  .eq('user_id',user.id).eq('status','active');
 const qualified=(members||[]).filter(m=>['owner','ceo','founder','admin','technology_officer','technology_consultant'].includes(m.role));
 if(!qualified.length)return <main>Landshop workflow administrator role required.</main>;
 const {data:orgs}=await db.from('organizations').select('id').eq('kind','landshop')
  .in('id',qualified.map(m=>m.organization_id));
 if(!orgs?.length)return <main>Access denied.</main>;
 const {data,error:flowError}=await db.from('automation_workflows')
  .select('id,name,description,version,state,draft_graph')
  .order('name',{ascending:true});
 if(flowError)return <main>Workflow definitions could not be loaded.</main>;
 return <NexusHost initial={(data||[]) as any} html={NEXUS_WORKSPACE_HTML}/>;
}
