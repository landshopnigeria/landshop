-- Applied to production Supabase as landshop_v22_source_backed_draft_inventory_and_estate_management / 20261029212517.
-- Only source-grounded draft records, never automatically published.

-- Landshop V22: source-backed, NOT PUBLIC inventory and operational estate management.
alter table public.estates add column if not exists created_by uuid references auth.users(id);
alter table public.estates add column if not exists source_url text;
alter table public.estates add column if not exists source_note text;
alter table public.properties add column if not exists source_url text;
alter table public.properties add column if not exists source_price_note text;
alter table public.properties add column if not exists price_last_confirmed_at timestamptz;
create unique index if not exists landshop_estate_name_state_unique on public.estates(lower(btrim(name)),lower(btrim(coalesce(state,''))));
drop policy if exists estates_staff_read on public.estates;
create policy estates_staff_read on public.estates for select to authenticated using (
 (select auth.uid()) is not null and public.landshop_property_editor((select auth.uid()),false)
);
create or replace function public.landshop_estate_create(p_name text,p_state text,p_city text,p_lga text,p_area text)
 returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_id uuid;v_state text:=btrim(coalesce(p_state,''));
begin
 if v_user is null or not public.landshop_property_editor(v_user,false) then raise exception 'Staff authorization required';end if;
 if length(btrim(coalesce(p_name,''))) not between 4 and 180 or length(v_state) not between 3 and 50
 or length(coalesce(p_city,''))>100 or length(coalesce(p_lga,''))>100 or length(coalesce(p_area,''))>120
 then raise exception 'Invalid estate information';end if;
 if v_state not in ('Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Federal Capital Territory','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara') then raise exception 'Choose a Nigerian state or FCT';end if;
 if exists(select 1 from public.estates where lower(btrim(name))=lower(btrim(p_name)) and state=v_state)
 then raise exception 'Estate already exists for this state';end if;
 insert into public.estates(name,state,city,lga,area,status,created_by)
 values(btrim(p_name),v_state,nullif(btrim(coalesce(p_city,'')),''),nullif(btrim(coalesce(p_lga,'')),''),nullif(btrim(coalesce(p_area,'')),''),'draft',v_user)
 returning id into v_id;
 insert into public.audit_events(actor_id,event_type,metadata) values(v_user,'estate.created',jsonb_build_object('estate_id',v_id));
 return v_id;
end $$;
revoke all on function public.landshop_estate_create(text,text,text,text,text) from public,anon;
grant execute on function public.landshop_estate_create(text,text,text,text,text) to authenticated;
create or replace function public.landshop_estate_transition(p_id uuid,p_status text,p_reason text)
 returns text language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_old text;v_owner uuid;v_state text;v_city text;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then raise exception 'Estate reviewer required';end if;
 if length(btrim(coalesce(p_reason,''))) not between 20 and 1000 or p_status not in ('review','published','archived')
 then raise exception 'Review decision and evidence required';end if;
 select status,created_by,state,city into v_old,v_owner,v_state,v_city from public.estates where id=p_id for update;
 if not found or not ((v_old='draft' and p_status='review') or (v_old='review' and p_status='published') or (v_old='published' and p_status='archived'))
 then raise exception 'Invalid estate review transition';end if;
 if p_status='published' and (v_owner=v_user or nullif(v_state,'') is null or nullif(v_city,'') is null)
 then raise exception 'Independent reviewer and verified state/city are required';end if;
 update public.estates set status=p_status where id=p_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'estate.status_changed',jsonb_build_object('estate_id',p_id,'previous',v_old,'status',p_status,'reason',btrim(p_reason)));
 return p_status;
end $$;
revoke all on function public.landshop_estate_transition(uuid,text,text) from public,anon;
grant execute on function public.landshop_estate_transition(uuid,text,text) to authenticated;
create or replace function public.landshop_property_update_draft(
 p_id uuid,p_title text,p_type text,p_estate uuid,p_amount_kobo bigint,p_sale_mode text,
 p_bedrooms integer,p_bathrooms integer,p_land_sqm numeric,p_floor_sqm numeric)
 returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_old text;
begin
 if v_user is null or not public.landshop_property_editor(v_user,false) then raise exception 'Staff authorization required';end if;
 select status into v_old from public.properties where id=p_id for update;
 if not found or v_old<>'draft' then raise exception 'Only draft property records can be edited; review/publication changes require a new approval cycle';end if;
 if length(btrim(coalesce(p_title,''))) not between 5 and 180
 or p_type not in ('land','house','apartment','commercial','shortlet')
 or (p_amount_kobo is not null and (p_amount_kobo<0 or p_amount_kobo>90000000000000))
 or (p_sale_mode is not null and p_sale_mode not in ('Buy','Rent','Shortlet'))
 or (p_bedrooms is not null and p_bedrooms not between 0 and 100)
 or (p_bathrooms is not null and p_bathrooms not between 0 and 100)
 or (p_land_sqm is not null and (p_land_sqm<=0 or p_land_sqm>100000000))
 or (p_floor_sqm is not null and (p_floor_sqm<=0 or p_floor_sqm>100000000))
 then raise exception 'Invalid property draft fields';end if;
 if p_estate is not null and not exists(select 1 from public.estates where id=p_estate)
 then raise exception 'Selected estate does not exist';end if;
 update public.properties set title=btrim(p_title),property_type=p_type,estate_id=p_estate,
 amount_kobo=p_amount_kobo,sale_mode=p_sale_mode,bedrooms=p_bedrooms,bathrooms=p_bathrooms,
 land_area_sqm=p_land_sqm,floor_area_sqm=p_floor_sqm,
 price_last_confirmed_at=case when amount_kobo is distinct from p_amount_kobo then null else price_last_confirmed_at end
 where id=p_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.draft_updated',jsonb_build_object('property_id',p_id,'estate_id',p_estate,'price_changed',true));
 return true;
end $$;
revoke all on function public.landshop_property_update_draft(uuid,text,text,uuid,bigint,text,integer,integer,numeric,numeric) from public,anon;
grant execute on function public.landshop_property_update_draft(uuid,text,text,uuid,bigint,text,integer,integer,numeric,numeric) to authenticated;
-- Sources are official Landshop posts or owner-named estates. Source figures are STARTING prices.
-- All seeded records deliberately remain drafts: no approved media, title, address, or availability has been supplied.
insert into public.estates(name,state,city,area,status,source_url,source_note)
select 'Famous Gardens','Lagos','Ibeju-Lekki','Eleko Junction','draft',
 'https://ng.linkedin.com/company/landshoplimited',
 'Landshop official company-page advertisement observed 2026-10-29. Exact plot address, title and current availability require staff confirmation.'
where not exists(select 1 from public.estates where lower(name)='famous gardens' and state='Lagos');
insert into public.estates(name,state,city,status,source_url,source_note)
select 'Merit Park','Lagos','Ibeju-Lekki','draft',
 'https://punchng.com/firm-prepares-own-your-home-product-for-youths-2/',
 'Historical Landshop development name; no current offer, selling price or availability confirmed.'
where not exists(select 1 from public.estates where lower(name)='merit park' and state='Lagos');
insert into public.properties(estate_id,title,property_type,amount_kobo,status,sale_mode,bedrooms,source_url,source_price_note)
select e.id,v.title,v.property_type,v.start_price_ngn*100,'draft','Buy',v.bedrooms,
 'https://ng.linkedin.com/company/landshoplimited',
 'Official Landshop company-page advertised FROM price (observed October 29, 2026); this is not a verified current unit offer. Reconfirm exact unit availability, title, rights and price before publication.'
from public.estates e
cross join (values
 ('Famous Gardens — 2-Bedroom Flat','apartment',2,85000000::bigint),
 ('Famous Gardens — 3-Bedroom Flat','apartment',3,95000000::bigint),
 ('Famous Gardens — 3-Bedroom Terrace','house',3,130000000::bigint)
) v(title,property_type,bedrooms,start_price_ngn)
where e.name='Famous Gardens' and e.state='Lagos'
and not exists(select 1 from public.properties p where p.estate_id=e.id and lower(p.title)=lower(v.title));

