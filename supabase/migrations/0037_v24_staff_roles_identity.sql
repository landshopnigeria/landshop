-- Production-applied migration landshop_v24_staff_identity_roles_governance, version 20261030014558.
-- Never run this automatically on an already-migrated production database.

-- LANDSHOP V24: staff accounts, audited role governance, KYC photo, ID, and office geofence.
alter table public.organization_members drop constraint if exists organization_members_role_check;
alter table public.organization_members add constraint organization_members_role_check
 check (role in ('owner','ceo','founder','admin','executive','operations','finance','head_finance','hr','hr_officer','technology_officer','technology_consultant','social_media_manager','customer_service_manager','department_manager','sales','legal','surveyor','realtor','marketing','staff','security','viewer','youth_corps','intern'));
create table if not exists public.landshop_staff_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 organization_id uuid not null references public.organizations(id),
 username text not null,
 requested_role text not null,
 age_at_registration smallint not null check(age_at_registration between 18 and 120),
 gender text not null default 'prefer_not_to_say' check(gender in ('female','male','non_binary','prefer_not_to_say')),
 kyc_state text not null default 'not_submitted' check(kyc_state in ('not_submitted','submitted','approved','rejected')),
 employment_state text not null default 'pending' check(employment_state in ('pending','active','suspended','ended')),
 photo_path text, photo_verified_by uuid references auth.users(id),
 photo_verified_at timestamptz, review_note text,
 staff_number text unique, joined_at timestamptz, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,username),
 constraint staff_photo_approval check (kyc_state<>'approved' or (photo_path is not null and photo_verified_by is not null and photo_verified_at is not null))
);
create index if not exists staff_review_idx on public.landshop_staff_profiles(organization_id,employment_state,kyc_state);
alter table public.landshop_staff_profiles enable row level security;
revoke all on public.landshop_staff_profiles from public,anon,authenticated;
grant select on public.landshop_staff_profiles to authenticated;
create or replace function public.landshop_is_management(p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=p_user and m.status='active' and o.kind='landshop'
 and m.role in ('owner','ceo','founder','admin','technology_officer','technology_consultant'));
$$;
revoke all on function public.landshop_is_management(uuid) from public,anon;
grant execute on function public.landshop_is_management(uuid) to authenticated;
create or replace function public.landshop_is_staff(p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=p_user and m.status='active' and o.kind='landshop');
$$;
revoke all on function public.landshop_is_staff(uuid) from public,anon;
grant execute on function public.landshop_is_staff(uuid) to authenticated;
drop policy if exists landshop_staff_profile_self_read on public.landshop_staff_profiles;
create policy landshop_staff_profile_self_read on public.landshop_staff_profiles
 for select to authenticated using (user_id=(select auth.uid()) or public.landshop_is_management((select auth.uid())));
create or replace function public.landshop_staff_onboard(p_username text,p_age integer,p_gender text,p_requested_role text)
 returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_org uuid;v_email_confirmed timestamptz;
begin
 if v_user is null then raise exception 'Sign in after confirming your email';end if;
 select email_confirmed_at into v_email_confirmed from auth.users where id=v_user;
 if v_email_confirmed is null then raise exception 'Email must be verified';end if;
 if p_username !~ '^[a-zA-Z][a-zA-Z0-9_.]{2,29}$' or p_age not between 18 and 120
 or p_gender not in ('female','male','non_binary','prefer_not_to_say')
 or p_requested_role not in ('owner','ceo','founder','admin','executive','operations','head_finance','hr_officer','technology_officer','technology_consultant','social_media_manager','customer_service_manager','department_manager','sales','legal','marketing','staff','youth_corps','intern')
 then raise exception 'Invalid registration fields';end if;
 select id into v_org from public.organizations where kind='landshop';
 if v_org is null then raise exception 'Landshop organization not configured';end if;
 -- The chosen role is a REQUEST and never establishes authorization.
 insert into public.landshop_staff_profiles(user_id,organization_id,username,age_at_registration,gender,requested_role)
 values(v_user,v_org,lower(p_username),p_age,p_gender,p_requested_role)
 on conflict(user_id) do nothing;
 if not found and not exists(select 1 from public.landshop_staff_profiles where user_id=v_user)
 then raise exception 'Staff profile unavailable';end if;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'staff.onboarding_requested',jsonb_build_object('role_requested',p_requested_role));
 return true;
end $$;
revoke all on function public.landshop_staff_onboard(text,integer,text,text) from public,anon;
grant execute on function public.landshop_staff_onboard(text,integer,text,text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('landshop-staff-private','landshop-staff-private',false,5242880,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists ls_staff_upload_own_portrait on storage.objects;
create policy ls_staff_upload_own_portrait on storage.objects for insert to authenticated
 with check (bucket_id='landshop-staff-private' and (storage.foldername(name))[1]=(select auth.uid())::text
 and (storage.foldername(name))[2]='portrait'
 and name ~ '^[0-9a-f-]{36}/portrait/[a-zA-Z0-9_-]{20,80}\.(png|jpg|jpeg|webp)$'
 and exists(select 1 from public.landshop_staff_profiles where user_id=(select auth.uid())));
drop policy if exists ls_staff_read_portrait on storage.objects;
create policy ls_staff_read_portrait on storage.objects for select to authenticated using(
 bucket_id='landshop-staff-private' and
 ((storage.foldername(name))[1]=(select auth.uid())::text or public.landshop_is_management((select auth.uid()))));
create or replace function public.landshop_staff_submit_photo(p_path text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_state text;
begin
 if v_user is null or p_path !~ ('^'||v_user::text||'/portrait/[a-zA-Z0-9_-]{20,80}\.(png|jpg|jpeg|webp)$')
 then raise exception 'Photo path must be in your private identity folder';end if;
 select employment_state into v_state from public.landshop_staff_profiles where user_id=v_user for update;
 if v_state is null or v_state in ('suspended','ended') then raise exception 'Staff registration is required';end if;
 if not exists(select 1 from storage.objects where bucket_id='landshop-staff-private' and name=p_path) then raise exception 'Portrait file is missing';end if;
 update public.landshop_staff_profiles set photo_path=p_path,kyc_state='submitted',
 photo_verified_at=null,photo_verified_by=null,review_note=null,updated_at=now()
 where user_id=v_user;
 insert into public.audit_events(actor_id,event_type,metadata) values(v_user,'staff.photo_submitted',jsonb_build_object('storage_bucket','landshop-staff-private'));
 return true;
end $$;
revoke all on function public.landshop_staff_submit_photo(text) from public,anon;
grant execute on function public.landshop_staff_submit_photo(text) to authenticated;
create or replace function public.landshop_staff_review(
 p_user uuid,p_approve boolean,p_role text,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_record public.landshop_staff_profiles%rowtype;
v_org uuid;v_new_state text;v_staff_number text;
begin
 if v_actor is null or not public.landshop_is_management(v_actor) then raise exception 'Only authorized management can review staff';end if;
 if v_actor=p_user then raise exception 'You may not approve your own staff identity';end if;
 if length(btrim(coalesce(p_reason,''))) not between 20 and 1000
 or p_role not in ('ceo','founder','admin','executive','operations','finance','head_finance','hr','hr_officer','technology_officer','technology_consultant','social_media_manager','customer_service_manager','department_manager','sales','legal','surveyor','realtor','marketing','staff','security','viewer','youth_corps','intern')
 then raise exception 'An approved role and documented decision are required';end if;
 select * into v_record from public.landshop_staff_profiles where user_id=p_user for update;
 if not found or v_record.employment_state in ('suspended','ended') then raise exception 'No reviewable staff application';end if;
 if p_approve and (v_record.photo_path is null or v_record.kyc_state<>'submitted' or not exists(
  select 1 from storage.objects where bucket_id='landshop-staff-private' and name=v_record.photo_path))
 then raise exception 'Review actual submitted portrait and identity records first';end if;
 v_org:=v_record.organization_id;
 if p_approve and p_role in ('ceo','founder','admin','technology_officer','technology_consultant')
 and not exists(select 1 from public.organization_members where user_id=v_actor and role='owner' and status='active'
 and organization_id=v_org) then raise exception 'Only the active owner may grant a Command Center role';end if;
 v_new_state:=case when p_approve then 'active' else 'pending' end;
 v_staff_number:=coalesce(v_record.staff_number,'LS-'||upper(left(replace(p_user::text,'-',''),12)));
 update public.landshop_staff_profiles set
 kyc_state=case when p_approve then 'approved' else 'rejected' end,
 employment_state=v_new_state,photo_verified_by=case when p_approve then v_actor else null end,
 photo_verified_at=case when p_approve then now() else null end,
 review_note=left(btrim(p_reason),1000),
 staff_number=case when p_approve then v_staff_number else staff_number end,
 joined_at=case when p_approve then coalesce(joined_at,now()) else joined_at end,
 updated_at=now() where user_id=p_user;
 if p_approve then
 insert into public.organization_members(organization_id,user_id,role,status,invited_by)
 values(v_org,p_user,p_role,'active',v_actor)
 on conflict(organization_id,user_id) do update set role=excluded.role,status='active',invited_by=v_actor;
 end if;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_actor,'staff.identity_reviewed',jsonb_build_object('staff_id',p_user,'approved',p_approve,'role',p_role,'reason',btrim(p_reason)));
 return true;
end $$;
revoke all on function public.landshop_staff_review(uuid,boolean,text,text) from public,anon;
grant execute on function public.landshop_staff_review(uuid,boolean,text,text) to authenticated;
create or replace function public.landshop_staff_revoke(p_user uuid,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_role text;
begin
 if v_actor is null or not public.landshop_is_management(v_actor) or v_actor=p_user then raise exception 'Authorized management action required';end if;
 if length(btrim(coalesce(p_reason,'')))<20 then raise exception 'Document the reason';end if;
 select m.role into v_role from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=p_user and m.status='active' and o.kind='landshop';
 if v_role is null or v_role='owner' then raise exception 'Cannot revoke owner or unknown account';end if;
 if v_role in ('ceo','founder','admin','technology_officer','technology_consultant')
 and not exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=v_actor and m.role='owner' and m.status='active' and o.kind='landshop') then raise exception 'Only owner may revoke Command Center access';end if;
 update public.organization_members set status='revoked' where user_id=p_user and status='active'
 and organization_id in(select id from public.organizations where kind='landshop');
 update public.landshop_staff_profiles set employment_state='suspended',updated_at=now() where user_id=p_user;
 insert into public.audit_events(actor_id,event_type,metadata) values(v_actor,'staff.access_revoked',jsonb_build_object('staff_id',p_user,'reason',btrim(p_reason)));
 return true;
end $$;
revoke all on function public.landshop_staff_revoke(uuid,text) from public,anon;
grant execute on function public.landshop_staff_revoke(uuid,text) to authenticated;

