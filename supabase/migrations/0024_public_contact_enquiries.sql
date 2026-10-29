
-- Landshop V16: public enquiry intake. No public SELECT, UPDATE or DELETE grants.
-- Apply only after verified production backup and restore evidence.
create table if not exists public.contact_enquiries(
 id uuid primary key default gen_random_uuid(),
 full_name text not null check(char_length(full_name) between 2 and 120),
 email text not null check(char_length(email) between 5 and 254 and email like '%@%'),
 phone text check(phone is null or char_length(phone)<=30),
 topic text not null check(topic in ('Property Acquisition','Mortgage Guidance','Property Inspection','Develop','Incubate','Grow','Customer Support','Other')),
 message text not null check(char_length(message) between 20 and 3000),
 consent boolean not null default false check(consent=true),
 fingerprint text not null unique check(fingerprint ~ '^[0-9a-f]{64}$'),
 status text not null default 'new' check(status in ('new','assigned','in_progress','resolved','closed')),
 assigned_to uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.contact_enquiries enable row level security;
revoke all on public.contact_enquiries from public,anon,authenticated;
grant insert(full_name,email,phone,topic,message,consent,fingerprint) on public.contact_enquiries to anon,authenticated;
drop policy if exists contact_enquiries_public_intake on public.contact_enquiries;
create policy contact_enquiries_public_intake on public.contact_enquiries
 for insert to anon,authenticated
 with check (status='new' and assigned_to is null and consent=true and created_at >=now()-interval '5 minutes' and created_at<=now()+interval '5 minutes');
-- Service-role back-office workflows may view and assign new enquiries after separate staff authorization checks.
-- No anonymous or ordinary customer read access, including INSERT RETURNING, is granted.
