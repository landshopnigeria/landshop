-- Landshop V27 internal automation execution.
-- Internal notifications only. No external emails, webhook calls, approvals, transfers,
-- financial changes or customer subscriptions can be executed by this runtime.
create table if not exists public.landshop_automation_inbox (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 run_id uuid not null references public.automation_runs(id),
 node_id text not null,
 subject text not null check(char_length(subject) between 3 and 160),
 body text not null check(char_length(body)<=1000),
 seen_at timestamptz,
 created_at timestamptz not null default now(),
 unique(run_id,node_id,user_id)
);
create index if not exists ls_automation_inbox_user_created on public.landshop_automation_inbox(user_id,created_at desc);
create unique index if not exists ls_auto_unique_source_run on public.automation_runs(workflow_id,event_id) where event_id is not null;
alter table public.landshop_automation_inbox enable row level security;
revoke all on public.landshop_automation_inbox from public,anon,authenticated;
grant select on public.landshop_automation_inbox to authenticated;
create policy ls_automation_inbox_owner_read on public.landshop_automation_inbox
 for select to authenticated using(user_id=(select auth.uid()) or public.landshop_is_management((select auth.uid())));

create or replace function public.landshop_automation_publish_internal(
 p_workflow uuid,p_version integer
) returns boolean language plpgsql security definer set search_path='' as $body$
declare
 actor uuid:=(select auth.uid());
 flow public.automation_workflows%rowtype;
 nodes jsonb; edges jsonb; trigger_id text; reachable integer;
begin
 if actor is null or not exists(
 select 1 from public.organization_members m join public.organizations o
 on o.id=m.organization_id where m.user_id=actor and m.role='owner'
 and m.status='active' and o.kind='landshop')
 then raise exception 'Verified Landshop owner required to activate automation';end if;
 select * into flow from public.automation_workflows where id=p_workflow for update;
 if not found or flow.version<>p_version or flow.state not in ('draft','review','paused')
 then raise exception 'Workflow version cannot be published';end if;
 nodes:=flow.draft_graph->'nodes'; edges:=flow.draft_graph->'edges';
 if jsonb_typeof(nodes)<>'array' or jsonb_typeof(edges)<>'array'
 or jsonb_array_length(nodes) not between 2 and 20
 or jsonb_array_length(edges)<>jsonb_array_length(nodes)-1
 then raise exception 'Production automation requires a small, linear graph';end if;
 if (select count(distinct node->>'id') from jsonb_array_elements(nodes) node)<>jsonb_array_length(nodes)
 or (select count(*) from jsonb_array_elements(nodes) node where node->>'type'='trigger')<>1
 or (select count(*) from jsonb_array_elements(nodes) node where node->>'type'='end')<>1
 then raise exception 'Graph must have unique nodes, one trigger and one end';end if;
 if exists(select 1 from jsonb_array_elements(nodes) node
  where node->>'type' not in ('trigger','task','notification','end')
  or char_length(coalesce(node->>'label','')) not between 4 and 130
  or char_length(coalesce(node->>'id','')) not between 1 and 80
  or (node->>'type'='notification' and node->'config'->>'channel' is distinct from 'internal')
 ) then raise exception 'Unsafe nodes: live runtime supports internal notifications and tasks only';end if;
 select node->>'id' into trigger_id from jsonb_array_elements(nodes) node where node->>'type'='trigger';
 if (select node->'config'->>'event' from jsonb_array_elements(nodes) node where node->>'type'='trigger')
  not in ('staff.report_submitted','staff.report_reviewed','subscription.payment_verified',
  'staff.task_assigned','landshop.contact.received','support.ticket_created',
  'application.submitted','kyc.submitted')
 then raise exception 'The production trigger event is not supported';end if;
 if exists(
  select 1 from jsonb_array_elements(nodes) node
  where (
   node->>'type'<>'trigger' and
   (select count(*) from jsonb_array_elements(edges) edge where edge->>'to'=node->>'id')<>1
  ) or (
   node->>'type'<>'end' and
   (select count(*) from jsonb_array_elements(edges) edge where edge->>'from'=node->>'id')<>1
  ) or (
   node->>'type'='trigger' and
   exists(select 1 from jsonb_array_elements(edges) e where e->>'to'=node->>'id')
  ) or (
   node->>'type'='end' and
   exists(select 1 from jsonb_array_elements(edges) e where e->>'from'=node->>'id')
  )
 ) then raise exception 'Every task must have one safe predecessor and successor';end if;
 if exists(
  select 1 from jsonb_array_elements(edges) edge where
  not exists(select 1 from jsonb_array_elements(nodes) n where n->>'id'=edge->>'from')
  or not exists(select 1 from jsonb_array_elements(nodes) n where n->>'id'=edge->>'to')
 ) then raise exception 'Graph references missing nodes';end if;
 with recursive walk(id,depth) as (
  select trigger_id,0
  union all
  select e->>'to',walk.depth+1
  from walk cross join lateral jsonb_array_elements(edges) e
  where e->>'from'=walk.id and walk.depth<20
 )
 select count(distinct id) into reachable from walk;
 if reachable<>jsonb_array_length(nodes) then raise exception 'Graph must form one connected, acyclic path';end if;
 update public.automation_workflows set active_graph=flow.draft_graph,state='active',
 approved_by=actor,approved_at=now(),updated_at=now()
 where id=p_workflow;
 insert into public.audit_events(actor_id,event_type,metadata) values(actor,'automation.internal_published',
  jsonb_build_object('workflow_id',p_workflow,'version',p_version));
 return true;
end $body$;
revoke all on function public.landshop_automation_publish_internal(uuid,integer) from public,anon;
grant execute on function public.landshop_automation_publish_internal(uuid,integer) to authenticated;

create or replace function public.landshop_automation_pause_internal(p_workflow uuid,p_pause boolean)
returns boolean language plpgsql security definer set search_path='' as $body$
declare actor uuid:=(select auth.uid());
begin
 if actor is null or not exists(
  select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
  where m.user_id=actor and m.role='owner' and m.status='active' and o.kind='landshop')
 then raise exception 'Verified owner required';end if;
 update public.automation_workflows set state=case when p_pause then 'paused' else 'active' end,
 updated_at=now() where id=p_workflow and active_graph is not null
 and (state=case when p_pause then 'active' else 'paused' end);
 if not found then raise exception 'Workflow not eligible for this transition';end if;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(actor,'automation.internal_state_changed',jsonb_build_object('workflow_id',p_workflow,'paused',p_pause));
 return true;
end $body$;
revoke all on function public.landshop_automation_pause_internal(uuid,boolean) from public,anon;
grant execute on function public.landshop_automation_pause_internal(uuid,boolean) to authenticated;

create or replace function public.landshop_automation_mark_seen(p_notice uuid)
returns boolean language plpgsql security definer set search_path='' as $body$
begin
 if (select auth.uid()) is null then raise exception 'Sign in required';end if;
 update public.landshop_automation_inbox set seen_at=coalesce(seen_at,now())
 where id=p_notice and user_id=(select auth.uid());
 if not found then raise exception 'Notice not found';end if;
 return true;
end $body$;
revoke all on function public.landshop_automation_mark_seen(uuid) from public,anon;
grant execute on function public.landshop_automation_mark_seen(uuid) to authenticated;

-- Called by an authenticated GitHub scheduled service-role worker only.
-- Uses the existing durable outbox as an event source, does NOT mark it delivered:
-- other email/webhook providers may still need the same original event.
create or replace function public.landshop_automation_dispatch(p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $body$
declare event record;flow record;nodes jsonb;edges jsonb;cursor_id text;node jsonb;
 run_id uuid;steps integer;processed integer:=0;new_runs integer:=0;notices integer:=0;
begin
 if current_setting('request.jwt.claim.role',true) is distinct from 'service_role'
 then raise exception 'Automation worker authorization required';end if;
 if p_limit not between 1 and 50 then raise exception 'Invalid batch size';end if;
 for event in
  select e.id,e.event_type,e.user_id
  from public.notification_outbox e
  where e.status in ('pending','delivered')
   and e.next_attempt_at<=now()
   and exists(
    select 1 from public.automation_workflows w
    where w.state='active' and w.active_graph is not null
    and exists(select 1 from jsonb_array_elements(w.active_graph->'nodes') n
     where n->>'type'='trigger' and n->'config'->>'event'=e.event_type)
    and not exists(select 1 from public.automation_runs r
     where r.event_id=e.id and r.workflow_id=w.id)
   )
  order by e.next_attempt_at,e.id
  for update skip locked limit p_limit
 loop
  processed:=processed+1;
  for flow in
   select w.id,w.version,w.active_graph from public.automation_workflows w
   where w.state='active' and w.active_graph is not null
   and exists(select 1 from jsonb_array_elements(w.active_graph->'nodes') n
    where n->>'type'='trigger' and n->'config'->>'event'=event.event_type)
   and not exists(select 1 from public.automation_runs r
     where r.workflow_id=w.id and r.event_id=event.id)
  loop
   begin
    nodes:=flow.active_graph->'nodes';edges:=flow.active_graph->'edges';
    select n->>'id' into cursor_id from jsonb_array_elements(nodes) n
      where n->>'type'='trigger' limit 1;
    insert into public.automation_runs(workflow_id,version,event_id,status,context)
    values(flow.id,flow.version,event.id,'running',jsonb_build_object('mode','production_internal',
      'event_type',event.event_type,'external_actions_executed',0))
    on conflict do nothing returning id into run_id;
    if run_id is null then continue;end if;
    new_runs:=new_runs+1;
    for steps in 1..20 loop
     select n into node from jsonb_array_elements(nodes) n where n->>'id'=cursor_id limit 1;
     if node is null then raise exception 'Workflow traversal unavailable';end if;
     insert into public.automation_run_events(run_id,node_id,event_type,details)
     values(run_id,cursor_id,
      case node->>'type' when 'end' then 'internal.completed'
        when 'notification' then 'internal.notification_created'
        when 'task' then 'internal.task_recorded'
        else 'internal.trigger_received' end,
      jsonb_build_object('type',node->>'type','label',node->>'label'));
     if node->>'type'='notification' and event.user_id is not null then
      insert into public.landshop_automation_inbox(user_id,run_id,node_id,subject,body)
      values(event.user_id,run_id,cursor_id,left(node->>'label',160),
       'A Landshop event ('||event.event_type||') has been recorded for your account.');
      notices:=notices+1;
     end if;
     if node->>'type'='end' then
      update public.automation_runs set status='completed',completed_at=now() where id=run_id;
      exit;
     end if;
     select e->>'to' into cursor_id from jsonb_array_elements(edges) e
      where e->>'from'=cursor_id limit 1;
     if cursor_id is null then raise exception 'Workflow has no next step';end if;
    end loop;
    if (select status from public.automation_runs where id=run_id)<>'completed'
    then raise exception 'Workflow exceeded maximum internal steps';end if;
   exception when others then
    -- Keep the original outbox event untouched, preserve a failure signal and
    -- prevent repeated external actions. No external actions are executed here.
    insert into public.audit_events(event_type,metadata) values('automation.internal_dispatch_error',
      jsonb_build_object('event_id',event.id,'workflow_id',flow.id,'code',sqlstate));
   end;
  end loop;
 end loop;
 return jsonb_build_object('events_examined',processed,'runs_created',new_runs,'notices_created',notices);
end $body$;
revoke all on function public.landshop_automation_dispatch(integer) from public,anon,authenticated;
grant execute on function public.landshop_automation_dispatch(integer) to service_role;
