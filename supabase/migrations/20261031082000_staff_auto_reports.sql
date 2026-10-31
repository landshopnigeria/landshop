-- LANDSHOP V27 | Verified-email automatic standard staff access, task acceptance
-- and auditable departmental daily/monthly submissions.
-- IMPORTANT: self-service onboarding can NEVER assign a management/owner/HR role.
create schema if not exists landshop_private;
revoke all on schema landshop_private from public,anon,authenticated;
create or replace function landshop_private.activate_verified_staff(
 p_user uuid,p_username text,p_age integer,p_gender text,p_requested_role text
) returns boolean language plpgsql security definer set search_path='' as $$
declare v_org uuid;v_existing_status text;v_profile_state text;
begin
 if p_user is null or not exists(
  select 1 from auth.users u where u.id=p_user
   and u.email_confirmed_at is not null
   and u.raw_user_meta_data->>'staff_signup'='true'
 ) then raise exception 'Verified staff registration is required';end if;
 if p_username !~ '^[a-zA-Z][a-zA-Z0-9_.]{2,29}$'
  or p_age not between 18 and 120
  or p_gender not in ('female','male','non_binary','prefer_not_to_say')
  or p_requested_role not in ('owner','ceo','founder','admin','executive','operations','head_finance','hr_officer',
  'technology_officer','technology_consultant','social_media_manager','customer_service_manager','department_manager',
  'sales','legal','marketing','staff','youth_corps','intern')
 then raise exception 'Invalid staff registration details';end if;
 select id into v_org from public.organizations where kind='landshop' order by created_at limit 1;
 if v_org is null then raise exception 'Landshop organization unavailable';end if;
 select employment_state into v_profile_state from public.landshop_staff_profiles where user_id=p_user for update;
 if v_profile_state in ('suspended','ended') then raise exception 'Staff access is suspended or ended';end if;
 select status into v_existing_status from public.organization_members
  where organization_id=v_org and user_id=p_user for update;
 if v_existing_status in ('suspended','revoked') then raise exception 'Membership is suspended or revoked';end if;
 insert into public.landshop_staff_profiles
  (user_id,organization_id,username,age_at_registration,gender,requested_role,
   employment_state,joined_at,staff_number)
 values(p_user,v_org,lower(p_username),p_age,p_gender,p_requested_role,'active',now(),
   'LNS-'||upper(substr(replace(p_user::text,'-',''),1,12)))
 on conflict(user_id) do update set
  employment_state=case when public.landshop_staff_profiles.employment_state='pending' then 'active'
    else public.landshop_staff_profiles.employment_state end,
  joined_at=coalesce(public.landshop_staff_profiles.joined_at,now()),
  staff_number=coalesce(public.landshop_staff_profiles.staff_number,excluded.staff_number),
  updated_at=now()
  where public.landshop_staff_profiles.employment_state not in ('suspended','ended');
 -- This is an unprivileged baseline membership only; requested titles are never granted.
 insert into public.organization_members(organization_id,user_id,role,status)
 values(v_org,p_user,'staff','active')
 on conflict(organization_id,user_id) do update
 set status='active'
 where public.organization_members.role='staff' and public.organization_members.status='invited';
 insert into public.audit_events(actor_id,event_type,metadata)
 values(p_user,'staff.standard_access_activated',
  jsonb_build_object('requested_role',p_requested_role,'granted_role','staff','source','verified_email'));
 return true;
end $$;
revoke all on function landshop_private.activate_verified_staff(uuid,text,integer,text,text) from public,anon,authenticated;

create or replace function public.landshop_staff_onboard(
 p_username text,p_age integer,p_gender text,p_requested_role text
) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if (select auth.uid()) is null then raise exception 'Sign in after verifying your email';end if;
 return landshop_private.activate_verified_staff(
  (select auth.uid()),p_username,p_age,p_gender,p_requested_role);
end $$;
revoke all on function public.landshop_staff_onboard(text,integer,text,text) from public,anon;
grant execute on function public.landshop_staff_onboard(text,integer,text,text) to authenticated;

create or replace function landshop_private.activate_staff_confirmation()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.email_confirmed_at is not null
  and (tg_op='INSERT' or old.email_confirmed_at is null)
  and new.raw_user_meta_data->>'staff_signup'='true' then
  begin
   perform landshop_private.activate_verified_staff(
    new.id,
    new.raw_user_meta_data->>'preferred_username',
    (new.raw_user_meta_data->>'age_at_registration')::integer,
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'requested_role');
  exception when others then
   -- Never prevent confirming an email if details need manual correction.
   -- The /staff route can safely retry the authenticated onboarding RPC.
   raise warning 'Landshop staff activation requires attention for confirmed account';
  end;
 end if;
 return new;
end $$;
revoke all on function landshop_private.activate_staff_confirmation() from public,anon,authenticated;
drop trigger if exists landshop_auto_staff_confirmed on auth.users;
create trigger landshop_auto_staff_confirmed after update of email_confirmed_at on auth.users
for each row execute function landshop_private.activate_staff_confirmation();
drop trigger if exists landshop_auto_staff_created on auth.users;
create trigger landshop_auto_staff_created after insert on auth.users
for each row execute function landshop_private.activate_staff_confirmation();

-- Standard staff receive their own attendance, tasks and daily reporting immediately
-- after confirmed registration. Elevated roles still need independent KYC and approval.
create or replace function public.landshop_staff_can_work(p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
 select 1 from public.organization_members m
 join public.organizations o on o.id=m.organization_id and o.kind='landshop'
 join public.landshop_staff_profiles p on p.user_id=m.user_id and p.organization_id=m.organization_id
 join auth.users u on u.id=m.user_id
 where m.user_id=p_user and m.status='active' and u.email_confirmed_at is not null
 and p.employment_state='active'
 and (
  (m.role in ('staff','intern','youth_corps') and p.kyc_state<>'rejected')
  or (m.role not in ('staff','intern','youth_corps') and p.kyc_state='approved')
 )
 ) $$;
revoke all on function public.landshop_staff_can_work(uuid) from public,anon;
grant execute on function public.landshop_staff_can_work(uuid) to authenticated;

alter table public.staff_tasks add column if not exists accepted_at timestamptz;
create index if not exists landshop_staff_task_acceptance_idx on public.staff_tasks(assignee_id,accepted_at)
 where accepted_at is not null;

-- Reports go to a role-based departmental inbox; staff cannot nominate a
-- different user's identity as sender, or write/change finance/admin roles.
create table if not exists public.landshop_staff_routed_reports(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 staff_id uuid not null references auth.users(id),
 recipient_role text not null check(recipient_role in ('hr','manager','operations','finance','sales','legal','management')),
 cadence text not null check(cadence in ('daily','monthly')),
 period_start date not null,
 summary text not null check(char_length(summary) between 20 and 6000),
 blockers text not null default '' check(char_length(blockers)<=3000),
 related_task_id uuid references public.staff_tasks(id),
 status text not null default 'submitted' check(status in ('submitted','acknowledged','returned')),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 reviewer_note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists ls_routed_reports_staff_idx on public.landshop_staff_routed_reports(staff_id,created_at desc);
create index if not exists ls_routed_reports_recipient_idx on public.landshop_staff_routed_reports(recipient_role,status,created_at desc);
alter table public.landshop_staff_routed_reports enable row level security;
revoke all on public.landshop_staff_routed_reports from public,anon,authenticated;
grant select on public.landshop_staff_routed_reports to authenticated;

create or replace function public.landshop_staff_report_recipient(p_actor uuid,p_role text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.organization_members m
 join public.organizations o on o.id=m.organization_id and o.kind='landshop'
 join public.landshop_staff_profiles p on p.user_id=m.user_id and p.organization_id=m.organization_id
 where m.user_id=p_actor and m.status='active' and p.kyc_state='approved' and p.employment_state='active'
 and (
  (p_role='hr' and m.role in ('hr','hr_officer'))
  or (p_role='manager' and m.role in ('department_manager','operations'))
  or (p_role='operations' and m.role='operations')
  or (p_role='finance' and m.role in ('finance','head_finance'))
  or (p_role='sales' and m.role='sales')
  or (p_role='legal' and m.role='legal')
 )) or public.landshop_is_management(p_actor);
$$;
revoke all on function public.landshop_staff_report_recipient(uuid,text) from public,anon;
grant execute on function public.landshop_staff_report_recipient(uuid,text) to authenticated;
drop policy if exists ls_routed_report_personal_and_recipient on public.landshop_staff_routed_reports;
create policy ls_routed_report_personal_and_recipient
 on public.landshop_staff_routed_reports for select to authenticated
 using(staff_id=(select auth.uid()) or
   public.landshop_staff_report_recipient((select auth.uid()),recipient_role));

create or replace function public.landshop_staff_submit_routed_report(
 p_recipient_role text,p_cadence text,p_summary text,p_blockers text default '',
 p_task uuid default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); org uuid; report_id uuid; period_date date;
begin
 if actor is null or not public.landshop_staff_can_work(actor)
 then raise exception 'Active verified-email staff account required';end if;
 if p_recipient_role not in ('hr','manager','operations','finance','sales','legal','management')
  or p_cadence not in ('daily','monthly') then raise exception 'Select a valid recipient and reporting period';end if;
 if char_length(btrim(coalesce(p_summary,''))) not between 20 and 6000
  or char_length(coalesce(p_blockers,''))>3000 then raise exception 'Report must contain 20 to 6000 characters';end if;
 if (select count(*) from public.landshop_staff_routed_reports
    where staff_id=actor and created_at>now()-interval '24 hours')>=30
 then raise exception 'Submission limit reached for today';end if;
 select organization_id into org from public.landshop_staff_profiles where user_id=actor;
 if p_task is not null and not exists(select 1 from public.staff_tasks t
   where t.id=p_task and t.assignee_id=actor and t.organization_id=org)
 then raise exception 'Task does not belong to your staff account';end if;
 period_date:=(now() at time zone 'Africa/Lagos')::date;
 if p_cadence='monthly' then period_date:=date_trunc('month',period_date::timestamp)::date;end if;
 insert into public.landshop_staff_routed_reports
 (organization_id,staff_id,recipient_role,cadence,period_start,summary,blockers,related_task_id)
 values(org,actor,p_recipient_role,p_cadence,period_date,btrim(p_summary),btrim(coalesce(p_blockers,'')),p_task)
 returning id into report_id;
 insert into public.audit_events(actor_id,event_type,metadata) values(actor,'staff.routed_report_created',
  jsonb_build_object('report_id',report_id,'recipient',p_recipient_role,'cadence',p_cadence,'period',period_date));
 -- A durable internal event for future delivery workers, no sensitive report body in outbox.
 insert into public.notification_outbox(event_type,user_id,payload)
 values('staff.report_submitted',actor,jsonb_build_object('report_id',report_id,'recipient',p_recipient_role));
 return report_id;
end $$;
revoke all on function public.landshop_staff_submit_routed_report(text,text,text,text,uuid) from public,anon;
grant execute on function public.landshop_staff_submit_routed_report(text,text,text,text,uuid) to authenticated;

create or replace function public.landshop_staff_review_routed_report(
 p_report uuid,p_action text,p_note text default ''
) returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); rec public.landshop_staff_routed_reports%rowtype;
begin
 if actor is null then raise exception 'Sign in required';end if;
 if p_action not in ('acknowledged','returned') or char_length(btrim(coalesce(p_note,'')))<10
 then raise exception 'A review outcome and a 10-character reason are required';end if;
 select * into rec from public.landshop_staff_routed_reports where id=p_report for update;
 if not found or not public.landshop_staff_report_recipient(actor,rec.recipient_role)
  or rec.staff_id=actor then raise exception 'Not authorized to review this report';end if;
 if rec.status<>'submitted' then raise exception 'This report has already been reviewed';end if;
 update public.landshop_staff_routed_reports set status=p_action,reviewed_by=actor,
  reviewed_at=now(),reviewer_note=left(btrim(p_note),2000),updated_at=now() where id=p_report;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(actor,'staff.routed_report_reviewed',jsonb_build_object('report_id',p_report,'action',p_action));
 insert into public.notification_outbox(event_type,user_id,payload)
 values('staff.report_reviewed',rec.staff_id,jsonb_build_object('report_id',p_report,'status',p_action));
 return true;
end $$;
revoke all on function public.landshop_staff_review_routed_report(uuid,text,text) from public,anon;
grant execute on function public.landshop_staff_review_routed_report(uuid,text,text) to authenticated;

-- Do not grant Data API INSERT, UPDATE or DELETE on report tables.
-- All mutations must pass the audited, role-aware procedures above.
