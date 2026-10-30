-- Applied to the production Supabase project as migration 20261030025238.
-- Source verified Prime/Luxury category is deliberately nullable; historic
-- catalogue entries and unpublished draft inventory do not appear in public search.
alter table public.properties
 add column if not exists collection_type text,
 add column if not exists collection_verified_at timestamptz,
 add column if not exists collection_verified_by uuid references auth.users(id) on delete set null,
 add column if not exists collection_source text;
do $$
begin
 if not exists(select 1 from pg_constraint where conname='properties_collection_type_allowed' and conrelid='public.properties'::regclass) then
  alter table public.properties add constraint properties_collection_type_allowed
   check (collection_type is null or collection_type in ('Prime','Luxury'));
 end if;
 if not exists(select 1 from pg_constraint where conname='properties_collection_requires_evidence' and conrelid='public.properties'::regclass) then
  alter table public.properties add constraint properties_collection_requires_evidence
   check (collection_type is null or
    (collection_verified_at is not null and collection_verified_by is not null and length(btrim(collection_source))>=24));
 end if;
end $$;
create or replace function public.landshop_verify_property_collection(p_property uuid,p_collection text,p_source text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
 if uid is null then raise exception 'Sign in is required';end if;
 if p_collection not in ('Prime','Luxury') then raise exception 'Select Prime or Luxury';end if;
 if length(btrim(coalesce(p_source,'')))<24 or length(p_source)>1000 then
  raise exception 'Record current written estate/developer classification evidence (24-1000 characters)';
 end if;
 if not exists(
  select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
  where m.user_id=uid and m.status='active' and o.kind='landshop'
   and m.role in ('owner','ceo','founder','admin','technology_officer','technology_consultant')
 ) then raise exception 'Authorized Landshop property reviewer required';end if;
 update public.properties
 set collection_type=p_collection,collection_verified_at=now(),
     collection_verified_by=uid,collection_source=btrim(p_source)
 where id=p_property and status='draft';
 if not found then raise exception 'Only verified draft property records can be classified';end if;
end $$;
revoke all on function public.landshop_verify_property_collection(uuid,text,text) from public,anon,authenticated;
grant execute on function public.landshop_verify_property_collection(uuid,text,text) to authenticated;
