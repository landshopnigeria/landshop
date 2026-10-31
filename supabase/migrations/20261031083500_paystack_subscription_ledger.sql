-- V27: Paystack billing is fail-closed until real owner-approved plan prices
-- and PAYSTACK_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY are configured server-side.
create table if not exists public.landshop_subscription_plans(
 id uuid primary key default gen_random_uuid(),
 code text not null unique check(code ~ '^[a-z][a-z0-9_-]{2,50}$'),
 name text not null check(char_length(name) between 4 and 120),
 description text not null default '',
 amount_kobo bigint not null check(amount_kobo between 10000 and 100000000000),
 currency text not null default 'NGN' check(currency='NGN'),
 duration_days integer not null check(duration_days between 1 and 1095),
 is_active boolean not null default false,
 created_by uuid references auth.users(id),
 updated_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists ls_subscription_plans_active on public.landshop_subscription_plans(is_active,code);
alter table public.landshop_subscription_plans enable row level security;
revoke all on public.landshop_subscription_plans from public,anon,authenticated;
grant select on public.landshop_subscription_plans to authenticated;
create policy ls_plan_public_active_or_management on public.landshop_subscription_plans
 for select to authenticated using (is_active or public.landshop_is_management((select auth.uid())));

create table if not exists public.landshop_payment_transactions(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 plan_id uuid not null references public.landshop_subscription_plans(id),
 reference text not null unique check(reference ~ '^LNSPAY[A-Za-z0-9]{12,56}$'),
 provider text not null default 'paystack' check(provider='paystack'),
 amount_kobo bigint not null check(amount_kobo>0),
 purchased_days integer not null check(purchased_days between 1 and 1095),
 currency text not null default 'NGN' check(currency='NGN'),
 status text not null default 'initiated' check(status in ('initiated','pending','success','failed','reversed')),
 provider_id text,
 paid_at timestamptz,
 provider_domain text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(provider,provider_id)
);
create index if not exists ls_payment_user_idx on public.landshop_payment_transactions(user_id,created_at desc);
create index if not exists ls_payment_status_idx on public.landshop_payment_transactions(status,created_at desc);
alter table public.landshop_payment_transactions enable row level security;
revoke all on public.landshop_payment_transactions from public,anon,authenticated;
grant select on public.landshop_payment_transactions to authenticated;
create policy ls_payments_owner_or_verified_management on public.landshop_payment_transactions
 for select to authenticated using(user_id=(select auth.uid()) or public.landshop_is_management((select auth.uid())));

create table if not exists public.landshop_customer_subscriptions(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 plan_id uuid not null references public.landshop_subscription_plans(id),
 status text not null default 'active' check(status in ('active','expired','suspended','cancelled')),
 activated_at timestamptz not null default now(),
 expires_at timestamptz not null,
 last_payment_id uuid not null references public.landshop_payment_transactions(id),
 suspended_reason text,
 updated_at timestamptz not null default now(),
 unique(user_id,plan_id)
);
create index if not exists ls_subscriptions_expiry on public.landshop_customer_subscriptions(status,expires_at);
alter table public.landshop_customer_subscriptions enable row level security;
revoke all on public.landshop_customer_subscriptions from public,anon,authenticated;
grant select on public.landshop_customer_subscriptions to authenticated;
create policy ls_subscriptions_owner_or_management on public.landshop_customer_subscriptions
 for select to authenticated using(user_id=(select auth.uid()) or public.landshop_is_management((select auth.uid())));

create or replace function public.landshop_plan_save(
 p_id uuid,p_code text,p_name text,p_description text,p_amount_kobo bigint,p_duration_days integer,p_active boolean
) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); plan_id uuid;org uuid;
begin
 -- Prices and availability require verified enterprise owner approval.
 if actor is null or not exists(
 select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=actor and m.role='owner' and m.status='active' and o.kind='landshop')
 then raise exception 'Verified Landshop owner approval required to change prices';end if;
 if p_code !~ '^[a-z][a-z0-9_-]{2,50}$'
  or char_length(btrim(coalesce(p_name,''))) not between 4 and 120
  or p_amount_kobo not between 10000 and 100000000000
  or p_duration_days not between 1 and 1095
  or char_length(coalesce(p_description,''))>3000
 then raise exception 'Valid plan code, name, duration and amount required';end if;
 if p_id is null then
  insert into public.landshop_subscription_plans(code,name,description,amount_kobo,duration_days,is_active,created_by,updated_by)
  values(p_code,btrim(p_name),btrim(coalesce(p_description,'')),p_amount_kobo,p_duration_days,coalesce(p_active,false),actor,actor)
  returning id into plan_id;
 else
  update public.landshop_subscription_plans set
   code=p_code,name=btrim(p_name),description=btrim(coalesce(p_description,'')),
   amount_kobo=p_amount_kobo,duration_days=p_duration_days,is_active=coalesce(p_active,false),
   updated_by=actor,updated_at=now()
  where id=p_id returning id into plan_id;
  if plan_id is null then raise exception 'Plan not found';end if;
 end if;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(actor,'subscription.plan_updated',jsonb_build_object('plan_id',plan_id,'amount_kobo',p_amount_kobo,'active',p_active));
 return plan_id;
end $$;
revoke all on function public.landshop_plan_save(uuid,text,text,text,bigint,integer,boolean) from public,anon;
grant execute on function public.landshop_plan_save(uuid,text,text,text,bigint,integer,boolean) to authenticated;

create or replace function public.landshop_checkout_intent_create(p_plan uuid)
returns table(reference text,amount_kobo bigint,currency text)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); plan public.landshop_subscription_plans%rowtype; ref text;
begin
 if actor is null then raise exception 'Sign in to subscribe';end if;
 select * into plan from public.landshop_subscription_plans where id=p_plan and is_active=true;
 if not found then raise exception 'Plan is unavailable';end if;
 if (select count(*) from public.landshop_payment_transactions
      where user_id=actor and created_at>now()-interval '5 minutes')>=8
 then raise exception 'Too many checkout attempts';end if;
 if exists(select 1 from public.landshop_customer_subscriptions s
     where s.user_id=actor and s.plan_id=p_plan and s.status='suspended')
 then raise exception 'Contact Landshop support about your subscription before renewing';end if;
 ref:='LNSPAY'||replace(gen_random_uuid()::text,'-','');
 insert into public.landshop_payment_transactions(user_id,plan_id,reference,amount_kobo,purchased_days,currency)
 values(actor,plan.id,ref,plan.amount_kobo,plan.duration_days,plan.currency);
 insert into public.audit_events(actor_id,event_type,metadata)
 values(actor,'subscription.checkout_initiated',jsonb_build_object('reference',ref,'plan_id',plan.id));
 return query select ref,plan.amount_kobo,plan.currency;
end $$;
revoke all on function public.landshop_checkout_intent_create(uuid) from public,anon;
grant execute on function public.landshop_checkout_intent_create(uuid) to authenticated;

-- Only a verified server-side Paystack transaction can call this function.
create or replace function public.landshop_paystack_settle(
 p_reference text,p_amount_kobo bigint,p_currency text,p_provider_id text,p_paid_at timestamptz,p_domain text
) returns boolean language plpgsql security definer set search_path='' as $$
declare txn public.landshop_payment_transactions%rowtype; days integer; new_expiry timestamptz;
begin
 if current_setting('request.jwt.claim.role',true) is distinct from 'service_role'
 then raise exception 'Server settlement only';end if;
 select * into txn from public.landshop_payment_transactions where reference=p_reference for update;
 if not found then raise exception 'Unknown payment reference';end if;
 if txn.status='success' then
  if txn.amount_kobo<>p_amount_kobo or txn.currency<>p_currency or txn.provider_id<>p_provider_id
  then raise exception 'A settled transaction cannot be modified';end if;
  return true;
 end if;
 if txn.status not in ('initiated','pending')
 or txn.amount_kobo<>p_amount_kobo or txn.currency<>p_currency or p_currency<>'NGN'
 or p_provider_id is null or length(p_provider_id)<1 or p_domain not in ('live','test')
 then raise exception 'Transaction verification mismatch';end if;
 days:=txn.purchased_days;
 if days is null then raise exception 'Purchase duration snapshot missing';end if;
 update public.landshop_payment_transactions set status='success',provider_id=p_provider_id,
  paid_at=coalesce(p_paid_at,now()),provider_domain=p_domain,updated_at=now() where id=txn.id;
 -- Never override a management suspension even if a payment arrives.
 if not exists(select 1 from public.landshop_customer_subscriptions s
   where s.user_id=txn.user_id and s.plan_id=txn.plan_id and s.status='suspended') then
  insert into public.landshop_customer_subscriptions
   (user_id,plan_id,status,activated_at,expires_at,last_payment_id)
  values(txn.user_id,txn.plan_id,'active',now(),now()+make_interval(days=>days),txn.id)
  on conflict(user_id,plan_id) do update
  set status='active',expires_at=greatest(now(),public.landshop_customer_subscriptions.expires_at)+make_interval(days=>days),
      last_payment_id=excluded.last_payment_id,updated_at=now();
 end if;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(txn.user_id,'subscription.payment_verified',jsonb_build_object('transaction_id',txn.id,'plan_id',txn.plan_id,'amount_kobo',txn.amount_kobo,'provider',txn.provider,'domain',p_domain));
 insert into public.notification_outbox(event_type,user_id,payload)
 values('subscription.payment_verified',txn.user_id,jsonb_build_object('transaction_id',txn.id));
 return true;
end $$;
revoke all on function public.landshop_paystack_settle(text,bigint,text,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.landshop_paystack_settle(text,bigint,text,text,timestamptz,text) to service_role;

create or replace function public.landshop_subscription_decide(
 p_subscription uuid,p_action text,p_reason text
) returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); sub public.landshop_customer_subscriptions%rowtype;
begin
 if actor is null or not exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=actor and m.status='active' and m.role='owner' and o.kind='landshop')
 then raise exception 'Verified Landshop owner only';end if;
 if p_action not in ('suspend','cancel','reactivate') or char_length(btrim(coalesce(p_reason,'')))<15
 then raise exception 'Action and documented reason required';end if;
 select * into sub from public.landshop_customer_subscriptions where id=p_subscription for update;
 if not found then raise exception 'Subscription not found';end if;
 if p_action='reactivate' and sub.expires_at<=now() then raise exception 'Expired subscription requires a verified renewal';end if;
 update public.landshop_customer_subscriptions set
  status=case when p_action='reactivate' then 'active' when p_action='suspend' then 'suspended' else 'cancelled' end,
  suspended_reason=case when p_action='reactivate' then null else left(btrim(p_reason),2000) end,updated_at=now()
 where id=p_subscription;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(actor,'subscription.management_action',jsonb_build_object('subscription_id',p_subscription,'action',p_action,'reason',left(btrim(p_reason),200)));
 return true;
end $$;
revoke all on function public.landshop_subscription_decide(uuid,text,text) from public,anon;
grant execute on function public.landshop_subscription_decide(uuid,text,text) to authenticated;
