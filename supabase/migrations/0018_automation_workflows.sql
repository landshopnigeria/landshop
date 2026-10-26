-- Versioned automation graph, review-locked publication and run evidence.
create table if not exists public.automation_workflows(
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 name text not null,
 description text,
 version integer not null default 1,
 state text not null default 'draft' check(state in ('draft','review','active','paused','archived')),
 draft_graph jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
 active_graph jsonb,
 edited_by uuid references auth.users(id),
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.automation_runs(
 id uuid primary key default gen_random_uuid(),
 workflow_id uuid not null references public.automation_workflows(id),
 version integer not null,
 event_id uuid references public.notification_outbox(id),
 status text not null default 'queued' check(status in ('queued','running','waiting','completed','failed','cancelled')),
 started_at timestamptz not null default now(),
 completed_at timestamptz,
 context jsonb not null default '{}'::jsonb,
 error_code text
);
create index if not exists automation_runs_status_idx on public.automation_runs(status,started_at desc);
create table if not exists public.automation_run_events(
 id bigint generated always as identity primary key,
 run_id uuid not null references public.automation_runs(id),
 node_id text not null,
 event_type text not null,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.automation_workflows enable row level security;
alter table public.automation_runs enable row level security;
alter table public.automation_run_events enable row level security;
revoke all on public.automation_workflows,public.automation_runs,public.automation_run_events from anon,authenticated;
grant select on public.automation_workflows,public.automation_runs,public.automation_run_events to authenticated;
create policy automation_staff_read on public.automation_workflows for select to authenticated
 using(public.landshop_property_editor((select auth.uid()),true));
create policy automation_runs_staff_read on public.automation_runs for select to authenticated
 using(public.landshop_property_editor((select auth.uid()),true));
create policy automation_events_staff_read on public.automation_run_events for select to authenticated
 using(public.landshop_property_editor((select auth.uid()),true));

create or replace function public.landshop_automation_save(
 p_workflow uuid,p_graph jsonb,p_expected_version integer)
returns integer language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();v_old public.automation_workflows%rowtype;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then
   raise exception 'Workflow editing permission denied';end if;
 if jsonb_typeof(p_graph)<>'object' or
 jsonb_typeof(p_graph->'nodes')<>'array' or jsonb_typeof(p_graph->'edges')<>'array'
 or jsonb_array_length(p_graph->'nodes')>100 or jsonb_array_length(p_graph->'edges')>160
 or pg_column_size(p_graph)>65536 then
   raise exception 'Invalid or oversized workflow graph';end if;
 if exists(select 1 from jsonb_array_elements(p_graph->'nodes') n
 where n->>'type' not in ('trigger','condition','notification','wait','approval','task','webhook','end')
 or length(coalesce(n->>'id',''))>80 or length(coalesce(n->>'id',''))<1) then
   raise exception 'Unsupported or malformed automation node';end if;
 select * into v_old from public.automation_workflows where id=p_workflow for update;
 if not found or v_old.state not in ('draft','review','paused') then
   raise exception 'Workflow is not editable';end if;
 if v_old.version<>p_expected_version then raise exception 'Another editor updated this workflow';end if;
 update public.automation_workflows
 set draft_graph=p_graph,version=version+1,state='draft',edited_by=v_user,approved_by=null,
 approved_at=null,updated_at=now() where id=p_workflow;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'automation.graph_saved',jsonb_build_object('workflow_id',p_workflow,'version',p_expected_version+1));
 return p_expected_version+1;
end $$;
revoke all on function public.landshop_automation_save(uuid,jsonb,integer) from public,anon;
grant execute on function public.landshop_automation_save(uuid,jsonb,integer) to authenticated;

-- Historical diagram templates stored as DRAFTS, not active communications.
insert into public.automation_workflows(slug,name,description,draft_graph)
values
('mortgage-xtra','Mortgage Xtra Client Communication',
 'Application, loan calculation, inspection, equity, keys and long-term servicing.',
 '{"nodes":[{"id":"x1","type":"trigger","label":"Online Application","x":60,"y":210},{"id":"x2","type":"task","label":"Loan Calculation","x":255,"y":210},{"id":"x3","type":"condition","label":"Success / Failed","x":450,"y":210},{"id":"x4","type":"notification","label":"Application Result","x":645,"y":210},{"id":"x5","type":"task","label":"Customer Service","x":840,"y":210},{"id":"x6","type":"task","label":"Inspection","x":1035,"y":210},{"id":"x7","type":"task","label":"Business Development","x":1230,"y":210},{"id":"x8","type":"approval","label":"Equity Confirmation","x":1425,"y":210},{"id":"x9","type":"end","label":"Key Handover","x":1620,"y":210}],"edges":[{"from":"x1","to":"x2"},{"from":"x2","to":"x3"},{"from":"x3","to":"x4"},{"from":"x4","to":"x5"},{"from":"x5","to":"x6"},{"from":"x6","to":"x7"},{"from":"x7","to":"x8"},{"from":"x8","to":"x9"}]}'::jsonb),
('beta-mortgage','Beta Mortgage Client Communication',
 'Pre-application, qualification, mortgage loan and servicing communications.',
 '{"nodes":[{"id":"b1","type":"trigger","label":"Pre-Application","x":50,"y":210},{"id":"b2","type":"task","label":"Loan Calculation","x":245,"y":210},{"id":"b3","type":"condition","label":"Success / Failed","x":440,"y":210},{"id":"b4","type":"notification","label":"Application Result","x":635,"y":210},{"id":"b5","type":"task","label":"Business Development","x":830,"y":210},{"id":"b6","type":"approval","label":"Full Qualification","x":1025,"y":210},{"id":"b7","type":"task","label":"Loan Issued to Developer","x":1220,"y":210},{"id":"b8","type":"wait","label":"Recurring Loan Notices","x":1415,"y":210},{"id":"b9","type":"end","label":"Servicing","x":1610,"y":210}],"edges":[{"from":"b1","to":"b2"},{"from":"b2","to":"b3"},{"from":"b3","to":"b4"},{"from":"b4","to":"b5"},{"from":"b5","to":"b6"},{"from":"b6","to":"b7"},{"from":"b7","to":"b8"},{"from":"b8","to":"b9"}]}'::jsonb)
on conflict(slug) do nothing;
