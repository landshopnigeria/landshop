-- Prevent property publication without separately verified title/marketing authority
-- and approved original property photography. Apply after 0009.
create table if not exists public.property_verification_evidence(
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 evidence_type text not null check(evidence_type in
   ('title_document','marketing_authority','approved_property_image')),
 object_path text not null,
 verified_by uuid not null references auth.users(id),
 verified_at timestamptz not null default now(),
 reviewer_note text not null check(char_length(reviewer_note) between 15 and 1000),
 unique(property_id,evidence_type,object_path)
);
alter table public.property_verification_evidence enable row level security;
revoke all on public.property_verification_evidence from public,anon,authenticated;
grant select on public.property_verification_evidence to authenticated;
drop policy if exists property_verification_staff_read on public.property_verification_evidence;
create policy property_verification_staff_read on public.property_verification_evidence for select to authenticated using(
 exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=(select auth.uid()) and m.status='active' and o.kind='landshop'
 and m.role in ('owner','admin','operations','legal'))
);
-- Evidence writes must be handled by a later verified, audited server endpoint.
-- This trigger fails closed while no evidence has been separately approved.
create or replace function public.landshop_guard_property_publication()
returns trigger language plpgsql set search_path=''
as $$
begin
 if new.status='published' and old.status is distinct from 'published' then
   if not exists(
     select 1 from public.property_verification_evidence e
     where e.property_id=new.id and e.evidence_type in ('title_document','marketing_authority')
   ) or not exists(
     select 1 from public.property_verification_evidence e
     where e.property_id=new.id and e.evidence_type='approved_property_image'
   ) then
     raise exception 'Verified ownership/authority evidence and approved property media required';
   end if;
 end if;
 return new;
end $$;
drop trigger if exists landshop_publication_evidence_gate on public.properties;
create trigger landshop_publication_evidence_gate before update of status on public.properties
 for each row execute function public.landshop_guard_property_publication();
