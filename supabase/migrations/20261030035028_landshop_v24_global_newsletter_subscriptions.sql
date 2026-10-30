-- Landshop V24 public newsletter subscriptions.
-- Production Supabase migration applied on 2026-10-30.
create table if not exists public.landshop_newsletter_subscribers(
 id uuid primary key default gen_random_uuid(),
 email text not null unique check (char_length(email) between 5 and 254 and email=lower(btrim(email))),
 status text not null default 'subscribed' check(status in ('subscribed','unsubscribed')),
 source text not null default 'global-footer' check(char_length(source) <= 60),
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists landshop_newsletter_subscribers_status_idx on public.landshop_newsletter_subscribers(status,created_at desc);
alter table public.landshop_newsletter_subscribers enable row level security;
revoke all on public.landshop_newsletter_subscribers from anon,authenticated;
create or replace function public.landshop_newsletter_subscribe(p_email text,p_source text default 'global-footer')
returns boolean
language plpgsql security definer set search_path=''
as $$
declare clean_email text := lower(btrim(coalesce(p_email,'')));
begin
 if char_length(clean_email)<5 or char_length(clean_email)>254
 or clean_email !~ '^[a-z0-9.!#$%&''*+/=?^`{|}~-]+@[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$'
 then raise exception 'Invalid email address' using errcode='22023';end if;
 if p_source is null or p_source not in ('global-footer') then raise exception 'Invalid subscription source';end if;
 insert into public.landshop_newsletter_subscribers(email,status,source,consent_at,updated_at)
 values(clean_email,'subscribed',p_source,now(),now())
 on conflict(email) do update set status='subscribed',source=excluded.source,
 consent_at=now(),updated_at=now();
 return true;
end $$;
revoke all on function public.landshop_newsletter_subscribe(text,text) from public,anon,authenticated;
grant execute on function public.landshop_newsletter_subscribe(text,text) to anon,authenticated;
