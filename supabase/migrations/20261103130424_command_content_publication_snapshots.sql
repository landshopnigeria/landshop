-- Keep the current live revision while a new draft is edited. No draft/audit
-- fields are available to public website clients.
create table public.landshop_site_content_public (
 content_id uuid primary key references public.landshop_site_content(id) on delete cascade,
 route text not null,selector text not null,kind text not null,node_index integer not null,
 original text not null,replacement text not null,version integer not null,active boolean not null default true,published_at timestamptz not null default now()
);
alter table public.landshop_site_content_public enable row level security;
grant select on public.landshop_site_content_public to anon,authenticated;
create policy site_content_public_read on public.landshop_site_content_public for select to anon,authenticated using(active);
create index site_content_public_route on public.landshop_site_content_public(route);
create policy managed_site_content_read on public.landshop_site_content as restrictive for select to anon,authenticated using((select public.landshop_is_management(auth.uid())));
create function public.landshop_site_content_publish() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.landshop_is_management(auth.uid()) then raise exception 'Management access required' using errcode='42501';end if;
 if new.state='published' then
 insert into public.landshop_site_content_public(content_id,route,selector,kind,node_index,original,replacement,version) values(new.id,new.route,new.selector,new.kind,new.node_index,new.original,new.replacement,new.version)
 on conflict(content_id) do update set replacement=excluded.replacement,version=excluded.version,active=true,published_at=now();
 elsif new.state='archived' then update public.landshop_site_content_public set active=false where content_id=new.id;
 end if;
 return new;
end $$;
revoke all on function public.landshop_site_content_publish() from public,anon,authenticated;
create trigger site_content_publish after insert or update on public.landshop_site_content for each row execute function public.landshop_site_content_publish();
