-- Application submission, product-specific drafts and Seven Cities allocation coordination.
-- Seven Cities is an allocation PROGRAMME; named communities and approved allottees must come from verified records.
create table if not exists public.application_events(
 id bigint generated always as identity primary key,
 application_id uuid not null references public.applications(id) on delete cascade,
 actor_id uuid not null references auth.users(id),
 action text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.allocation_programmes(
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 status text not null default 'planning' check(status in ('planning','review','approved','in_progress','completed','archived')),
 created_at timestamptz not null default now()
);
create table if not exists public.allocation_sites(
 id uuid primary key default gen_random_uuid(),
 programme_id uuid not null references public.allocation_programmes(id),
 estate_id uuid references public.estates(id),
 name text not null,
 survey_layout_path text,
 survey_status text not null default 'awaiting' check(survey_status in ('awaiting','submitted','verified')),
 created_at timestamptz not null default now()
);
create table if not exists public.allocation_cases(
 id uuid primary key default gen_random_uuid(),
 programme_id uuid not null references public.allocation_programmes(id),
 site_id uuid references public.allocation_sites(id),
 applicant_id uuid not null references auth.users(id),
 reference text not null unique,
 eligibility text not null default 'pending' check(eligibility in ('pending','eligible','ineligible','hold')),
 cx_cleared boolean not null default false,
 finance_cleared boolean not null default false,
 legal_cleared boolean not null default false,
 survey_cleared boolean not null default false,
 allocation_type text not null default 'provisional' check(allocation_type in ('provisional','permanent')),
 peg_identifier text,
 invite_status text not null default 'not_sent' check(invite_status in ('not_sent','queued','sent','confirmed','failed')),
 status text not null default 'review' check(status in ('review','ready','allocated','paused','cancelled')),
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists allocation_cases_programme_idx on public.allocation_cases(programme_id,status);
create table if not exists public.allocation_events(
 id bigint generated always as identity primary key,
 case_id uuid not null references public.allocation_cases(id),
 actor_id uuid not null references auth.users(id),
 action text not null,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.application_events enable row level security;
alter table public.allocation_programmes enable row level security;
alter table public.allocation_sites enable row level security;
alter table public.allocation_cases enable row level security;
alter table public.allocation_events enable row level security;
revoke all on public.application_events,public.allocation_programmes,public.allocation_sites,
 public.allocation_cases,public.allocation_events from anon,authenticated;
grant select on public.application_events,public.allocation_programmes,public.allocation_sites,
 public.allocation_cases,public.allocation_events to authenticated;
create policy application_events_self on public.application_events for select to authenticated
 using(exists(select 1 from public.applications a where a.id=application_id and a.applicant_id=(select auth.uid())));
create policy allocation_cases_self on public.allocation_cases for select to authenticated
 using(applicant_id=(select auth.uid()));
create policy allocation_cases_staff on public.allocation_cases for select to authenticated
 using(public.landshop_property_editor((select auth.uid()),true));
create policy allocation_sites_staff on public.allocation_sites for select to authenticated
 using(public.landshop_property_editor((select auth.uid()),true));
create policy allocation_programmes_staff on public.allocation_programmes for select to authenticated
 using(public.landshop_property_editor((select auth.uid()),true));
create policy allocation_events_staff on public.allocation_events for select to authenticated
 using(public.landshop_property_editor((select auth.uid()),true));
create policy allocation_events_self on public.allocation_events for select to authenticated
 using(exists(select 1 from public.allocation_cases c where c.id=case_id and c.applicant_id=(select auth.uid())));

create or replace function public.landshop_submit_application(p_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();v_app public.applications%rowtype;
begin
 if v_user is null then raise exception 'Authentication required';end if;
 select * into v_app from public.applications where id=p_id for update;
 if not found or v_app.applicant_id<>v_user or v_app.status<>'draft' then
   raise exception 'Draft not found or not owned by applicant';end if;
 if jsonb_typeof(v_app.answers)<>'object'
 or coalesce(length(btrim(v_app.answers->>'first_name')),0)<2
 or coalesce(length(btrim(v_app.answers->>'last_name')),0)<2
 or coalesce(length(btrim(v_app.answers->>'email')),0)<5
 or coalesce(v_app.answers->>'declaration_accepted','false')<>'true' then
   raise exception 'Required personal details and declaration are missing';end if;
 if v_app.kind in ('beta_mortgage','mortgage_xtra') and
 (coalesce(v_app.answers->>'employment_status','')='' or
  coalesce(v_app.answers->>'property_choice','')='') then
   raise exception 'Mortgage pre-qualification requires employment and property choice';end if;
 update public.applications set status='submitted' where id=p_id;
 insert into public.application_events(application_id,actor_id,action)
 values(p_id,v_user,'submitted');
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'application.submitted',jsonb_build_object('application_id',p_id,'kind',v_app.kind));
 insert into public.notification_outbox(event_type,user_id,payload)
 values('application.submitted',v_user,jsonb_build_object('application_id',p_id,'kind',v_app.kind));
 return p_id;
end $$;
revoke all on function public.landshop_submit_application(uuid) from public,anon;
grant execute on function public.landshop_submit_application(uuid) to authenticated;

create or replace function public.landshop_allocation_ready(p_case uuid,p_reason text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();v_case public.allocation_cases%rowtype;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then
   raise exception 'Authorized Landshop reviewer required';end if;
 if char_length(btrim(coalesce(p_reason,'')))<15 then raise exception 'Review reason required';end if;
 select * into v_case from public.allocation_cases where id=p_case for update;
 if not found then raise exception 'Allocation case missing';end if;
 if v_case.eligibility<>'eligible' or
 not (v_case.cx_cleared and v_case.finance_cleared and v_case.legal_cleared and v_case.survey_cleared) then
   raise exception 'CX, Finance, Legal, Surveyor and eligibility clearance all required';end if;
 if v_case.status<>'review' then raise exception 'Invalid allocation state';end if;
 update public.allocation_cases set status='ready',approved_by=v_user,approved_at=now() where id=p_case;
 insert into public.allocation_events(case_id,actor_id,action,details)
 values(p_case,v_user,'ready_for_allocation',jsonb_build_object('reason',btrim(p_reason)));
 return true;
end $$;
revoke all on function public.landshop_allocation_ready(uuid,text) from public,anon;
grant execute on function public.landshop_allocation_ready(uuid,text) to authenticated;
