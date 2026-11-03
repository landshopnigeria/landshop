create table public.landshop_workflow_ai_requests(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),model text not null check(model ~ '^[a-zA-Z0-9._:-]{1,100}$'),status text not null default 'running' check(status in ('running','completed','failed')),node_count integer not null default 0 check(node_count between 0 and 40),edge_count integer not null default 0 check(edge_count between 0 and 80),created_at timestamptz not null default now(),completed_at timestamptz);
alter table public.landshop_workflow_ai_requests enable row level security;
revoke all on public.landshop_workflow_ai_requests from public,anon,authenticated;grant select on public.landshop_workflow_ai_requests to authenticated;
create policy workflow_ai_requests_management on public.landshop_workflow_ai_requests for select to authenticated using(public.landshop_is_management(auth.uid()));
create index workflow_ai_requests_user_time on public.landshop_workflow_ai_requests(user_id,created_at desc);create index workflow_ai_requests_running_time on public.landshop_workflow_ai_requests(created_at desc) where status='running';
create function public.landshop_workflow_ai_reserve(p_model text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if auth.uid() is null or not public.landshop_is_management(auth.uid()) then raise exception 'Management access required' using errcode='42501';end if;
 if p_model is null or p_model !~ '^[a-zA-Z0-9._:-]{1,100}$' then raise exception 'AI model configuration required';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('landshop-workflow-ai-budget',0));
 if (select count(*) from public.landshop_workflow_ai_requests where user_id=auth.uid() and created_at>now()-interval '10 minutes')>=4 or (select count(*) from public.landshop_workflow_ai_requests where status='running' and created_at>now()-interval '60 seconds')>=4 then return null;end if;
 insert into public.landshop_workflow_ai_requests(user_id,model) values(auth.uid(),p_model) returning id into result;
 return result;
end $$;
revoke all on function public.landshop_workflow_ai_reserve(text) from public,anon;grant execute on function public.landshop_workflow_ai_reserve(text) to authenticated;
create function public.landshop_workflow_ai_finish(p_id uuid,p_status text,p_nodes integer,p_edges integer) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.landshop_is_management(auth.uid()) then raise exception 'Management access required' using errcode='42501';end if;
 if p_status is null or p_status not in ('completed','failed') or p_nodes is null or p_nodes not between 0 and 40 or p_edges is null or p_edges not between 0 and 80 then raise exception 'Invalid generation result';end if;
 update public.landshop_workflow_ai_requests set status=p_status,node_count=p_nodes,edge_count=p_edges,completed_at=now() where id=p_id and user_id=auth.uid() and status='running';
 if not found then raise exception 'Generation request unavailable';end if;
 insert into public.audit_events(actor_id,event_type,metadata) values(auth.uid(),'automation.ai_request_'||p_status,jsonb_build_object('request_id',p_id,'node_count',p_nodes,'edge_count',p_edges));
 return true;
end $$;
revoke all on function public.landshop_workflow_ai_finish(uuid,text,integer,integer) from public,anon;grant execute on function public.landshop_workflow_ai_finish(uuid,text,integer,integer) to authenticated;
