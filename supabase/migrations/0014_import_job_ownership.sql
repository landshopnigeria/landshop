-- Bind each private import job to its authenticated Landshop staff submitter.
create table if not exists public.property_import_jobs(
 id uuid primary key default gen_random_uuid(),
 worker_job_id uuid not null unique,
 created_by uuid not null references auth.users(id),
 object_path text not null,
 created_at timestamptz not null default now()
);
create index if not exists property_import_jobs_owner on public.property_import_jobs(created_by,created_at desc);
alter table public.property_import_jobs enable row level security;
revoke all on public.property_import_jobs from public,anon,authenticated;
grant select on public.property_import_jobs to authenticated;
drop policy if exists property_import_jobs_owner_read on public.property_import_jobs;
create policy property_import_jobs_owner_read on public.property_import_jobs for select to authenticated
 using(created_by=(select auth.uid()));

create or replace function public.landshop_import_register_job(p_job uuid,p_path text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();v_id uuid;
begin
 if v_user is null or not public.landshop_property_editor(v_user,false) then
  raise exception 'Importer permission denied';end if;
 if p_path !~ ('^'||v_user::text||'/[a-zA-Z0-9_.-]{1,160}[.](csv|xlsx|xml|pdf|docx|zip)$') then
  raise exception 'Import source does not belong to this employee';end if;
 if not exists(select 1 from storage.objects
  where bucket_id='landshop-import-uploads' and name=p_path) then
  raise exception 'Source file missing';end if;
 insert into public.property_import_jobs(worker_job_id,created_by,object_path)
 values(p_job,v_user,p_path) returning id into v_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.import.job_queued',
  jsonb_build_object('job_id',v_id,'worker_job_id',p_job,'source',p_path));
 return v_id;
end $$;
revoke all on function public.landshop_import_register_job(uuid,text) from public,anon;
grant execute on function public.landshop_import_register_job(uuid,text) to authenticated;
