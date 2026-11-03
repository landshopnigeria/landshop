-- Versioned public-site content; only trusted management can write.
create table public.landshop_site_content (
 id uuid primary key default gen_random_uuid(),
 route text not null check (length(route)<=300 and route ~ '^/([a-zA-Z0-9_-]+/?)*$' and route !~ '^/(api|auth|staff|admin|dashboard|sign|reset|account|newsletter)([/-]|$)'),
 selector text not null check(length(selector) between 1 and 2000 and selector like 'body > %'),
 kind text not null check(kind in ('text','link','image')),
 node_index integer not null default 0 check(node_index between 0 and 1000),
 original text not null check(length(original)<=10000),
 replacement text not null check(length(replacement)<=10000),
 state text not null default 'draft' check(state in ('draft','published','archived')),
 version integer not null default 1 check(version>0),
 reason text not null check(length(btrim(reason)) between 10 and 1000),
 updated_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(route,selector,kind,node_index),
 check(kind='text' or (replacement ~ '^/[^/]' and replacement !~ E'[\\\\\n\r\t]' or replacement='/') or (kind='link' and replacement ~ '^(https://|mailto:|tel:)' ) or (kind='image' and replacement ~ '^https://(www\.landshopnigeria\.com|landshopnigeria\.com|iwkfagzkogzidrbbezds\.supabase\.co)/'))
);
alter table public.landshop_site_content enable row level security;
grant select on public.landshop_site_content to anon,authenticated;
grant insert,update on public.landshop_site_content to authenticated;
create policy published_site_content on public.landshop_site_content for select to anon,authenticated using(state='published' or (select public.landshop_is_management(auth.uid())));
create policy managed_site_content_insert on public.landshop_site_content for insert to authenticated with check(updated_by=(select auth.uid()) and (select public.landshop_is_management(auth.uid())));
create policy managed_site_content_update on public.landshop_site_content for update to authenticated using((select public.landshop_is_management(auth.uid()))) with check(updated_by=(select auth.uid()) and (select public.landshop_is_management(auth.uid())));
create index landshop_site_content_public_lookup on public.landshop_site_content(route,state);
create index landshop_site_content_updated_by on public.landshop_site_content(updated_by);

-- Trigger guards direct table writes too; audit is atomic with the revision.
create function public.landshop_site_content_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.landshop_is_management(auth.uid()) then raise exception 'Management access required' using errcode='42501';end if;
 new.updated_by:=auth.uid();new.updated_at:=now();
 if tg_op='UPDATE' then
  if new.id<>old.id or new.route<>old.route or new.selector<>old.selector or new.kind<>old.kind or new.node_index<>old.node_index or new.original<>old.original then raise exception 'Content identity cannot be changed';end if;
  new.version:=old.version+1;new.created_at:=old.created_at;
 else new.version:=1;end if;
 insert into public.audit_events(actor_id,event_type,metadata) values(auth.uid(),'website_content_'||new.state,jsonb_build_object('content_id',new.id,'route',new.route,'kind',new.kind,'before',case when tg_op='UPDATE' then to_jsonb(old) else null end,'after',to_jsonb(new)));
 return new;
end $$;
revoke all on function public.landshop_site_content_audit() from public,anon,authenticated;
create trigger site_content_audit before insert or update on public.landshop_site_content for each row execute function public.landshop_site_content_audit();
create function public.landshop_site_content_save(p_route text,p_selector text,p_kind text,p_node integer,p_original text,p_replacement text,p_state text,p_expected integer,p_reason text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result public.landshop_site_content;
begin
 if auth.uid() is null or not public.landshop_is_management(auth.uid()) then raise exception 'Management access required' using errcode='42501';end if;
 if p_expected=0 then
  insert into public.landshop_site_content(route,selector,kind,node_index,original,replacement,state,reason) values(p_route,p_selector,p_kind,p_node,p_original,p_replacement,p_state,p_reason) returning * into result;
 else
  update public.landshop_site_content set replacement=p_replacement,state=p_state,reason=p_reason,updated_by=auth.uid() where route=p_route and selector=p_selector and kind=p_kind and node_index=p_node and original=p_original and version=p_expected returning * into result;
  if not found then raise exception 'Revision conflict. Reload this page before saving.' using errcode='40001';end if;
 end if;
 return to_jsonb(result);
end $$;
revoke all on function public.landshop_site_content_save(text,text,text,integer,text,text,text,integer,text) from public,anon;
grant execute on function public.landshop_site_content_save(text,text,text,integer,text,text,text,integer,text) to authenticated;

-- Narrow, management-authorized profile endpoint. Loads one tree level per request.
create function public.landshop_command_referral_people(p_parent uuid default null,p_after uuid default null,p_search text default '',p_limit integer default 30)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not public.landshop_is_management(auth.uid()) then raise exception 'Management access required' using errcode='42501';end if;
 if p_limit not between 1 and 100 or p_search is null or length(p_search)>160 then raise exception 'Invalid tree request';end if;
 with people as (
 select u.id,p.full_name,u.email,p.phone,p.kyc_status,u.created_at,c.code,s.photo_path,r.registration_number as realtor_registration_number,e.referrer_id as parent_id,
  (select count(*) from public.referral_edges child where child.referrer_id=u.id) as children
 from auth.users u left join public.profiles p on p.id=u.id left join public.referral_codes c on c.user_id=u.id
 left join public.landshop_staff_profiles s on s.user_id=u.id left join public.landshop_realtor_registrations r on r.user_id=u.id
 left join public.referral_edges e on e.referee_id=u.id
 where u.deleted_at is null and (p_after is null or u.id>p_after)
 and ((p_parent is not null and e.referrer_id=p_parent) or (p_parent is null and (p_search<>'' or e.referrer_id is null)))
 and (p_search='' or p.full_name ilike '%'||p_search||'%' or u.email ilike '%'||p_search||'%' or c.code ilike '%'||p_search||'%')
 order by u.id limit p_limit+1
 ), page as (select * from people order by id limit p_limit)
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page) order by id) from page),'[]'::jsonb),'has_more',(select count(*)>p_limit from people)) into result;
 return result;
end $$;
revoke all on function public.landshop_command_referral_people(uuid,uuid,text,integer) from public,anon;
grant execute on function public.landshop_command_referral_people(uuid,uuid,text,integer) to authenticated;

-- Immutable public website photographs, no SVG/HTML or arbitrary executable files.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('landshop-website-public','landshop-website-public',true,12582912,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy website_photos_read on storage.objects for select to anon,authenticated using(bucket_id='landshop-website-public');
create policy website_photos_upload on storage.objects for insert to authenticated with check(bucket_id='landshop-website-public' and (select public.landshop_is_management(auth.uid())) and (storage.foldername(name))[1]=(select auth.uid())::text);
