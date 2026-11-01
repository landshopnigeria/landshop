-- Applied to production Supabase as migration 20261101154242.
-- Never grant automatic staff identity approval from an unverified portrait.
alter table public.landshop_staff_profiles
 add column if not exists verification_provider text,
 add column if not exists verification_session_id uuid;
alter table public.landshop_staff_profiles drop constraint if exists staff_photo_approval;
alter table public.landshop_staff_profiles add constraint staff_photo_approval
 check (kyc_state<>'approved' or
  (photo_path is not null and photo_verified_at is not null and
   (photo_verified_by is not null or
    (verification_provider='veriff' and verification_session_id is not null))));
create table if not exists public.landshop_staff_identity_verifications(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.landshop_staff_profiles(user_id) on delete cascade,
 provider text not null default 'veriff' check(provider='veriff'),
 provider_session_id uuid not null unique,
 session_url text not null,
 portrait_path text not null,
 consented_at timestamptz not null,
 status text not null default 'pending'
  check(status in ('pending','review','approved','declined','expired','abandoned','resubmission_requested')),
 decision_code integer,
 decision_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists landshop_staff_identity_verifications_user_created_idx
 on public.landshop_staff_identity_verifications(user_id,created_at desc);
create unique index if not exists landshop_staff_identity_verifications_one_pending
 on public.landshop_staff_identity_verifications(user_id)
 where status in ('pending','review','resubmission_requested');
alter table public.landshop_staff_identity_verifications enable row level security;
revoke all on public.landshop_staff_identity_verifications from public,anon,authenticated;
grant select on public.landshop_staff_identity_verifications to authenticated;
drop policy if exists "landshop_staff_identity_self_read" on public.landshop_staff_identity_verifications;
create policy "landshop_staff_identity_self_read"
 on public.landshop_staff_identity_verifications for select to authenticated
 using (user_id=(select auth.uid()));
create or replace function public.landshop_staff_identity_provider_decision(
 p_session uuid,p_status text,p_code integer,p_document_type text,p_document_country text)
returns boolean language plpgsql security definer set search_path='' as $function$
declare
 v_attempt public.landshop_staff_identity_verifications%rowtype;
 v_profile public.landshop_staff_profiles%rowtype;
 v_latest uuid;
begin
 if coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role' then
  raise exception 'Only the identity provider verifier can record biometric decisions';
 end if;
 if p_session is null or p_status not in
 ('approved','declined','expired','abandoned','review','resubmission_requested') then
  raise exception 'Unknown identity verification decision';end if;
 select * into v_attempt from public.landshop_staff_identity_verifications
  where provider_session_id=p_session for update;
 if not found then raise exception 'Unknown identity verification session';end if;
 if v_attempt.status in ('approved','declined','expired','abandoned') then
  return v_attempt.status=p_status;
 end if;
 select id into v_latest from public.landshop_staff_identity_verifications
  where user_id=v_attempt.user_id order by created_at desc,id desc limit 1;
 if v_latest is distinct from v_attempt.id then
  raise exception 'Superseded identity verification attempt';end if;
 select * into v_profile from public.landshop_staff_profiles
  where user_id=v_attempt.user_id for update;
 if not found or v_profile.employment_state<>'active'
  or v_profile.kyc_state<>'submitted'
  or v_profile.photo_path is distinct from v_attempt.portrait_path
  or not exists(select 1 from auth.users u where u.id=v_attempt.user_id
    and u.email_confirmed_at is not null and u.deleted_at is null
    and (u.banned_until is null or u.banned_until<now()))
  or not exists(select 1 from public.organization_members m where m.user_id=v_attempt.user_id
    and m.organization_id=v_profile.organization_id and m.status='active' and m.role='staff')
 then raise exception 'Account no longer eligible for automated staff identity verification';end if;
 if p_status='approved' and (p_code is distinct from 9001
   or nullif(btrim(coalesce(p_document_type,'')),'') is null
   or nullif(btrim(coalesce(p_document_country,'')),'') is null)
 then raise exception 'Approved document and selfie identity evidence required';end if;
 update public.landshop_staff_identity_verifications set
   status=p_status,decision_code=p_code,decision_at=now()
 where id=v_attempt.id;
 if p_status='approved' then
  update public.landshop_staff_profiles set
   kyc_state='approved',photo_verified_at=now(),
   photo_verified_by=null,verification_provider='veriff',
   verification_session_id=p_session,
   staff_number=coalesce(staff_number,
    'LS-'||upper(left(replace(user_id::text,'-',''),12))),
   review_note='Independently verified identity document and live selfie (Veriff)',
   updated_at=now()
  where user_id=v_attempt.user_id;
 end if;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(null,'staff.identity_provider_decision',
 jsonb_build_object('staff_id',v_attempt.user_id,'provider','veriff',
 'session_id',p_session,'status',p_status,'code',p_code,
 'staff_access','existing_basic_role_unchanged'));
 return true;
end $function$;
revoke all on function public.landshop_staff_identity_provider_decision(uuid,text,integer,text,text)
 from public,anon,authenticated;
grant execute on function public.landshop_staff_identity_provider_decision(uuid,text,integer,text,text)
 to service_role;
