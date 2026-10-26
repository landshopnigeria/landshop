-- LANDSHOP V0.3: organization, staff, KYC and workforce foundation.
-- NOT APPLIED: requires privileged Supabase project access and reviewed tests.
create table if not exists public.organizations(
 id uuid primary key default gen_random_uuid(),
 name text not null,
 kind text not null check(kind in ('landshop','company','cooperative','partner')),
 created_at timestamptz not null default now()
);
create table if not exists public.organization_members(
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('owner','executive','admin','operations','finance','legal',
   'surveyor','sales','realtor','marketing','hr','staff','security','viewer')),
 status text not null default 'invited' check(status in ('invited','active','suspended','revoked')),
 invited_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 primary key(organization_id,user_id)
);
create index if not exists members_user_active_idx on public.organization_members(user_id,status);

create table if not exists public.kyc_submissions(
 id uuid primary key default gen_random_uuid(),
 applicant_id uuid not null references auth.users(id),
 organization_id uuid references public.organizations(id),
 kind text not null check(kind in ('individual','company','realtor','employee')),
 status text not null default 'draft'
  check(status in ('draft','submitted','review','approved','rejected','expired')),
 metadata jsonb not null default '{}'::jsonb,
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
-- KYC documents belong in a private object-storage bucket, never public URLs.
-- Reviewed identity state can be changed only by trusted service methods.

create table if not exists public.attendance_events(
 id uuid primary key default gen_random_uuid(),
 staff_id uuid not null references auth.users(id),
 organization_id uuid not null references public.organizations(id),
 event_type text not null check(event_type in ('clock_in','clock_out')),
 recorded_at timestamptz not null default now(),
 location geography(Point,4326),
 location_accuracy_m numeric(8,2) check(location_accuracy_m >=0),
 location_label text,
 permission_granted boolean not null,
 source text not null default 'web' check(source in ('web','ios','android','admin_adjustment')),
 status text not null default 'recorded' check(status in ('recorded','disputed','approved_adjustment')),
 created_at timestamptz not null default now()
);
create index if not exists attendance_staff_time_idx on public.attendance_events(staff_id,recorded_at desc);
create table if not exists public.staff_tasks(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 assignee_id uuid not null references auth.users(id),
 assigned_by uuid not null references auth.users(id),
 title text not null,
 details text,
 starts_at timestamptz not null,
 due_at timestamptz not null,
 status text not null default 'assigned'
 check(status in ('assigned','in_progress','blocked','submitted','accepted','returned','cancelled')),
 score numeric(5,2) check(score >= 0 and score<=100),
 scored_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 constraint due_after_start check(due_at > starts_at)
);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.kyc_submissions enable row level security;
alter table public.attendance_events enable row level security;
alter table public.staff_tasks enable row level security;

create policy org_member_view_self on public.organization_members for select to authenticated
 using(user_id=(select auth.uid()));
create policy kyc_self_view on public.kyc_submissions for select to authenticated
 using(applicant_id=(select auth.uid()));
create policy attendance_own_view on public.attendance_events for select to authenticated
 using(staff_id=(select auth.uid()));
create policy tasks_own_view on public.staff_tasks for select to authenticated
 using(assignee_id=(select auth.uid()));

-- No public insert/update/delete privileges or RLS mutation policies.
-- Staff actions and management approvals must be performed by validated server endpoints,
-- with permission checks, event audits and concurrency control.
-- Location tracking requires express permission; capture only when relevant.
-- Scoring is advisory: do not automatically deduct staff pay.
