-- Landshop private project-photo evidence intake.
-- Historical project identification is not evidence of active inventory.
-- Owner originals stay private; independent review never auto-publishes media.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('landshop-project-evidence','landshop-project-evidence',false,10485760,
 array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,
 allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.landshop_project_photo_evidence (
 id uuid primary key default gen_random_uuid(),
 project_slug text not null check(project_slug in
  ('green-island','merit-park','maiyegun-beach-estate','famous-gardens')),
 object_path text not null unique,
 photographer text not null check(char_length(photographer) between 3 and 180),
 captured_on date not null,
 location_note text not null check(char_length(location_note) between 8 and 260),
 provenance_note text not null check(char_length(provenance_note) between 30 and 1800),
 rights_basis text not null check(rights_basis in
  ('landshop_owned','owner_licensed','commissioned_with_release')),
 rights_reference text not null check(char_length(rights_reference) between 8 and 300),
 rights_attested boolean not null default false check(rights_attested),
 uploaded_by uuid not null references auth.users(id),
 uploaded_at timestamptz not null default now(),
 status text not null default 'pending' check(status in ('pending','verified','rejected')),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 review_note text,
 constraint landshop_photo_reviewer_separation check(reviewed_by is null or reviewed_by<>uploaded_by),
 constraint landshop_photo_review_complete check(
  (status='pending' and reviewed_by is null and reviewed_at is null)
  or (status in ('verified','rejected') and reviewed_by is not null
   and reviewed_at is not null and char_length(review_note)>=30))
);
create index if not exists landshop_project_photo_status_index
 on public.landshop_project_photo_evidence(project_slug,status,uploaded_at desc);
alter table public.landshop_project_photo_evidence enable row level security;
revoke all on public.landshop_project_photo_evidence from public,anon,authenticated;
grant select on public.landshop_project_photo_evidence to authenticated;

drop policy if exists landshop_project_photo_staff_read on public.landshop_project_photo_evidence;
create policy landshop_project_photo_staff_read on public.landshop_project_photo_evidence
 for select to authenticated using (
  (uploaded_by=(select auth.uid()) and public.landshop_staff_can_work((select auth.uid())))
  or public.landshop_is_management((select auth.uid()))
 );

-- Only the uploader may privately read their original; authorized managers may
-- inspect originals for a separate review. No public/anonymous access.
drop policy if exists landshop_project_photo_original_upload on storage.objects;
create policy landshop_project_photo_original_upload on storage.objects
 for insert to authenticated with check (
 bucket_id='landshop-project-evidence'
 and public.landshop_staff_can_work((select auth.uid()))
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and (storage.foldername(name))[2] in
  ('green-island','merit-park','maiyegun-beach-estate','famous-gardens')
 and name ~ '^[0-9a-f-]{36}/(green-island|merit-park|maiyegun-beach-estate|famous-gardens)/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
);
drop policy if exists landshop_project_photo_original_read on storage.objects;
create policy landshop_project_photo_original_read on storage.objects
 for select to authenticated using (
 bucket_id='landshop-project-evidence'
 and (
  ((storage.foldername(name))[1]=(select auth.uid())::text
   and public.landshop_staff_can_work((select auth.uid())))
  or public.landshop_is_management((select auth.uid()))
 )
);

create or replace function public.landshop_project_photo_submit(
 p_project text,p_path text,p_photographer text,p_captured_on date,
 p_location text,p_provenance text,p_rights_basis text,
 p_rights_reference text,p_attested boolean
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_id uuid;v_path_pattern text;
begin
 if v_user is null or not public.landshop_staff_can_work(v_user)
 then raise exception 'Verified active staff account required';end if;
 if p_project not in ('green-island','merit-park','maiyegun-beach-estate','famous-gardens')
 then raise exception 'Unknown historical project';end if;
 v_path_pattern:='^'||v_user::text||'/'||p_project||
 '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|jpeg|png|webp)$';
 if p_path is null or p_path !~ v_path_pattern then raise exception 'Invalid private photo path';end if;
 if p_captured_on is null or p_captured_on>current_date or p_captured_on<date '1990-01-01'
 then raise exception 'Enter a credible date for the original photograph';end if;
 if char_length(btrim(coalesce(p_photographer,''))) not between 3 and 180
 or char_length(btrim(coalesce(p_location,''))) not between 8 and 260
 or char_length(btrim(coalesce(p_provenance,''))) not between 30 and 1800
 or char_length(btrim(coalesce(p_rights_reference,''))) not between 8 and 300
 then raise exception 'Photograph provenance and permission evidence are required';end if;
 if p_rights_basis not in ('landshop_owned','owner_licensed','commissioned_with_release')
 or p_attested is distinct from true then raise exception 'Publication rights must be attested';end if;
 if not exists(select 1 from storage.objects
  where bucket_id='landshop-project-evidence' and name=p_path)
 then raise exception 'Private photo upload not found';end if;
 insert into public.landshop_project_photo_evidence
 (project_slug,object_path,photographer,captured_on,location_note,provenance_note,
  rights_basis,rights_reference,rights_attested,uploaded_by)
 values(p_project,p_path,btrim(p_photographer),p_captured_on,btrim(p_location),
  btrim(p_provenance),p_rights_basis,btrim(p_rights_reference),true,v_user)
 returning id into v_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'project.photo.submitted',jsonb_build_object('project',p_project,'photo_id',v_id));
 return v_id;
end $$;
revoke all on function public.landshop_project_photo_submit(text,text,text,date,text,text,text,text,boolean) from public,anon;
grant execute on function public.landshop_project_photo_submit(text,text,text,date,text,text,text,text,boolean) to authenticated;

create or replace function public.landshop_project_photo_review(
 p_photo uuid,p_approve boolean,p_review_note text
) returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_photo public.landshop_project_photo_evidence%rowtype;
begin
 if v_user is null or not public.landshop_is_management(v_user)
 then raise exception 'Verified manager required';end if;
 if char_length(btrim(coalesce(p_review_note,''))) not between 30 and 1200
 then raise exception 'Document identity, provenance and publication rights in at least 30 characters';end if;
 select * into v_photo from public.landshop_project_photo_evidence
 where id=p_photo for update;
 if not found or v_photo.status<>'pending' then raise exception 'Photo not awaiting review';end if;
 if v_photo.uploaded_by=v_user then raise exception 'A second authorized person must review the photo';end if;
 if not exists(select 1 from storage.objects where
  bucket_id='landshop-project-evidence' and name=v_photo.object_path)
 then raise exception 'Original photo missing';end if;
 update public.landshop_project_photo_evidence
 set status=case when p_approve then 'verified' else 'rejected' end,
 reviewed_by=v_user,reviewed_at=now(),review_note=btrim(p_review_note)
 where id=p_photo;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'project.photo.reviewed',jsonb_build_object(
  'photo_id',p_photo,'project',v_photo.project_slug,'approved',p_approve));
 return true;
end $$;
revoke all on function public.landshop_project_photo_review(uuid,boolean,text) from public,anon;
grant execute on function public.landshop_project_photo_review(uuid,boolean,text) to authenticated;
