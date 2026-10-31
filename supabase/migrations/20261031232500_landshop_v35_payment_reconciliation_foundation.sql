-- Landshop finance foundation. No charge or entitlement is created by this migration.
create table if not exists public.landshop_payment_intents (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references auth.users(id) on delete restrict,
 reference text not null unique check (reference ~ '^[A-Za-z0-9._=-]{8,100}$'),
 provider text not null default 'paystack' check (provider='paystack'),
 currency text not null default 'NGN' check (currency='NGN'),
 amount_kobo bigint not null check (amount_kobo between 100 and 1000000000000),
 purpose text not null check (purpose in ('property','subscription','inspection','other')),
 purpose_reference text,
 status text not null default 'created' check (status in ('created','initialized','pending','success','failed','abandoned','reversed')),
 provider_transaction_id text,
 verified_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint verified_success_requires_server_evidence check (status <> 'success' or (verified_at is not null and provider_transaction_id is not null))
);
create index if not exists ls_payment_intents_customer_idx on public.landshop_payment_intents(customer_id,created_at desc);
create index if not exists ls_payment_intents_status_idx on public.landshop_payment_intents(status,created_at desc);
create table if not exists public.landshop_payment_events (
 id uuid primary key default gen_random_uuid(),
 payment_intent_id uuid not null references public.landshop_payment_intents(id) on delete restrict,
 provider text not null default 'paystack' check (provider='paystack'),
 event_key text not null unique,
 event_type text not null,
 reference text not null,
 gateway_status text,
 amount_kobo bigint,
 currency text,
 verified_by text not null check (verified_by in ('webhook_signature','server_verify')),
 payload_digest text not null check (payload_digest ~ '^[a-f0-9]{64}$'),
 received_at timestamptz not null default now()
);
create index if not exists ls_payment_events_intent_idx on public.landshop_payment_events(payment_intent_id,received_at desc);
alter table public.landshop_payment_intents enable row level security;
alter table public.landshop_payment_events enable row level security;
revoke all on public.landshop_payment_intents,public.landshop_payment_events from public,anon,authenticated;
grant select,insert,update on public.landshop_payment_intents to service_role;
grant select,insert on public.landshop_payment_events to service_role;
-- A private read-only RPC allows the customer to see the status of their own
-- payment without exposing gateway events or granting direct table mutation.
create or replace function public.landshop_my_payments(p_limit integer default 20)
returns table(reference text,amount_kobo bigint,currency text,purpose text,status text,created_at timestamptz,verified_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if p_limit not between 1 and 50 then raise exception 'Limit must be 1 to 50';end if;
 return query select p.reference,p.amount_kobo,p.currency,p.purpose,p.status,p.created_at,p.verified_at
 from public.landshop_payment_intents p where p.customer_id=auth.uid()
 order by p.created_at desc limit p_limit;
end $$;
revoke all on function public.landshop_my_payments(integer) from public,anon;
grant execute on function public.landshop_my_payments(integer) to authenticated;
