-- REVIEW BEFORE APPLYING IN SUPABASE. RLS-deny by default for privileged mutations.
create extension if not exists pgcrypto;
create extension if not exists postgis with schema extensions;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, phone text,
 kyc_status text not null default 'not_started'
 check (kyc_status in ('not_started','pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create table if not exists public.estates (
 id uuid primary key default gen_random_uuid(),
 name text not null, state text, city text,
 status text not null default 'draft'
 check(status in ('draft','review','published','archived')),
 created_at timestamptz not null default now()
);
create table if not exists public.properties (
 id uuid primary key default gen_random_uuid(),
 estate_id uuid references public.estates(id),
 title text not null, property_type text not null,
 amount_kobo bigint check(amount_kobo>=0),
 status text not null default 'draft'
 check(status in ('draft','review','published','reserved','sold','archived')),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.referral_codes (
 user_id uuid primary key references auth.users(id) on delete cascade,
 numeric_code bigint not null unique check(numeric_code>0),
 code text generated always as ('LANDSHOP'||lpad(numeric_code::text,2,'0')) stored
);
create unique index if not exists referral_code_unique on public.referral_codes(code);
create table if not exists public.referral_edges (
 referee_id uuid primary key references auth.users(id) on delete cascade,
 referrer_id uuid not null references auth.users(id),
 source_code text not null,
 created_at timestamptz not null default now(),
 check(referee_id<>referrer_id)
);
create index if not exists referral_referrer_idx on public.referral_edges(referrer_id);
create or replace function public.prevent_referral_reparenting()
 returns trigger language plpgsql set search_path='' as $$
begin
 raise exception 'Permanent upline cannot be changed';
end $$;
drop trigger if exists immutable_referral_edges on public.referral_edges;
create trigger immutable_referral_edges before update or delete
 on public.referral_edges for each row execute function public.prevent_referral_reparenting();
create table if not exists public.applications (
 id uuid primary key default gen_random_uuid(),
 applicant_id uuid not null references auth.users(id),
 kind text not null check(kind in
 ('develop_land','develop_house','beta_mortgage','mortgage_xtra','inspection','incubate','thrift')),
 status text not null default 'draft'
 check(status in ('draft','submitted','review','approved','rejected','withdrawn')),
 answers jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create table if not exists public.notification_outbox (
 id uuid primary key default gen_random_uuid(),
 event_type text not null,
 user_id uuid references auth.users(id),
 payload jsonb not null default '{}'::jsonb,
 status text not null default 'pending'
 check(status in ('pending','sending','delivered','failed','cancelled')),
 attempts integer not null default 0,
 next_attempt_at timestamptz not null default now()
);
create table if not exists public.audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id),
 event_type text not null,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.estates enable row level security;
alter table public.properties enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_edges enable row level security;
alter table public.applications enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.audit_events enable row level security;
create policy profiles_view_own on public.profiles for select to authenticated
 using(id=(select auth.uid()));
-- Profile updates are service-mediated so kyc_status cannot be self-approved.
create policy estates_published on public.estates for select to anon,authenticated
 using(status='published');
create policy properties_published on public.properties for select to anon,authenticated
 using(status='published');
create policy applications_own_view on public.applications for select to authenticated
 using(applicant_id=(select auth.uid()));
create policy applications_own_insert_draft on public.applications for insert to authenticated
 with check(applicant_id=(select auth.uid()) and status='draft');
create policy applications_own_update_draft on public.applications for update to authenticated
 using(applicant_id=(select auth.uid()) and status='draft')
 with check(applicant_id=(select auth.uid()) and status='draft');
create policy referral_codes_self on public.referral_codes for select to authenticated
 using(user_id=(select auth.uid()));
create policy referral_edge_direct on public.referral_edges for select to authenticated
 using(referee_id=(select auth.uid()) or referrer_id=(select auth.uid()));
-- No public mutation policies for properties, referral ancestry, KYC, outbox or audit.
