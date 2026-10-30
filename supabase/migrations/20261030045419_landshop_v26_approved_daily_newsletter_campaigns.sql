-- Applied in production as 20261030045419_landshop_v26_approved_daily_newsletter_campaigns.
-- Only authorized staff can approve digest content. There is no implicit opt-in.
create table if not exists public.landshop_newsletter_campaigns(
 id uuid primary key default gen_random_uuid(),
 send_date date not null unique,
 article_slug text not null check(article_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(article_slug)<=130),
 status text not null default 'approved' check(status in ('approved','cancelled')),
 approved_by uuid not null references auth.users(id),
 approved_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create table if not exists public.landshop_newsletter_deliveries(
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.landshop_newsletter_campaigns(id) on delete restrict,
 subscriber_id uuid not null references public.landshop_newsletter_subscribers(id) on delete cascade,
 status text not null default 'claimed' check(status in ('claimed','sent','failed')),
 provider_message_id text,
 failure_type text check(failure_type is null or failure_type in ('provider_rejected','provider_unavailable','recipient_suppressed','opted_out')),
 claimed_at timestamptz not null default now(),
 completed_at timestamptz,
 unique(campaign_id,subscriber_id)
);
create index if not exists landshop_newsletter_campaign_date_idx on public.landshop_newsletter_campaigns(send_date,status);
create index if not exists landshop_newsletter_delivery_state_idx on public.landshop_newsletter_deliveries(campaign_id,status);
alter table public.landshop_newsletter_campaigns enable row level security;
alter table public.landshop_newsletter_deliveries enable row level security;
revoke all on public.landshop_newsletter_campaigns from anon,authenticated;
revoke all on public.landshop_newsletter_deliveries from anon,authenticated;
create or replace function public.landshop_approve_newsletter_campaign(p_date date,p_slug text)
returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid := (select auth.uid()); result_id uuid;
begin
 if uid is null then raise exception 'Sign in required';end if;
 if not exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=uid and m.status='active' and o.kind='landshop'
 and m.role in ('owner','admin','operations','ceo','founder'))
 then raise exception 'Authorized Landshop reviewer required';end if;
 if p_date<(now() at time zone 'Africa/Lagos')::date
 or p_date>((now() at time zone 'Africa/Lagos')::date+30)
 then raise exception 'Campaign must be dated within the next 30 days';end if;
 if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug)>130
 then raise exception 'Invalid article identifier';end if;
 insert into public.landshop_newsletter_campaigns(send_date,article_slug,status,approved_by)
 values(p_date,p_slug,'approved',uid) on conflict(send_date) do nothing returning id into result_id;
 if result_id is null then raise exception 'A campaign already exists for that date; contact an administrator to cancel it';end if;
 return result_id;
end $$;
revoke all on function public.landshop_approve_newsletter_campaign(date,text) from public,anon,authenticated;
grant execute on function public.landshop_approve_newsletter_campaign(date,text) to authenticated;
create or replace function public.landshop_cancel_newsletter_campaign(p_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid := (select auth.uid());
begin
 if uid is null or not exists(select 1 from public.organization_members m
 join public.organizations o on o.id=m.organization_id
 where m.user_id=uid and m.status='active' and o.kind='landshop'
 and m.role in ('owner','admin','operations','ceo','founder'))
 then raise exception 'Authorized Landshop reviewer required';end if;
 update public.landshop_newsletter_campaigns set status='cancelled' where id=p_id and status='approved';
 return true;
end $$;
revoke all on function public.landshop_cancel_newsletter_campaign(uuid) from public,anon,authenticated;
grant execute on function public.landshop_cancel_newsletter_campaign(uuid) to authenticated;
create or replace function public.landshop_staff_newsletter_campaigns()
returns table(id uuid,send_date date,article_slug text,status text,approved_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare uid uuid := (select auth.uid());
begin
 if uid is null or not exists(select 1 from public.organization_members m
 join public.organizations o on o.id=m.organization_id
 where m.user_id=uid and m.status='active' and o.kind='landshop'
 and m.role in ('owner','admin','operations','ceo','founder'))
 then raise exception 'Authorized Landshop reviewer required';end if;
 return query select c.id,c.send_date,c.article_slug,c.status,c.approved_at
 from public.landshop_newsletter_campaigns c order by c.send_date desc limit 45;
end $$;
revoke all on function public.landshop_staff_newsletter_campaigns() from public,anon,authenticated;
grant execute on function public.landshop_staff_newsletter_campaigns() to authenticated;
