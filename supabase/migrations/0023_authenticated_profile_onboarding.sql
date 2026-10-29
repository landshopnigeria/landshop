-- Landshop 0023: create one private customer profile when Supabase Auth registers a user.
-- Personal metadata is NEVER an authorization source. Owner/staff membership remains manual.
-- The current live project had zero auth users and no auth.users signup triggers at audit time.
-- Apply only with verified encrypted database backup and rollback evidence available.

alter table public.profiles
  add column if not exists display_username text;

create schema if not exists landshop_internal;
revoke all on schema landshop_internal from PUBLIC, anon, authenticated;

create or replace function landshop_internal.landshop_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  supplied_name text;
  supplied_phone text;
  supplied_username text;
begin
  -- User metadata is user-editable and therefore NEVER controls role, KYC approval,
  -- referral commission, wallet balance or enterprise membership.
  supplied_name := nullif(btrim(left(coalesce(new.raw_user_meta_data->>'full_name',''),160)),'');
  supplied_phone := nullif(btrim(left(coalesce(new.raw_user_meta_data->>'phone',''),30)),'');
  supplied_username := lower(btrim(left(coalesce(new.raw_user_meta_data->>'username',''),30)));
  if supplied_username !~ '^[a-z][a-z0-9_.]{2,29}$' then
    supplied_username := null;
  end if;

  insert into public.profiles(id,full_name,phone,display_username)
  values(new.id,supplied_name,supplied_phone,supplied_username)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function landshop_internal.landshop_new_auth_user_profile() from PUBLIC, anon, authenticated;

drop trigger if exists landshop_auth_user_profile_created on auth.users;
create trigger landshop_auth_user_profile_created
  after insert on auth.users
  for each row
  execute function landshop_internal.landshop_new_auth_user_profile();

-- Do not GRANT UPDATE on profiles: kyc_status is trusted-service controlled.
-- Do not create organization memberships or mark the user verified.
