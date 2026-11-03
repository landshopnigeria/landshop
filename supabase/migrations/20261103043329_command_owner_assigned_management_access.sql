-- Trusted owner assignments, not public signup role choices, authorize management.
create table public.landshop_management_assignments (
 email text primary key check(email=lower(btrim(email)) and length(email)<=254),
 role text not null check(role in ('owner','ceo','founder','admin','technology_officer','technology_consultant')),
 assigned_by uuid not null references auth.users(id),
 reason text not null,
 status text not null default 'pending' check(status in ('pending','claimed')),
 expires_at timestamptz not null default (now()+interval '14 days'),
 claimed_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 claimed_at timestamptz
);
alter table public.landshop_management_assignments enable row level security;
grant select on public.landshop_management_assignments to authenticated;
create policy management_assignment_owner_read on public.landshop_management_assignments for select to authenticated using (
 exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id where m.user_id=(select auth.uid()) and m.role='owner' and m.status='active' and o.kind='landshop')
);

create function public.landshop_command_assign_management(p_email text,p_role text,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); address text:=lower(btrim(p_email));
begin
 if actor is null or not public.landshop_is_management(actor) or not exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id where m.user_id=actor and m.role='owner' and m.status='active' and o.kind='landshop') then raise exception 'Only an active Owner can assign management access' using errcode='42501'; end if;
 if address is null or length(address)>254 or address !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or p_role is null or p_role not in ('owner','ceo','founder','admin','technology_officer','technology_consultant') or p_reason is null or length(btrim(p_reason)) not between 10 and 1000 then raise exception 'Valid email, management role and reason required'; end if;
 if exists(select 1 from auth.users u join public.organization_members m on m.user_id=u.id join public.organizations o on o.id=m.organization_id where lower(u.email)=address and m.role='owner' and m.status='active' and o.kind='landshop') then raise exception 'This account already has Owner access'; end if;
 insert into public.landshop_management_assignments(email,role,assigned_by,reason) values(address,p_role,actor,btrim(p_reason))
 on conflict(email) do update set role=excluded.role,assigned_by=actor,reason=excluded.reason,status='pending',expires_at=now()+interval '14 days',claimed_by=null,claimed_at=null;
 insert into public.audit_events(actor_id,event_type,metadata) values(actor,'management_access_assigned',jsonb_build_object('email',address,'role',p_role,'reason',btrim(p_reason)));
 return true;
end $$;
revoke all on function public.landshop_command_assign_management(text,text,text) from public,anon;
grant execute on function public.landshop_command_assign_management(text,text,text) to authenticated;

create function public.landshop_claim_management_assignment()
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); address text; assignment public.landshop_management_assignments%rowtype; org uuid; previous_role text;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501'; end if;
 select lower(email) into address from auth.users where id=actor and email_confirmed_at is not null and deleted_at is null and (banned_until is null or banned_until<now());
 if address is null then return false; end if;
 select * into assignment from public.landshop_management_assignments where email=address and status='pending' and expires_at>now() for update;
 if not found then return false; end if;
 select o.id into org from public.organizations o join public.organization_members m on m.organization_id=o.id where o.kind='landshop' and m.user_id=assignment.assigned_by and m.role='owner' and m.status='active';
 if org is null then raise exception 'Assignment issuer is no longer an active Owner'; end if;
 select role into previous_role from public.organization_members where organization_id=org and user_id=actor for update;
 if previous_role='owner' then raise exception 'Owner role cannot be replaced by an assignment'; end if;
 if exists(select 1 from public.organization_members where organization_id=org and user_id=actor and status in ('suspended','revoked')) then raise exception 'Suspended access requires an independent reinstatement'; end if;
 insert into public.organization_members(organization_id,user_id,role,status,invited_by) values(org,actor,assignment.role,'active',assignment.assigned_by)
 on conflict(organization_id,user_id) do update set role=excluded.role,status='active',invited_by=excluded.invited_by;
 update public.landshop_management_assignments set status='claimed',claimed_by=actor,claimed_at=now() where email=address;
 insert into public.audit_events(actor_id,event_type,metadata) values(actor,'management_assignment_claimed',jsonb_build_object('role',assignment.role,'assigned_by',assignment.assigned_by,'organization_id',org));
 return true;
end $$;
revoke all on function public.landshop_claim_management_assignment() from public,anon;
grant execute on function public.landshop_claim_management_assignment() to authenticated;

-- Explicit Owner assignments establish company authorization independently of staff KYC.
-- Staff identity status is preserved and never fabricated by an access assignment.
create or replace function public.landshop_is_management(p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=p_user and m.status='active' and o.kind='landshop'
 and m.role in ('owner','ceo','founder','admin','technology_officer','technology_consultant')
 and (m.role='owner' or exists(select 1 from public.landshop_management_assignments a where a.claimed_by=p_user and a.status='claimed' and a.role=m.role)
 or exists(select 1 from public.landshop_staff_profiles p where p.user_id=m.user_id and p.organization_id=m.organization_id and p.kyc_state='approved' and p.employment_state='active')));
$$;
revoke all on function public.landshop_is_management(uuid) from public,anon;
grant execute on function public.landshop_is_management(uuid) to authenticated;
