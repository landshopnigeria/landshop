-- Production-applied migration landshop_v24_attendance_tasks_daily_reports_scoring, version 20261030014726.
-- Never run this automatically on an already-migrated production database.

-- V24 attendance, site geofencing, tasks, activities and human-reviewed metrics.
create table if not exists public.landshop_office_locations(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 name text not null, address text not null, location extensions.geography(Point,4326) not null,
 radius_m integer not null default 150 check(radius_m between 30 and 1000),
 verified_by uuid not null references auth.users(id), verified_at timestamptz not null default now(),
 active boolean not null default true);
alter table public.landshop_office_locations enable row level security;
revoke all on public.landshop_office_locations from public,anon,authenticated;
grant select on public.landshop_office_locations to authenticated;
create policy staff_office_locations on public.landshop_office_locations for select to authenticated
 using(public.landshop_is_staff((select auth.uid())));
create or replace function public.landshop_office_register(p_name text,p_address text,p_lat double precision,p_lng double precision,p_radius integer,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_org uuid;v_id uuid;
begin
 if v_user is null or not public.landshop_is_management(v_user) then raise exception 'Command Center authorization required';end if;
 if length(btrim(coalesce(p_name,''))) not between 4 and 120 or length(btrim(coalesce(p_address,'')))<20
 or p_lat not between -90 and 90 or p_lng not between -180 and 180 or p_radius not between 30 and 1000
 or length(btrim(coalesce(p_reason,'')))<20 then raise exception 'Verified office details and justification required';end if;
 select id into v_org from public.organizations where kind='landshop';
 insert into public.landshop_office_locations(organization_id,name,address,location,radius_m,verified_by)
 values(v_org,btrim(p_name),btrim(p_address),extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng,p_lat),4326)::extensions.geography,p_radius,v_user)
 returning id into v_id;
 insert into public.audit_events(actor_id,event_type,metadata) values(v_user,'staff.verified_office_registered',jsonb_build_object('office_id',v_id,'reason',btrim(p_reason)));
 return v_id;
end $$;
revoke all on function public.landshop_office_register(text,text,double precision,double precision,integer,text) from public,anon;
grant execute on function public.landshop_office_register(text,text,double precision,double precision,integer,text) to authenticated;
create or replace function public.landshop_staff_clock(p_action text,p_lat double precision,p_lng double precision,p_accuracy numeric,p_consent boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_org uuid;v_prev text;v_when timestamptz;v_id uuid;
v_loc extensions.geography;v_label text;v_office record;v_minutes integer;v_error text;
begin
 if v_user is null or not public.landshop_is_staff(v_user)
 or not exists(select 1 from public.landshop_staff_profiles where user_id=v_user and kyc_state='approved' and employment_state='active')
 then raise exception 'Active verified Landshop staff required';end if;
 if p_action not in ('clock_in','clock_out') or p_consent is distinct from true then raise exception 'Explicit location consent is required at the clock action';end if;
 if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180
 or p_accuracy is null or p_accuracy<0 or p_accuracy>5000 then raise exception 'Reliable device GPS coordinates are required';end if;
 select organization_id into v_org from public.landshop_staff_profiles where user_id=v_user;
 perform pg_advisory_xact_lock(hashtext('ls_clock:'||v_user::text));
 select event_type,recorded_at into v_prev,v_when from public.attendance_events
 where staff_id=v_user order by recorded_at desc,id desc limit 1;
 if (p_action='clock_in' and v_prev='clock_in') or (p_action='clock_out' and v_prev is distinct from 'clock_in')
 then raise exception 'Clock sequence is invalid: check last clock status';end if;
 if v_when is not null and v_when>now()-interval '30 seconds' then raise exception 'Duplicate clock action; try later';end if;
 v_loc:=extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng,p_lat),4326)::extensions.geography;
 select l.id,l.name,l.address into v_office from public.landshop_office_locations l
 where l.organization_id=v_org and l.active=true and
 extensions.ST_DWithin(l.location,v_loc,l.radius_m+least(p_accuracy::double precision,100))
 order by extensions.ST_Distance(l.location,v_loc) limit 1;
 v_label:=case when v_office.id is not null then v_office.name else 'External location (GPS recorded; address unverified)' end;
 insert into public.attendance_events(staff_id,organization_id,event_type,location,location_accuracy_m,location_label,permission_granted,source,status)
 values(v_user,v_org,p_action,v_loc,p_accuracy,v_label,true,'web','recorded') returning id into v_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'staff.attendance_clocked',jsonb_build_object('clock_event_id',v_id,'action',p_action,'place',v_label,'accuracy_m',p_accuracy));
 return jsonb_build_object('id',v_id,'action',p_action,'time',now(),'location_label',v_label,
 'latitude',p_lat,'longitude',p_lng,'accuracy_m',p_accuracy,
 'maps_url','https://www.google.com/maps/search/?api=1&query='||p_lat::text||','||p_lng::text,
 'geofence_match',v_office.id is not null,'warning','Browser coordinates may be spoofed; records require periodic management review');
end $$;
revoke all on function public.landshop_staff_clock(text,double precision,double precision,numeric,boolean) from public,anon;
grant execute on function public.landshop_staff_clock(text,double precision,double precision,numeric,boolean) to authenticated;
-- Separate access checks allow staff personal records, managers management views.
drop policy if exists landshop_attendance_management_read on public.attendance_events;
create policy landshop_attendance_management_read on public.attendance_events for select to authenticated
 using (public.landshop_is_management((select auth.uid())));
alter table public.staff_tasks add column if not exists planned_minutes integer check(planned_minutes between 5 and 20160);
alter table public.staff_tasks add column if not exists delay_allowance_minutes integer not null default 0 check(delay_allowance_minutes between 0 and 10080);
alter table public.staff_tasks add column if not exists expected_outcome text;
alter table public.staff_tasks add column if not exists viewed_at timestamptz;
alter table public.staff_tasks add column if not exists started_at timestamptz;
alter table public.staff_tasks add column if not exists submitted_at timestamptz;
alter table public.staff_tasks add column if not exists reviewed_at timestamptz;
alter table public.staff_tasks add column if not exists review_comment text;
alter table public.staff_tasks add column if not exists assignee_report text;
create index if not exists staff_tasks_assignee_due_idx on public.staff_tasks(assignee_id,due_at);
drop policy if exists landshop_task_management_read on public.staff_tasks;
create policy landshop_task_management_read on public.staff_tasks for select to authenticated
 using (public.landshop_is_management((select auth.uid())));
create table if not exists public.landshop_task_events(
 id bigint generated always as identity primary key,task_id uuid not null references public.staff_tasks(id) on delete cascade,
 actor_id uuid not null references auth.users(id),event_type text not null,
 note text,created_at timestamptz not null default now());
alter table public.landshop_task_events enable row level security;
revoke all on public.landshop_task_events from public,anon,authenticated;
grant select on public.landshop_task_events to authenticated;
create policy ls_task_events_read on public.landshop_task_events for select to authenticated
 using(exists(select 1 from public.staff_tasks t where t.id=task_id and (t.assignee_id=(select auth.uid()) or public.landshop_is_management((select auth.uid())))));
create table if not exists public.landshop_task_work_sessions(
 id uuid primary key default gen_random_uuid(),task_id uuid not null references public.staff_tasks(id),
 staff_id uuid not null references auth.users(id),started_at timestamptz not null default now(),
 ended_at timestamptz,check(ended_at is null or ended_at>=started_at));
create unique index if not exists staff_one_open_task_session on public.landshop_task_work_sessions(staff_id) where ended_at is null;
alter table public.landshop_task_work_sessions enable row level security;
revoke all on public.landshop_task_work_sessions from public,anon,authenticated;
grant select on public.landshop_task_work_sessions to authenticated;
create policy ls_work_sessions_read on public.landshop_task_work_sessions for select to authenticated
 using(staff_id=(select auth.uid()) or public.landshop_is_management((select auth.uid())));
create table if not exists public.landshop_staff_daily_reports(
 id uuid primary key default gen_random_uuid(),staff_id uuid not null references auth.users(id),
 report_date date not null,summary text not null,blockers text,created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),unique(staff_id,report_date));
alter table public.landshop_staff_daily_reports enable row level security;
revoke all on public.landshop_staff_daily_reports from public,anon,authenticated;
grant select on public.landshop_staff_daily_reports to authenticated;
create policy ls_daily_reports_read on public.landshop_staff_daily_reports for select to authenticated
 using(staff_id=(select auth.uid()) or public.landshop_is_management((select auth.uid())));
create or replace function public.landshop_staff_task_assign(p_assignee uuid,p_title text,p_details text,p_minutes integer,p_delay integer,p_due timestamptz)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_org uuid;v_id uuid;
begin
 if v_actor is null or not public.landshop_is_management(v_actor) then raise exception 'Manager authorization required';end if;
 if length(btrim(coalesce(p_title,''))) not between 5 and 180 or length(coalesce(p_details,''))>5000
 or p_minutes not between 5 and 20160 or p_delay not between 0 and 10080 or
 p_due is null or p_due<=now() or p_due>now()+interval '366 days'
 then raise exception 'Valid task title, estimated duration, delay allowance and future deadline required';end if;
 select organization_id into v_org from public.organizations where kind='landshop';
 if not exists(select 1 from public.organization_members where organization_id=v_org and user_id=p_assignee and status='active')
 then raise exception 'Assignee is not an active Landshop team member';end if;
 insert into public.staff_tasks(organization_id,assignee_id,assigned_by,title,details,starts_at,due_at,status,planned_minutes,delay_allowance_minutes,expected_outcome)
 values(v_org,p_assignee,v_actor,btrim(p_title),left(p_details,5000),now(),p_due,'assigned',p_minutes,p_delay,left(p_details,2000)) returning id into v_id;
 insert into public.landshop_task_events(task_id,actor_id,event_type,note) values(v_id,v_actor,'assigned','Planned '||p_minutes||' minutes; allowed delay '||p_delay||' minutes');
 insert into public.audit_events(actor_id,event_type,metadata) values(v_actor,'staff.task_assigned',jsonb_build_object('task_id',v_id,'assignee_id',p_assignee,'planned_minutes',p_minutes));
 return v_id;
end $$;
revoke all on function public.landshop_staff_task_assign(uuid,text,text,integer,integer,timestamptz) from public,anon;
grant execute on function public.landshop_staff_task_assign(uuid,text,text,integer,integer,timestamptz) to authenticated;
create or replace function public.landshop_staff_task_action(p_task uuid,p_action text,p_note text default '')
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_task public.staff_tasks%rowtype;v_open uuid;
begin
 if v_user is null then raise exception 'Sign-in required';end if;
 perform pg_advisory_xact_lock(hashtext('ls_task:'||v_user::text));
 select * into v_task from public.staff_tasks where id=p_task for update;
 if not found or v_task.assignee_id<>v_user then raise exception 'Not your assigned task';end if;
 if p_action not in ('view','start','pause','submit','blocked') then raise exception 'Unknown action';end if;
 if p_action='view' then
  update public.staff_tasks set viewed_at=coalesce(viewed_at,now()) where id=p_task;
 elsif p_action='start' then
  if v_task.status not in ('assigned','in_progress','returned','blocked') then raise exception 'Task is not startable';end if;
  insert into public.landshop_task_work_sessions(task_id,staff_id) values(p_task,v_user);
  update public.staff_tasks set status='in_progress',viewed_at=coalesce(viewed_at,now()),started_at=coalesce(started_at,now()) where id=p_task;
 elsif p_action='pause' then
  update public.landshop_task_work_sessions set ended_at=now() where staff_id=v_user and task_id=p_task and ended_at is null;
 elsif p_action='blocked' then
  if length(btrim(coalesce(p_note,'')))<10 then raise exception 'Describe the blocker';end if;
  update public.landshop_task_work_sessions set ended_at=now() where staff_id=v_user and task_id=p_task and ended_at is null;
  update public.staff_tasks set status='blocked',assignee_report=left(p_note,5000) where id=p_task;
 elsif p_action='submit' then
  if v_task.status not in ('assigned','in_progress','returned','blocked') or length(btrim(coalesce(p_note,'')))<15
  then raise exception 'A 15-character completion report is required';end if;
  update public.landshop_task_work_sessions set ended_at=now() where staff_id=v_user and task_id=p_task and ended_at is null;
  update public.staff_tasks set status='submitted',submitted_at=now(),assignee_report=left(p_note,5000) where id=p_task;
 end if;
 insert into public.landshop_task_events(task_id,actor_id,event_type,note) values(p_task,v_user,p_action,left(p_note,5000));
 return true;
end $$;
revoke all on function public.landshop_staff_task_action(uuid,text,text) from public,anon;
grant execute on function public.landshop_staff_task_action(uuid,text,text) to authenticated;
create or replace function public.landshop_staff_task_review(p_task uuid,p_approve boolean,p_score integer,p_comment text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_task public.staff_tasks%rowtype;
begin
 if v_actor is null or not public.landshop_is_management(v_actor) then raise exception 'Management review required';end if;
 if p_score not between 0 and 100 or length(btrim(coalesce(p_comment,'')))<20 then raise exception 'An evidence-based score and 20-character review are required';end if;
 select * into v_task from public.staff_tasks where id=p_task for update;
 if not found or v_task.status<>'submitted' or v_actor=v_task.assignee_id then raise exception 'Task not eligible for independent review';end if;
 update public.staff_tasks set status=case when p_approve then 'accepted' else 'returned' end,
 score=case when p_approve then p_score else null end,scored_by=case when p_approve then v_actor else null end,
 reviewed_at=now(),review_comment=left(p_comment,2000) where id=p_task;
 insert into public.landshop_task_events(task_id,actor_id,event_type,note) values(p_task,v_actor,case when p_approve then 'accepted' else 'returned' end,left(p_comment,2000));
 insert into public.audit_events(actor_id,event_type,metadata) values(v_actor,'staff.task_review',jsonb_build_object('task_id',p_task,'score',p_score,'approved',p_approve));
 return true;
end $$;
revoke all on function public.landshop_staff_task_review(uuid,boolean,integer,text) from public,anon;
grant execute on function public.landshop_staff_task_review(uuid,boolean,integer,text) to authenticated;
create or replace function public.landshop_staff_daily_report(p_summary text,p_blockers text default '')
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_day date:=(now() at time zone 'Africa/Lagos')::date;
begin
 if v_user is null or not public.landshop_is_staff(v_user) then raise exception 'Active staff only';end if;
 if length(btrim(coalesce(p_summary,''))) not between 20 and 6000 or length(coalesce(p_blockers,''))>3000 then raise exception 'Daily report should contain 20-6000 characters';end if;
 insert into public.landshop_staff_daily_reports(staff_id,report_date,summary,blockers)
 values(v_user,v_day,btrim(p_summary),left(p_blockers,3000))
 on conflict(staff_id,report_date) do update set summary=excluded.summary,blockers=excluded.blockers,updated_at=now();
 insert into public.audit_events(actor_id,event_type,metadata) values(v_user,'staff.daily_report_submitted',jsonb_build_object('date',v_day));
 return true;
end $$;
revoke all on function public.landshop_staff_daily_report(text,text) from public,anon;
grant execute on function public.landshop_staff_daily_report(text,text) to authenticated;
-- Readable time and GPS coordinates are exposed through a constrained personal/management RPC.
create or replace function public.landshop_attendance_history(p_user uuid)
returns table(id uuid,action text,occurred_at timestamptz,place text,latitude double precision,longitude double precision,accuracy_m numeric)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or (auth.uid()<>p_user and not public.landshop_is_management(auth.uid()))
 then raise exception 'Attendance privacy restriction';end if;
 return query select a.id,a.event_type,a.recorded_at,a.location_label,
 extensions.ST_Y(a.location::extensions.geometry),extensions.ST_X(a.location::extensions.geometry),a.location_accuracy_m
 from public.attendance_events a where a.staff_id=p_user order by a.recorded_at desc limit 120;
end $$;
revoke all on function public.landshop_attendance_history(uuid) from public,anon;
grant execute on function public.landshop_attendance_history(uuid) to authenticated;

