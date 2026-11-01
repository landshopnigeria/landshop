-- NEXUS runtime foundation. No external connector, payment, message or device can be executed.
-- Event envelopes, leases and retries are durable. Processing is service-role only.
create table if not exists public.automation_runtime_events(
 id uuid primary key default gen_random_uuid(),
 workflow_id uuid not null references public.automation_workflows(id) on delete restrict,
 created_by uuid not null references auth.users(id),
 idempotency_key text not null check(char_length(idempotency_key) between 12 and 120),
 event_kind text not null check(event_kind in ('manual_preview')),
 run_id uuid unique references public.automation_runs(id) on delete restrict,
 received_at timestamptz not null default now(),
 unique(workflow_id,created_by,idempotency_key)
);
create index if not exists nexus_runtime_events_recent_idx
 on public.automation_runtime_events(created_by,received_at desc);
create table if not exists public.automation_runtime_jobs(
 id uuid primary key default gen_random_uuid(),
 run_id uuid not null unique references public.automation_runs(id) on delete restrict,
 status text not null default 'queued' check(status in ('queued','leased','waiting','completed','dead')),
 available_at timestamptz not null default now(),
 lease_owner text,
 lease_expires_at timestamptz,
 attempts integer not null default 0 check(attempts between 0 and 6),
 max_attempts integer not null default 5 check(max_attempts between 1 and 6),
 last_error_code text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint nexus_lease_state check(status<>'leased' or (lease_owner is not null and lease_expires_at is not null))
);
create index if not exists nexus_runtime_ready_idx
 on public.automation_runtime_jobs(available_at,created_at)
 where status='queued';
create index if not exists nexus_runtime_lease_idx
 on public.automation_runtime_jobs(lease_expires_at)
 where status='leased';

alter table public.automation_runtime_events enable row level security;
alter table public.automation_runtime_jobs enable row level security;
revoke all on public.automation_runtime_events,public.automation_runtime_jobs from public,anon,authenticated;
grant select on public.automation_runtime_events,public.automation_runtime_jobs to authenticated;
create policy nexus_events_management_read on public.automation_runtime_events
 for select to authenticated using(public.landshop_property_editor((select auth.uid()),true));
create policy nexus_jobs_management_read on public.automation_runtime_jobs
 for select to authenticated using(public.landshop_property_editor((select auth.uid()),true));

-- A management member may enqueue a TEST of an existing draft. No arbitrary
-- payload, anonymous trigger, or external side effect is accepted.
create or replace function public.landshop_nexus_queue_preview(
 p_workflow uuid,p_expected_version integer,p_idempotency_key text
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare
 v_actor uuid:=auth.uid();
 v_flow public.automation_workflows%rowtype;
 v_graph jsonb;
 v_event uuid;
 v_existing uuid;
 v_run uuid;
 v_start text;
begin
 if v_actor is null or not public.landshop_property_editor(v_actor,true) then
  raise exception 'Authorized management account required';
 end if;
 if p_workflow is null or p_expected_version is null or
    p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9_-]{12,120}$' then
  raise exception 'Invalid workflow, version or idempotency key';
 end if;
 select * into v_flow from public.automation_workflows where id=p_workflow for share;
 if not found or v_flow.version<>p_expected_version or
    v_flow.state not in ('draft','review','paused') then
  raise exception 'Save the latest editable workflow before queueing a preview';
 end if;
 v_graph:=v_flow.draft_graph;
 if jsonb_typeof(v_graph->'nodes')<>'array' or jsonb_typeof(v_graph->'edges')<>'array'
   or jsonb_array_length(v_graph->'nodes') not between 2 and 100
   or jsonb_array_length(v_graph->'edges')>160 or pg_column_size(v_graph)>65536 then
  raise exception 'Workflow graph is invalid';
 end if;
 if (select count(*) from jsonb_array_elements(v_graph->'nodes') n where n->>'type'='trigger')<>1
   or (select count(*) from jsonb_array_elements(v_graph->'nodes') n where n->>'type'='end')<1
   or (select count(distinct n->>'id') from jsonb_array_elements(v_graph->'nodes') n)
      <>jsonb_array_length(v_graph->'nodes') then
  raise exception 'Workflow must contain distinct nodes, one trigger and an end';
 end if;
 if exists(
  select 1 from jsonb_array_elements(v_graph->'edges') e
  where e->>'from'=e->>'to'
     or not exists(select 1 from jsonb_array_elements(v_graph->'nodes') n where n->>'id'=e->>'from')
     or not exists(select 1 from jsonb_array_elements(v_graph->'nodes') n where n->>'id'=e->>'to')
 ) then raise exception 'Invalid workflow connections';end if;
 -- Idempotent requests do not consume an additional quota.
 select run_id into v_existing from public.automation_runtime_events
  where workflow_id=p_workflow and created_by=v_actor and idempotency_key=p_idempotency_key;
 if v_existing is not null then return v_existing; end if;
 if (select count(*) from public.automation_runtime_events
  where created_by=v_actor and received_at>now()-interval '24 hours')>=30 then
  raise exception 'Daily runtime preview quota reached';
 end if;
 insert into public.automation_runtime_events(workflow_id,created_by,idempotency_key,event_kind)
 values(p_workflow,v_actor,p_idempotency_key,'manual_preview')
 on conflict(workflow_id,created_by,idempotency_key) do nothing returning id into v_event;
 if v_event is null then
  select run_id into v_existing from public.automation_runtime_events
  where workflow_id=p_workflow and created_by=v_actor and idempotency_key=p_idempotency_key;
  if v_existing is null then raise exception 'Idempotent request still being committed'; end if;
  return v_existing;
 end if;
 select n->>'id' into v_start from jsonb_array_elements(v_graph->'nodes') n
 where n->>'type'='trigger' limit 1;
 insert into public.automation_runs(workflow_id,version,status,context)
 values(p_workflow,v_flow.version,'queued',jsonb_build_object(
  'mode','nexus_runtime_preview','requested_by',v_actor,
  'event_kind','manual_preview','graph_snapshot',v_graph,
  'current_node',v_start,'visited','[]'::jsonb,'step_count',0,'external_actions_executed',0))
 returning id into v_run;
 update public.automation_runtime_events set run_id=v_run where id=v_event;
 insert into public.automation_runtime_jobs(run_id) values(v_run);
 insert into public.automation_run_events(run_id,node_id,event_type,details)
 values(v_run,v_start,'nexus.preview_queued',
  jsonb_build_object('version',v_flow.version,'external_actions_executed',0));
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_actor,'automation.runtime_preview_queued',
  jsonb_build_object('run_id',v_run,'workflow_id',p_workflow,'version',v_flow.version));
 return v_run;
end;
$$;
revoke all on function public.landshop_nexus_queue_preview(uuid,integer,text) from public,anon;
grant execute on function public.landshop_nexus_queue_preview(uuid,integer,text) to authenticated;

-- Called exclusively by a dedicated authenticated service-role worker, never
-- browser users. FOR UPDATE SKIP LOCKED leases each job to one worker at a time.
create or replace function public.landshop_nexus_worker_claim(
 p_worker text,p_limit integer default 4
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare v_expired record;v_result jsonb;
begin
 if p_worker is null or p_worker !~ '^[a-zA-Z0-9_.-]{6,80}$'
   or p_limit is null or p_limit not between 1 and 8 then
  raise exception 'Invalid worker identity or batch size';
 end if;
 for v_expired in
  update public.automation_runtime_jobs
   set status='dead',lease_owner=null,lease_expires_at=null,
       last_error_code='lease_exhausted',updated_at=now()
   where status='leased' and lease_expires_at<now() and attempts>=max_attempts
   returning run_id
 loop
  update public.automation_runs set status='failed',completed_at=now(),error_code='lease_exhausted'
   where id=v_expired.run_id;
  insert into public.automation_run_events(run_id,node_id,event_type,details)
   values(v_expired.run_id,'runtime','nexus.dead_letter',
    jsonb_build_object('reason','lease_exhausted'));
 end loop;
 with candidate as(
  select id from public.automation_runtime_jobs
  where (status='queued' and available_at<=now())
    or (status='leased' and lease_expires_at<now() and attempts<max_attempts)
  order by available_at,created_at,id
  for update skip locked
  limit p_limit
 ),leased as(
  update public.automation_runtime_jobs j
   set status='leased',lease_owner=p_worker,lease_expires_at=now()+interval '60 seconds',
       attempts=j.attempts+1,updated_at=now()
  from candidate c where j.id=c.id
  returning j.run_id,j.attempts,j.lease_expires_at
 )
 select coalesce(jsonb_agg(jsonb_build_object(
   'run_id',run_id,'attempt',attempts,'lease_expires_at',lease_expires_at)),'[]'::jsonb)
 into v_result from leased;
 return v_result;
end;
$$;
revoke all on function public.landshop_nexus_worker_claim(text,integer) from public,anon,authenticated;
grant execute on function public.landshop_nexus_worker_claim(text,integer) to service_role;

-- One bounded, atomic state transition. It has NO code path that invokes an
-- external connector. Approval, messaging, webhooks, multiple branches and
-- unknown nodes stop in WAITING for explicit human review.
create or replace function public.landshop_nexus_worker_advance(
 p_run uuid,p_worker text,p_result text default 'success',p_error_code text default null
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
 v_job public.automation_runtime_jobs%rowtype;
 v_run public.automation_runs%rowtype;
 v_node jsonb;
 v_current text;
 v_type text;
 v_kind text;
 v_next text;
 v_targets jsonb;
 v_steps integer;
 v_status text;
 v_reason text;
 v_delay integer;
begin
 if p_run is null or p_worker is null or p_result not in ('success','retry') then
  raise exception 'Invalid worker transition request';
 end if;
 select * into v_job from public.automation_runtime_jobs where run_id=p_run for update;
 if not found or v_job.status<>'leased' or v_job.lease_owner<>p_worker
   or v_job.lease_expires_at<=now() then
  raise exception 'A valid unexpired lease is required';
 end if;
 select * into v_run from public.automation_runs where id=p_run for update;
 if not found or v_run.context->>'mode'<>'nexus_runtime_preview'
   or v_run.status not in ('queued','running') then
  raise exception 'This is not an active runtime preview';
 end if;
 v_current:=v_run.context->>'current_node';
 v_steps:=coalesce((v_run.context->>'step_count')::integer,0);
 if v_steps>=100 then raise exception 'Runtime preview step budget exhausted';end if;
 select n into v_node from jsonb_array_elements(v_run.context->'graph_snapshot'->'nodes') n
  where n->>'id'=v_current limit 1;
 if v_node is null then raise exception 'Workflow cursor does not reference a node';end if;
 v_type:=v_node->>'type';v_kind:=coalesce(v_node->'config'->>'nexusKind','');
 if p_result='retry' then
  v_reason:=coalesce(nullif(regexp_replace(coalesce(p_error_code,'worker_retry'),
    '[^a-zA-Z0-9_.-]','','g'),''),'worker_retry');
  v_reason:=left(v_reason,50);
  if v_job.attempts>=v_job.max_attempts then
   update public.automation_runtime_jobs set status='dead',last_error_code=v_reason,
    lease_owner=null,lease_expires_at=null,updated_at=now() where run_id=p_run;
   update public.automation_runs set status='failed',completed_at=now(),error_code=v_reason where id=p_run;
   v_status:='dead';
  else
   v_delay:=least(600,5*power(2,v_job.attempts)::integer);
   update public.automation_runtime_jobs set status='queued',available_at=now()+
    make_interval(secs=>v_delay),last_error_code=v_reason,
    lease_owner=null,lease_expires_at=null,updated_at=now() where run_id=p_run;
   v_status:='retry_scheduled';
  end if;
  insert into public.automation_run_events(run_id,node_id,event_type,details)
  values(p_run,v_current,case when v_status='dead' then 'nexus.dead_letter' else 'nexus.retry_scheduled' end,
   jsonb_build_object('attempt',v_job.attempts,'error_code',v_reason,'external_actions_executed',0));
  return jsonb_build_object('run_id',p_run,'status',v_status,'error_code',v_reason);
 end if;
 if v_type in ('notification','webhook','approval') or
    v_node->'config'->>'externalProviderAction'='true' or
    v_kind in ('openai','canva','meta','googleads','mqtt','opcua','modbus','grpc','edge','aiwriter','imageai','flyer','video','email','whatsapp','groups','comments') then
  v_status:='waiting';v_reason:='external_or_approval_gate';
 else
  select coalesce(jsonb_agg(e->>'to' order by e->>'to'),'[]'::jsonb)
   into v_targets from jsonb_array_elements(v_run.context->'graph_snapshot'->'edges') e
   where e->>'from'=v_current;
  if v_type='end' then
   v_status:='completed';v_reason:='end_reached';
  elsif jsonb_array_length(v_targets)=1 then
   v_next:=v_targets->>0;
   if coalesce(v_run.context->'visited','[]'::jsonb) ? v_next then
    v_status:='waiting';v_reason:='cycle_requires_review';
   else
    v_status:='queued';v_reason:='next_step_queued';
   end if;
  else
   v_status:='waiting';
   v_reason:=case when jsonb_array_length(v_targets)=0 then 'missing_next_step'
         else 'branch_requires_review' end;
  end if;
 end if;
 update public.automation_runtime_jobs
  set status=case when v_status='completed' then 'completed' when v_status='queued' then 'queued' else 'waiting' end,
    available_at=case when v_status='queued' then now() else available_at end,
    lease_owner=null,lease_expires_at=null,last_error_code=null,attempts=0,updated_at=now()
  where run_id=p_run;
 update public.automation_runs set
  status=case when v_status='completed' then 'completed' when v_status='queued' then 'queued' else 'waiting' end,
  completed_at=case when v_status='completed' then now() else null end,
  context=jsonb_set(jsonb_set(jsonb_set(context,
    '{current_node}',coalesce(to_jsonb(v_next),to_jsonb(v_current)),true),
    '{visited}',coalesce(context->'visited','[]'::jsonb)||to_jsonb(v_current),true),
    '{step_count}',to_jsonb(v_steps+1),true)
  where id=p_run;
 insert into public.automation_run_events(run_id,node_id,event_type,details)
 values(p_run,v_current,
  case when v_status='queued' then 'nexus.step_planned'
       when v_status='completed' then 'nexus.preview_completed'
       else 'nexus.manual_gate' end,
  jsonb_build_object('node_type',v_type,'node_kind',v_kind,
    'reason',v_reason,'attempt',v_job.attempts,'external_actions_executed',0));
 return jsonb_build_object('run_id',p_run,'status',v_status,
  'node_id',v_current,'next_node',v_next,'reason',v_reason,
  'external_actions_executed',0);
end;
$$;
revoke all on function public.landshop_nexus_worker_advance(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.landshop_nexus_worker_advance(uuid,text,text,text) to service_role;

comment on table public.automation_runtime_jobs is
 'Landshop NEXUS durable, leased, no-side-effect preview runtime. Requires separately deployed authenticated worker.';
