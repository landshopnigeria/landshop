-- Management-only account directory. Auth credentials, tokens and identity files are never returned.
create table public.landshop_realtor_registrations (
 user_id uuid primary key references auth.users(id) on delete cascade,
 registration_number text not null check(length(btrim(registration_number)) between 2 and 80),
 issuing_body text not null default '' check(length(issuing_body)<=160),
 updated_at timestamptz not null default now()
);
alter table public.landshop_realtor_registrations enable row level security;
grant select,insert,update on public.landshop_realtor_registrations to authenticated;
create policy realtor_read on public.landshop_realtor_registrations for select to authenticated
 using(user_id=(select auth.uid()) or public.landshop_is_management((select auth.uid())));
create policy realtor_insert on public.landshop_realtor_registrations for insert to authenticated
 with check(user_id=(select auth.uid()));
create policy realtor_update on public.landshop_realtor_registrations for update to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create function public.landshop_command_directory(p_search text default '',p_offset integer default 0,p_limit integer default 50)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; actor uuid:=auth.uid();
begin
 if actor is null or not public.landshop_is_management(actor) then raise exception 'Management access required' using errcode='42501'; end if;
 if p_offset is null or p_offset<0 or p_limit is null or p_limit<1 or p_limit>100 or p_search is null or length(p_search)>160 then raise exception 'Invalid directory request'; end if;
 with accounts as (
  select u.id,u.email,p.full_name,p.phone,p.kyc_status,u.created_at,
   (u.banned_until>now()) as sign_in_suspended,
   case when exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id where m.user_id=u.id and m.status='active' and o.kind='landshop' and m.role in ('owner','ceo','founder','admin','technology_officer','technology_consultant')) then 'management'
    when s.user_id is not null then 'staff' else 'customer' end as account_type,
   s.username,s.staff_number,s.requested_role,s.employment_state,s.kyc_state,
   r.registration_number as realtor_registration_number,r.issuing_body,
   coalesce((select jsonb_agg(jsonb_build_object('role',m.role,'status',m.status)) from public.organization_members m join public.organizations o on o.id=m.organization_id where m.user_id=u.id and o.kind='landshop'),'[]'::jsonb) as memberships
  from auth.users u left join public.profiles p on p.id=u.id
   left join public.landshop_staff_profiles s on s.user_id=u.id
   left join public.landshop_realtor_registrations r on r.user_id=u.id
  where u.deleted_at is null and (p_search='' or u.email ilike '%'||p_search||'%' or p.full_name ilike '%'||p_search||'%' or s.staff_number ilike '%'||p_search||'%' or r.registration_number ilike '%'||p_search||'%')
 ), page as (select * from accounts order by created_at desc,id offset p_offset limit p_limit)
 select jsonb_build_object('total',(select count(*) from accounts),'rows',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb)) into result;
 insert into public.audit_events(actor_id,event_type,metadata) values(actor,'command_directory_viewed',jsonb_build_object('offset',p_offset,'limit',p_limit,'returned',jsonb_array_length(result->'rows')));
 return result;
end $$;
revoke all on function public.landshop_command_directory(text,integer,integer) from public,anon;
grant execute on function public.landshop_command_directory(text,integer,integer) to authenticated;

create function public.landshop_command_update_profile(p_user uuid,p_name text,p_phone text,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); previous jsonb;
begin
 if actor is null or not public.landshop_is_management(actor) then raise exception 'Management access required' using errcode='42501'; end if;
 if p_name is null or length(btrim(p_name)) not between 1 and 160 or p_phone is null or length(p_phone)>40 or p_reason is null or length(btrim(p_reason)) not between 10 and 1000 then raise exception 'Valid name, phone and reason required'; end if;
 select jsonb_build_object('full_name',full_name,'phone',phone) into previous from public.profiles where id=p_user for update;
 if not found then raise exception 'Profile not found'; end if;
 update public.profiles set full_name=btrim(p_name),phone=btrim(p_phone) where id=p_user;
 insert into public.audit_events(actor_id,event_type,metadata) values(actor,'command_profile_updated',jsonb_build_object('user_id',p_user,'before',previous,'after',jsonb_build_object('full_name',btrim(p_name),'phone',btrim(p_phone)),'reason',btrim(p_reason)));
 return true;
end $$;
revoke all on function public.landshop_command_update_profile(uuid,text,text,text) from public,anon;
grant execute on function public.landshop_command_update_profile(uuid,text,text,text) to authenticated;
