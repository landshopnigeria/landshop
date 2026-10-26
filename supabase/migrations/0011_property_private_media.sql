-- Property media is private by default. Public website may use only separately approved
-- editorial/marketing copies, never title or authority documents.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('landshop-property-private','landshop-property-private',false,26214400,
 array['image/jpeg','image/png','image/webp','application/pdf','video/mp4'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,
 allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.property_assets (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 kind text not null check(kind in ('property_image','title_document','marketing_authority','video')),
 object_path text not null unique,
 uploaded_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 status text not null default 'pending' check(status in ('pending','verified','rejected')),
 verified_by uuid references auth.users(id),
 verified_at timestamptz,
 reviewer_note text,
 constraint verified_has_reviewer check(
 (status='verified' and verified_by is not null and verified_at is not null)
 or status <> 'verified')
);
alter table public.property_assets enable row level security;
revoke all on public.property_assets from public,anon,authenticated;
grant select on public.property_assets to authenticated;

-- This policy gives legitimate staff a read-only inventory of pending assets.
drop policy if exists property_assets_staff_read on public.property_assets;
create policy property_assets_staff_read on public.property_assets for select to authenticated
using (public.landshop_property_editor((select auth.uid()),false));

drop policy if exists property_private_staff_read on storage.objects;
create policy property_private_staff_read on storage.objects for select to authenticated using (
 bucket_id='landshop-property-private'
 and public.landshop_property_editor((select auth.uid()),true)
);

drop policy if exists property_private_staff_upload on storage.objects;
create policy property_private_staff_upload on storage.objects for insert to authenticated with check (
 bucket_id='landshop-property-private'
 and public.landshop_property_editor((select auth.uid()),false)
 and exists (
 select 1 from public.properties p
 where p.id::text=(storage.foldername(name))[1] and p.status in ('draft','review')
 )
 and (storage.foldername(name))[2] in ('property_image','title_document','marketing_authority','video')
);

-- Registers only previously uploaded files owned by authorized Landshop staff.
create or replace function public.landshop_property_attach_asset(
 p_property uuid,p_kind text,p_object_path text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();v_id uuid;
begin
 if v_user is null or not public.landshop_property_editor(v_user,false) then
 raise exception 'Staff upload access required';end if;
 if p_kind not in ('property_image','title_document','marketing_authority','video')
   then raise exception 'Invalid asset type';end if;
 if p_object_path !~ ('^'||p_property::text||'/'||p_kind||'/[a-zA-Z0-9_.-]{1,160}$')
   then raise exception 'Unexpected object path';end if;
 if not exists(select 1 from public.properties p
               where p.id=p_property and p.status in ('draft','review')) then
   raise exception 'Only editable properties accept uploads';end if;
 if not exists(select 1 from storage.objects o
  where o.bucket_id='landshop-property-private' and o.name=p_object_path) then
   raise exception 'Uploaded object not found';end if;
 insert into public.property_assets(property_id,kind,object_path,uploaded_by)
 values(p_property,p_kind,p_object_path,v_user) returning id into v_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.asset.attached',jsonb_build_object('asset_id',v_id,'property_id',p_property));
 return v_id;
end $$;
revoke all on function public.landshop_property_attach_asset(uuid,text,text) from public,anon;
grant execute on function public.landshop_property_attach_asset(uuid,text,text) to authenticated;

-- An independent reviewer verifies each real owner/developer image or title record.
create or replace function public.landshop_property_verify_asset(
 p_asset uuid,p_approve boolean,p_reason text)
returns text language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();v_asset public.property_assets%rowtype;v_status text;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then
  raise exception 'Authorized reviewer required';end if;
 if char_length(btrim(coalesce(p_reason,''))) not between 15 and 1000 then
  raise exception 'A review justification of 15–1000 characters is required';end if;
 select * into v_asset from public.property_assets where id=p_asset for update;
 if not found or v_asset.status<>'pending' then raise exception 'Asset cannot be reviewed';end if;
 if v_asset.uploaded_by=v_user then raise exception 'Uploader cannot verify their own asset';end if;
 if not exists(select 1 from storage.objects
  where bucket_id='landshop-property-private' and name=v_asset.object_path)
  then raise exception 'Original object missing';end if;
 v_status:=case when p_approve then 'verified' else 'rejected' end;
 update public.property_assets
 set status=v_status,verified_by=v_user,verified_at=now(),reviewer_note=btrim(p_reason)
 where id=p_asset;
 if p_approve and v_asset.kind <> 'video' then
   insert into public.property_verification_evidence(property_id,evidence_type,object_path,verified_by,reviewer_note)
   values(v_asset.property_id,case when v_asset.kind='property_image' then 'approved_property_image'
   else v_asset.kind end,v_asset.object_path,v_user,btrim(p_reason))
   on conflict(property_id,evidence_type,object_path) do nothing;
 end if;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.asset.reviewed',jsonb_build_object('asset_id',p_asset,'status',v_status));
 return v_status;
end $$;
revoke all on function public.landshop_property_verify_asset(uuid,boolean,text) from public,anon;
grant execute on function public.landshop_property_verify_asset(uuid,boolean,text) to authenticated;

-- Existing public property views stay published-only. Owners' documents remain private.
