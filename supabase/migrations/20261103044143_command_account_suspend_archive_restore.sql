-- Reversible account removal preserves submitted evidence and financial/audit history.
create table public.landshop_account_controls(
 user_id uuid primary key references auth.users(id),
 state text not null check(state in ('active','suspended','archived')),
 reason text not null check(length(btrim(reason)) between 10 and 1000),
 changed_by uuid not null references auth.users(id),
 changed_at timestamptz not null default now()
);
alter table public.landshop_account_controls enable row level security;
grant select on public.landshop_account_controls to authenticated;
create policy command_account_controls_read on public.landshop_account_controls for select to authenticated
 using(user_id=(select auth.uid()) or public.landshop_is_management((select auth.uid())));

create function public.landshop_my_account_state()
returns text language sql stable security definer set search_path='' as $$
 select case when auth.uid() is null then 'signed_out' else coalesce((select state from public.landshop_account_controls where user_id=auth.uid()),'active') end;
$$;
revoke all on function public.landshop_my_account_state() from public,anon;
grant execute on function public.landshop_my_account_state() to authenticated;

-- No returned private data; this hook must also run for anonymous public requests.
create function public.landshop_assert_account_access()
returns void language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is not null and exists(select 1 from public.landshop_account_controls where user_id=auth.uid() and state<>'active')
 and coalesce(current_setting('request.path',true),'')<>'/rpc/landshop_my_account_state'
 then raise exception 'Account access is suspended or archived' using errcode='42501'; end if;
end $$;
revoke all on function public.landshop_assert_account_access() from public;
grant execute on function public.landshop_assert_account_access() to anon,authenticated,service_role;
alter role authenticator set pgrst.db_pre_request='public.landshop_assert_account_access';
notify pgrst,'reload config';

-- Storage uses RLS directly instead of the Data API hook.
create policy landshop_account_storage_access on storage.objects as restrictive for all to authenticated
 using((select public.landshop_my_account_state())='active')
 with check((select public.landshop_my_account_state())='active');

create function public.landshop_command_account_state(p_user uuid,p_state text,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); previous text;
begin
 if actor is null or not public.landshop_is_management(actor) or public.landshop_my_account_state()<>'active' then raise exception 'Active management access required' using errcode='42501'; end if;
 if p_state is null or p_state not in ('active','suspended','archived') or p_reason is null or length(btrim(p_reason)) not between 10 and 1000 then raise exception 'Valid account state and reason required'; end if;
 if p_user=actor then raise exception 'Self-suspension and self-removal are blocked'; end if;
 if not exists(select 1 from auth.users where id=p_user and deleted_at is null) then raise exception 'Account not found'; end if;
 if exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id where m.user_id=p_user and o.kind='landshop' and m.role in ('owner','ceo','founder','admin','technology_officer','technology_consultant'))
 and not exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id where m.user_id=actor and o.kind='landshop' and m.role='owner' and m.status='active')
 then raise exception 'Only an Owner can restrict or restore a management account' using errcode='42501'; end if;
 select state into previous from public.landshop_account_controls where user_id=p_user for update;
 insert into public.landshop_account_controls(user_id,state,reason,changed_by) values(p_user,p_state,btrim(p_reason),actor)
 on conflict(user_id) do update set state=excluded.state,reason=excluded.reason,changed_by=actor,changed_at=now();
 insert into public.audit_events(actor_id,event_type,metadata) values(actor,'account_access_changed',jsonb_build_object('user_id',p_user,'previous_state',coalesce(previous,'active'),'state',p_state,'reason',btrim(p_reason)));
 return true;
end $$;
revoke all on function public.landshop_command_account_state(uuid,text,text) from public,anon;
grant execute on function public.landshop_command_account_state(uuid,text,text) to authenticated;

create or replace function public.landshop_is_management(p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select not exists(select 1 from public.landshop_account_controls where user_id=p_user and state<>'active') and exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=p_user and m.status='active' and o.kind='landshop'
 and m.role in ('owner','ceo','founder','admin','technology_officer','technology_consultant')
 and (m.role='owner' or exists(select 1 from public.landshop_management_assignments a where a.claimed_by=p_user and a.status='claimed' and a.role=m.role)
 or exists(select 1 from public.landshop_staff_profiles p where p.user_id=m.user_id and p.organization_id=m.organization_id and p.kyc_state='approved' and p.employment_state='active')));
$$;
revoke all on function public.landshop_is_management(uuid) from public,anon;
grant execute on function public.landshop_is_management(uuid) to authenticated;

create or replace function public.landshop_command_directory(p_search text default '',p_offset integer default 0,p_limit integer default 50)
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
   coalesce(ac.state,'active') as account_state,
   coalesce((select jsonb_agg(jsonb_build_object('role',m.role,'status',m.status)) from public.organization_members m join public.organizations o on o.id=m.organization_id where m.user_id=u.id and o.kind='landshop'),'[]'::jsonb) as memberships
  from auth.users u left join public.profiles p on p.id=u.id
   left join public.landshop_staff_profiles s on s.user_id=u.id
   left join public.landshop_realtor_registrations r on r.user_id=u.id
   left join public.landshop_account_controls ac on ac.user_id=u.id
  where u.deleted_at is null and (p_search='' or u.email ilike '%'||p_search||'%' or p.full_name ilike '%'||p_search||'%' or s.staff_number ilike '%'||p_search||'%' or r.registration_number ilike '%'||p_search||'%')
 ), page as (select * from accounts order by created_at desc,id offset p_offset limit p_limit)
 select jsonb_build_object('total',(select count(*) from accounts),'rows',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb)) into result;
 insert into public.audit_events(actor_id,event_type,metadata) values(actor,'command_directory_viewed',jsonb_build_object('offset',p_offset,'limit',p_limit,'returned',jsonb_array_length(result->'rows')));
 return result;
end $$;
revoke all on function public.landshop_command_directory(text,integer,integer) from public,anon;
grant execute on function public.landshop_command_directory(text,integer,integer) to authenticated;


-- Realtime and other direct RLS clients must enforce the same account restriction.
DO $policies$
DECLARE target record;
BEGIN
 FOR target IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity AND c.relname<>'landshop_account_controls'
 LOOP
  EXECUTE format('CREATE POLICY landshop_active_account_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((select public.landshop_my_account_state())=''active'') WITH CHECK ((select public.landshop_my_account_state())=''active'')',target.relname);
 END LOOP;
END $policies$;
