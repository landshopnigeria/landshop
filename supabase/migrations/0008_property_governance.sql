-- Landshop staff-only property authoring and approval. Apply after migration 0007.
-- No customer may write properties or create published listings.
create table if not exists public.property_import_batches(
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 source_filename text not null,
 status text not null default 'draft' check(status in('draft','validated','rejected','approved','imported')),
 created_at timestamptz not null default now()
);
create table if not exists public.property_import_rows(
 id bigint generated always as identity primary key,
 batch_id uuid not null references public.property_import_batches(id) on delete cascade,
 row_number integer not null check(row_number>0),
 raw_data jsonb not null,
 normalized jsonb not null,
 errors jsonb not null default '[]'::jsonb,
 unique(batch_id,row_number)
);
create table if not exists public.property_publication_events(
 id bigint generated always as identity primary key,
 property_id uuid not null references public.properties(id),
 actor_id uuid not null references auth.users(id),
 from_status text not null,
 to_status text not null,
 reason text not null,
 created_at timestamptz not null default now()
);
alter table public.property_import_batches enable row level security;
alter table public.property_import_rows enable row level security;
alter table public.property_publication_events enable row level security;
revoke all on public.properties,public.estates,public.property_import_batches,
  public.property_import_rows,public.property_publication_events from anon,authenticated;
grant select on public.properties,public.estates,public.property_import_batches,
 public.property_import_rows,public.property_publication_events to authenticated;
grant select on public.properties,public.estates to anon;

-- Catalog retains published-only visibility for anonymous users.
drop policy if exists property_staff_read on public.properties;
create policy property_staff_read on public.properties for select to authenticated using(
 exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=(select auth.uid()) and m.status='active' and o.kind='landshop'
 and m.role in ('owner','admin','operations','sales','legal'))
);
drop policy if exists import_batch_staff_read on public.property_import_batches;
create policy import_batch_staff_read on public.property_import_batches for select to authenticated using(
 exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=(select auth.uid()) and m.status='active' and o.kind='landshop'
 and m.role in ('owner','admin','operations','sales','legal'))
);
drop policy if exists import_row_staff_read on public.property_import_rows;
create policy import_row_staff_read on public.property_import_rows for select to authenticated using(
 exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=(select auth.uid()) and m.status='active' and o.kind='landshop'
 and m.role in ('owner','admin','operations','sales','legal'))
);
drop policy if exists property_event_staff_read on public.property_publication_events;
create policy property_event_staff_read on public.property_publication_events for select to authenticated using(
 exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=(select auth.uid()) and m.status='active' and o.kind='landshop'
 and m.role in ('owner','admin','operations','legal'))
);

create or replace function public.landshop_property_editor(p_user uuid, p_approval boolean default false)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(
 select 1 from public.organization_members m
 join public.organizations o on o.id=m.organization_id
 where m.user_id=p_user and m.status='active' and o.kind='landshop'
 and (case when p_approval then m.role in ('owner','admin','operations','legal')
   else m.role in ('owner','admin','operations','sales','legal') end)
 )
$$;
revoke all on function public.landshop_property_editor(uuid,boolean) from public,anon;
grant execute on function public.landshop_property_editor(uuid,boolean) to authenticated;
-- Do not treat editor function alone as authorization for a write: validate caller inside every RPC.

create or replace function public.landshop_property_create(
 p_title text,p_type text,p_amount_kobo bigint,p_estate uuid default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
 if v_user is null or not public.landshop_property_editor(v_user,false)
   then raise exception 'Property editor access denied'; end if;
 if char_length(btrim(coalesce(p_title,'')))<5 or char_length(p_title)>180
   then raise exception 'Invalid property title'; end if;
 if p_type not in ('land','house','apartment','commercial','shortlet')
   then raise exception 'Invalid property type'; end if;
 if p_amount_kobo is not null and p_amount_kobo<0
   then raise exception 'Invalid price'; end if;
 if p_estate is not null and not exists(select 1 from public.estates where id=p_estate)
   then raise exception 'Estate not found'; end if;
 insert into public.properties(title,property_type,amount_kobo,estate_id,created_by,status)
 values(btrim(p_title),p_type,p_amount_kobo,p_estate,v_user,'draft') returning id into v_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.created',jsonb_build_object('property_id',v_id));
 return v_id;
end $$;
revoke all on function public.landshop_property_create(text,text,bigint,uuid) from public,anon;
grant execute on function public.landshop_property_create(text,text,bigint,uuid) to authenticated;

create or replace function public.landshop_property_transition(
 p_id uuid,p_status text,p_reason text)
returns text language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();v_old text;v_author uuid;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true)
   then raise exception 'Publication access denied';end if;
 if p_status not in ('review','published','archived')
   or char_length(btrim(coalesce(p_reason,'')))<15 or char_length(p_reason)>1000
   then raise exception 'Invalid publication request';end if;
 select status,created_by into v_old,v_author from public.properties where id=p_id for update;
 if not found then raise exception 'Property not found';end if;
 if not ((v_old='draft' and p_status='review') or
         (v_old='review' and p_status='published') or
         (v_old='published' and p_status='archived'))
   then raise exception 'Invalid property status transition';end if;
 if p_status='published' and v_author=v_user
   then raise exception 'A second authorized reviewer must publish this property';end if;
 update public.properties set status=p_status where id=p_id;
 insert into public.property_publication_events(property_id,actor_id,from_status,to_status,reason)
 values(p_id,v_user,v_old,p_status,btrim(p_reason));
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.status_changed',jsonb_build_object('property_id',p_id,
 'from',v_old,'to',p_status));
 return p_status;
end $$;
revoke all on function public.landshop_property_transition(uuid,text,text) from public,anon;
grant execute on function public.landshop_property_transition(uuid,text,text) to authenticated;
