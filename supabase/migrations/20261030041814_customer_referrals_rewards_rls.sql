-- Customer referral issuance, attribution and wallet read model.
-- Rewards are NEVER credited by client actions or by unaudited sign-ups.
create sequence if not exists public.landshop_referral_sequence;
select setval('public.landshop_referral_sequence',
  greatest(coalesce((select max(numeric_code) from public.referral_codes),0),1),
  (select count(*)>0 from public.referral_codes));

create table if not exists public.referral_wallets (
 user_id uuid primary key references auth.users(id) on delete cascade,
 available_kobo bigint not null default 0 check (available_kobo>=0),
 pending_kobo bigint not null default 0 check (pending_kobo>=0),
 lifetime_earned_kobo bigint not null default 0 check (lifetime_earned_kobo>=0),
 lifetime_paid_kobo bigint not null default 0 check (lifetime_paid_kobo>=0),
 updated_at timestamptz not null default now()
);
create table if not exists public.referral_reward_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 referral_referee_id uuid references auth.users(id),
 source_transaction_id text,
 amount_kobo bigint not null check(amount_kobo>0),
 direction text not null check(direction in ('credit','withdrawal','reversal')),
 status text not null default 'pending' check(status in ('pending','approved','rejected','paid')),
 description text,
 created_at timestamptz not null default now(),
 approved_at timestamptz
);
create unique index if not exists landshop_referral_reward_source_unique
 on public.referral_reward_events(source_transaction_id,direction)
 where source_transaction_id is not null;
create index if not exists landshop_referral_reward_user_date
 on public.referral_reward_events(user_id,created_at desc);

alter table public.referral_wallets enable row level security;
alter table public.referral_reward_events enable row level security;
drop policy if exists landshop_referral_wallet_owner_view on public.referral_wallets;
create policy landshop_referral_wallet_owner_view on public.referral_wallets
 for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists landshop_referral_event_owner_view on public.referral_reward_events;
create policy landshop_referral_event_owner_view on public.referral_reward_events
 for select to authenticated using(user_id=(select auth.uid()));

revoke all on public.referral_wallets from anon,authenticated;
revoke all on public.referral_reward_events from anon,authenticated;
grant select on public.referral_wallets to authenticated;
grant select on public.referral_reward_events to authenticated;

create schema if not exists landshop_internal;
revoke all on schema landshop_internal from public,anon,authenticated;
create or replace function landshop_internal.landshop_new_customer_referral()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  source_code text;
  source_user uuid;
begin
  -- Staff never receive customer referral marketing identities.
  if coalesce(new.raw_user_meta_data->>'staff_signup','false')='true' then return new; end if;
  insert into public.referral_codes(user_id,numeric_code)
    values(new.id,nextval('public.landshop_referral_sequence'))
    on conflict (user_id) do nothing;
  insert into public.referral_wallets(user_id) values(new.id)
    on conflict (user_id) do nothing;

  source_code := upper(btrim(coalesce(new.raw_user_meta_data->>'referral_code','')));
  if source_code ~ '^LANDSHOP[0-9]{2,12}$' then
    select user_id into source_user from public.referral_codes where code=source_code;
    if source_user is not null and source_user<>new.id then
      insert into public.referral_edges(referee_id,referrer_id,source_code)
        values(new.id,source_user,source_code) on conflict (referee_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function landshop_internal.landshop_new_customer_referral() from public,anon,authenticated;
drop trigger if exists landshop_auth_customer_referral_created on auth.users;
create trigger landshop_auth_customer_referral_created after insert on auth.users
 for each row execute function landshop_internal.landshop_new_customer_referral();

-- Include existing legitimate customer accounts without resetting codes or edges.
insert into public.referral_codes(user_id,numeric_code)
 select u.id,nextval('public.landshop_referral_sequence') from auth.users u
 where coalesce(u.raw_user_meta_data->>'staff_signup','false')<>'true'
 and not exists(select 1 from public.referral_codes r where r.user_id=u.id)
 on conflict (user_id) do nothing;
insert into public.referral_wallets(user_id)
 select u.id from public.referral_codes c join auth.users u on u.id=c.user_id
 on conflict (user_id) do nothing;

-- Google OAuth signup cannot submit user metadata in the same way as password signup:
-- allow a one-time referral claim only for newly registered authenticated customers.
create or replace function public.landshop_claim_signup_referral(p_code text)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  me uuid;
  source_user uuid;
  source text;
  joined timestamptz;
begin
  me := (select auth.uid());
  if me is null then raise exception 'Authentication required'; end if;
  select created_at into joined from auth.users where id=me;
  if joined is null or joined < now()-interval '48 hours' then return false; end if;
  source := upper(btrim(coalesce(p_code,'')));
  if source !~ '^LANDSHOP[0-9]{2,12}$' then return false; end if;
  if exists(select 1 from public.referral_edges where referee_id=me) then return false; end if;
  select user_id into source_user from public.referral_codes where code=source;
  if source_user is null or source_user=me then return false; end if;
  insert into public.referral_edges(referee_id,referrer_id,source_code)
    values(me,source_user,source) on conflict (referee_id) do nothing;
  return found;
end;
$$;
revoke all on function public.landshop_claim_signup_referral(text) from public,anon;
grant execute on function public.landshop_claim_signup_referral(text) to authenticated;

-- Referrers may see aggregate conversion status, never their referees' personal data.
create or replace function public.landshop_referral_summary()
returns table(total_referrals bigint,email_verified bigint,kyc_verified bigint,approved_applications bigint)
language sql stable security definer set search_path='' as $$
 select
   count(distinct e.referee_id),
   count(distinct e.referee_id) filter(where u.email_confirmed_at is not null),
   count(distinct e.referee_id) filter(where p.kyc_status='approved'),
   count(distinct e.referee_id) filter(where a.id is not null)
 from public.referral_edges e
 join auth.users u on u.id=e.referee_id
 left join public.profiles p on p.id=e.referee_id
 left join public.applications a on a.applicant_id=e.referee_id and a.status='approved'
 where e.referrer_id=(select auth.uid()) and (select auth.uid()) is not null;
$$;
revoke all on function public.landshop_referral_summary() from public,anon;
grant execute on function public.landshop_referral_summary() to authenticated;

comment on table public.referral_reward_events is
 'Privileged finance-approved reward journal only. Never credit from a signup, click, or customer API.';
