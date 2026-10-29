-- Applied to live Landshop Supabase as migration 20261029171412 / landshop_property_showcase_engine_v19.
-- Reproducible schema source.
-- LANDSHOP V19 / additive property showcase engine.
-- Public reads require an already-published property and separately-reviewed content.
create table if not exists public.property_showcase_drafts (
 property_id uuid primary key references public.properties(id) on delete cascade,
 payload jsonb not null default '{}'::jsonb,
 edited_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now()
);
create table if not exists public.property_showcase (
 property_id uuid primary key references public.properties(id) on delete cascade,
 payload jsonb not null,
 location_verified boolean not null default false,
 approved_by uuid not null references auth.users(id),
 approved_at timestamptz not null default now()
);
create table if not exists public.property_showcase_media (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 kind text not null check (kind in ('photo','floorplan')),
 object_path text not null unique,
 source_asset_id uuid references public.property_assets(id),
 title text not null default '',
 position integer not null default 0 check (position between 0 and 99),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 submitted_by uuid not null references auth.users(id),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 review_note text,
 created_at timestamptz not null default now()
);
create index if not exists property_showcase_media_public_idx on public.property_showcase_media(property_id,kind,status,position);
alter table public.property_showcase_drafts enable row level security;
alter table public.property_showcase enable row level security;
alter table public.property_showcase_media enable row level security;
revoke all on public.property_showcase_drafts,public.property_showcase,public.property_showcase_media from public,anon,authenticated;
grant select on public.property_showcase to anon,authenticated;
grant select on public.property_showcase_media to anon,authenticated;
grant select on public.property_showcase_drafts to authenticated;
drop policy if exists ls_showcase_drafts_staff on public.property_showcase_drafts;
create policy ls_showcase_drafts_staff on public.property_showcase_drafts for select to authenticated using (
 public.landshop_property_editor((select auth.uid()),false)
);
drop policy if exists ls_showcase_public on public.property_showcase;
create policy ls_showcase_public on public.property_showcase for select to anon,authenticated using (
 exists(select 1 from public.properties p where p.id=property_id and p.status='published')
);
drop policy if exists ls_showcase_media_public on public.property_showcase_media;
create policy ls_showcase_media_public on public.property_showcase_media for select to anon,authenticated using (
 status='approved' and exists(select 1 from public.properties p where p.id=property_id and p.status='published')
);
drop policy if exists ls_showcase_media_staff on public.property_showcase_media;
create policy ls_showcase_media_staff on public.property_showcase_media for select to authenticated using (
 public.landshop_property_editor((select auth.uid()),false)
);
-- Public bucket holds *only* uploadable marketing derivatives, never title or KYC files.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('landshop-property-public','landshop-property-public',true,20971520,
array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,
allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists ls_public_property_derivative_upload on storage.objects;
create policy ls_public_property_derivative_upload on storage.objects for insert to authenticated with check (
 bucket_id='landshop-property-public'
 and public.landshop_property_editor((select auth.uid()),false)
 and (storage.foldername(name))[2] in ('photo','floorplan')
 and exists(select 1 from public.properties p
   where p.id::text=(storage.foldername(name))[1] and p.status in ('draft','review','published'))
 and name ~ '^[0-9a-f-]{36}/(photo|floorplan)/[a-zA-Z0-9_-]{20,80}\.(webp|png|jpg|jpeg|pdf)$'
);
-- Save a draft only as the authenticated, authorized editor.
create or replace function public.landshop_showcase_save(p_property uuid,p_payload jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_key text;v_videos jsonb;v_video jsonb;v_url text;
begin
 if v_user is null or not public.landshop_property_editor(v_user,false) then raise exception 'Not an authorized property editor';end if;
 if not exists(select 1 from public.properties where id=p_property and status in ('draft','review','published')) then raise exception 'Property is not editable';end if;
 if jsonb_typeof(p_payload)<>'object' or length(p_payload::text)>32000 then raise exception 'Invalid showcase payload';end if;
 for v_key in select jsonb_object_keys(p_payload) loop
  if v_key not in ('description','address_line','landmark','city','state','lga','postal_code','latitude','longitude','features','amenities','pricing','videos')
  then raise exception 'Unrecognized field: %',v_key;end if;
 end loop;
 for v_key in select unnest(array['description','address_line','landmark','city','state','lga','postal_code']) loop
  if p_payload ? v_key and jsonb_typeof(p_payload->v_key)<>'string' then raise exception 'Invalid text field %',v_key;end if;
 end loop;
 if length(coalesce(p_payload->>'description',''))>6000 or length(coalesce(p_payload->>'address_line',''))>350
 or length(coalesce(p_payload->>'city',''))>100 or length(coalesce(p_payload->>'state',''))>100
 then raise exception 'Text field exceeds permitted length';end if;
 if p_payload ? 'latitude' and (jsonb_typeof(p_payload->'latitude') not in ('number','null')
 or (jsonb_typeof(p_payload->'latitude')='number' and (p_payload->>'latitude')::numeric not between -90 and 90))
 then raise exception 'Invalid latitude';end if;
 if p_payload ? 'longitude' and (jsonb_typeof(p_payload->'longitude') not in ('number','null')
 or (jsonb_typeof(p_payload->'longitude')='number' and (p_payload->>'longitude')::numeric not between -180 and 180))
 then raise exception 'Invalid longitude';end if;
 for v_key in select unnest(array['features','amenities','pricing','videos']) loop
  if p_payload ? v_key and jsonb_typeof(p_payload->v_key)<>'array' then raise exception 'Invalid array %',v_key;end if;
  if jsonb_array_length(coalesce(p_payload->v_key,'[]'::jsonb))>30 then raise exception 'Too many %',v_key;end if;
 end loop;
 for v_video in select value from jsonb_array_elements(coalesce(p_payload->'videos','[]'::jsonb)) loop
  if jsonb_typeof(v_video)<>'object' then raise exception 'Invalid video item';end if;
  v_url:=coalesce(v_video->>'url','');
  if length(v_url)>1000 or v_url !~* '^https://(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com|instagram\.com|tiktok\.com|m\.tiktok\.com|vimeo\.com)/'
  then raise exception 'Video must use YouTube, Instagram, TikTok or Vimeo HTTPS';end if;
 end loop;
 insert into public.property_showcase_drafts(property_id,payload,edited_by,updated_at)
 values(p_property,p_payload,v_user,now())
 on conflict(property_id) do update set payload=excluded.payload,edited_by=excluded.edited_by,updated_at=now();
 insert into public.audit_events(actor_id,event_type,metadata) values(v_user,'property.showcase.draft_saved',jsonb_build_object('property_id',p_property));
 return true;
end $$;
revoke all on function public.landshop_showcase_save(uuid,jsonb) from public,anon;
grant execute on function public.landshop_showcase_save(uuid,jsonb) to authenticated;
-- Separate reviewer signs off the current snapshot and explicitly verifies exact address/coordinates.
create or replace function public.landshop_showcase_approve(p_property uuid,p_confirm_pin boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_draft public.property_showcase_drafts%rowtype;v_verified boolean;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then raise exception 'Independent reviewer required';end if;
 select * into v_draft from public.property_showcase_drafts where property_id=p_property for update;
 if not found then raise exception 'Save showcase details before approval';end if;
 if v_draft.edited_by=v_user then raise exception 'A second authorized person must approve the showcase';end if;
 if not exists(select 1 from public.properties where id=p_property and status in ('review','published')) then raise exception 'Property must be in review or published';end if;
 if length(btrim(coalesce(v_draft.payload->>'description','')))<30 then raise exception 'Provide a complete property description';end if;
 v_verified=coalesce(p_confirm_pin,false) and length(btrim(coalesce(v_draft.payload->>'address_line','')))>8
  and length(btrim(coalesce(v_draft.payload->>'city','')))>1
  and length(btrim(coalesce(v_draft.payload->>'state','')))>1
  and jsonb_typeof(v_draft.payload->'latitude')='number'
  and jsonb_typeof(v_draft.payload->'longitude')='number';
 insert into public.property_showcase(property_id,payload,location_verified,approved_by,approved_at)
 values(p_property,v_draft.payload,v_verified,v_user,now())
 on conflict(property_id) do update set payload=excluded.payload,location_verified=excluded.location_verified,
 approved_by=excluded.approved_by,approved_at=now();
 insert into public.audit_events(actor_id,event_type,metadata) values(v_user,'property.showcase.approved',jsonb_build_object('property_id',p_property,'map_verified',v_verified));
 return true;
end $$;
revoke all on function public.landshop_showcase_approve(uuid,boolean) from public,anon;
grant execute on function public.landshop_showcase_approve(uuid,boolean) to authenticated;
-- Staff register marketing derivative after upload; approval remains independent.
create or replace function public.landshop_showcase_submit_media(
 p_property uuid,p_kind text,p_path text,p_title text,p_source_asset uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_id uuid;v_type text;
begin
 if v_user is null or not public.landshop_property_editor(v_user,false) then raise exception 'Property editor required';end if;
 if p_kind not in ('photo','floorplan') then raise exception 'Invalid gallery media kind';end if;
 if p_path !~ ('^'||p_property::text||'/'||p_kind||'/[a-zA-Z0-9_-]{20,80}\.(webp|png|jpg|jpeg|pdf)$')
 then raise exception 'Invalid media path';end if;
 if p_kind='photo' and p_path !~* '\.(webp|png|jpg|jpeg)$' then raise exception 'Photographs cannot be PDFs';end if;
 if length(btrim(coalesce(p_title,''))) not between 3 and 140 then raise exception 'Give media a short description';end if;
 if p_kind='photo' and not exists(select 1 from public.property_assets a where a.id=p_source_asset
 and a.property_id=p_property and a.kind='property_image' and a.status='verified') then raise exception 'Original owner photo must first pass evidence review';end if;
 if not exists(select 1 from public.properties where id=p_property and status in ('draft','review','published')) then raise exception 'Property not editable';end if;
 if not exists(select 1 from storage.objects where bucket_id='landshop-property-public' and name=p_path) then raise exception 'Public derivative not uploaded';end if;
 insert into public.property_showcase_media(property_id,kind,object_path,source_asset_id,title,submitted_by)
 values(p_property,p_kind,p_path,p_source_asset,btrim(p_title),v_user) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.landshop_showcase_submit_media(uuid,text,text,text,uuid) from public,anon;
grant execute on function public.landshop_showcase_submit_media(uuid,text,text,text,uuid) to authenticated;
create or replace function public.landshop_showcase_review_media(p_media uuid,p_approve boolean,p_note text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_media public.property_showcase_media%rowtype;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then raise exception 'Reviewer required';end if;
 if length(btrim(coalesce(p_note,''))) not between 15 and 1000 then raise exception 'Document image identity and publishing rights';end if;
 select * into v_media from public.property_showcase_media where id=p_media for update;
 if not found or v_media.status<>'pending' then raise exception 'Media item not pending';end if;
 if v_media.submitted_by=v_user then raise exception 'An independent reviewer must approve media';end if;
 if not exists(select 1 from storage.objects where bucket_id='landshop-property-public' and name=v_media.object_path) then raise exception 'Uploaded object missing';end if;
 if v_media.kind='photo' and not exists(select 1 from public.property_assets a where a.id=v_media.source_asset_id
 and a.property_id=v_media.property_id and a.status='verified' and a.kind='property_image') then raise exception 'Original photo evidence not verified';end if;
 update public.property_showcase_media set status=case when p_approve then 'approved' else 'rejected' end,
 reviewed_by=v_user,reviewed_at=now(),review_note=btrim(p_note) where id=p_media;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.showcase.media_reviewed',jsonb_build_object('media_id',p_media,'approved',p_approve));
 return true;
end $$;
revoke all on function public.landshop_showcase_review_media(uuid,boolean,text) from public,anon;
grant execute on function public.landshop_showcase_review_media(uuid,boolean,text) to authenticated;

