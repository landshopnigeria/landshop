-- KYC reviewer decisions. Apply after migrations 0001–0005.
-- SECURITY DEFINER is used strictly for a transactional, authenticated, role-checked decision.
-- Never authorize from user_metadata or an unverified frontend role.
create table if not exists public.kyc_decisions (
  id bigint generated always as identity primary key,
  submission_id uuid not null references public.kyc_submissions(id),
  applicant_id uuid not null references auth.users(id),
  reviewer_id uuid not null references auth.users(id),
  old_status text not null,
  new_status text not null check (new_status in ('approved','rejected')),
  decision_reason text not null,
  decided_at timestamptz not null default now()
);
create index if not exists kyc_decisions_submission_idx
  on public.kyc_decisions(submission_id,decided_at desc);
alter table public.kyc_decisions enable row level security;
revoke all on public.kyc_decisions from public,anon,authenticated;
grant select on public.kyc_decisions to authenticated;
drop policy if exists kyc_decisions_own on public.kyc_decisions;
create policy kyc_decisions_own on public.kyc_decisions for select
  to authenticated using (applicant_id=(select auth.uid()));

create or replace function public.landshop_kyc_decide(
  p_submission_id uuid, p_decision text, p_reason text)
returns table(submission_id uuid, outcome text)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_reviewer uuid := auth.uid();
  v_applicant uuid;
  v_status text;
  v_kind text;
  v_reason text := btrim(coalesce(p_reason,''));
  v_verified boolean;
begin
  if v_reviewer is null then
    raise exception 'Authentication required';
  end if;
  if p_decision not in ('approved','rejected') then
    raise exception 'Invalid decision';
  end if;
  if char_length(v_reason) < 15 or char_length(v_reason) > 1500 then
    raise exception 'Decision reason must contain 15 to 1500 characters';
  end if;
  -- Privileges are granted only by trusted administrative provisioning.
  select exists (
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.user_id=v_reviewer and m.status='active'
      and o.kind='landshop'
      and m.role in ('owner','admin','legal','operations')
  ) into v_verified;
  if not v_verified then raise exception 'Reviewer not authorized'; end if;

  select s.applicant_id,s.status,s.kind
    into v_applicant,v_status,v_kind
  from public.kyc_submissions s
  where s.id=p_submission_id
  for update;
  if not found then raise exception 'KYC application not found'; end if;
  if v_reviewer = v_applicant then
    raise exception 'Reviewers cannot decide their own KYC';
  end if;
  if v_status not in ('submitted','review') then
    raise exception 'Application cannot be decided in its current state';
  end if;

  if p_decision='approved' then
    -- An upload alone does not prove identity. The reviewer must complete actual
    -- manual verification before invoking this function.
    if exists (
      select 1 from unnest(case when v_kind='company'
        then array['government_id','portrait','utility_bill','cac_certificate']::text[]
        else array['government_id','portrait','utility_bill']::text[] end) required
      where not exists (
        select 1 from public.kyc_documents d
        join storage.objects obj
          on obj.bucket_id='landshop-kyc' and obj.name=d.object_path
        where d.submission_id=p_submission_id and d.applicant_id=v_applicant
          and d.document_type=required
      )
    ) then
      raise exception 'Missing required KYC documents';
    end if;
    if exists(
      select 1 from public.kyc_documents d
      where d.submission_id=p_submission_id
      and not exists(
        select 1 from public.audit_events a
        where a.actor_id=v_reviewer and a.event_type='kyc.document_access'
          and a.metadata->>'document_id'=d.id::text
      )
    ) then
      raise exception 'Reviewer must request access to all submitted KYC documents';
    end if;
  end if;

  update public.kyc_submissions
  set status=p_decision,reviewed_by=v_reviewer,reviewed_at=now()
  where id=p_submission_id;

  -- Keep customer access status in the same database transaction.
  insert into public.profiles(id,kyc_status)
  values(v_applicant,p_decision)
  on conflict(id) do update set kyc_status=excluded.kyc_status;

  insert into public.kyc_decisions(
    submission_id,applicant_id,reviewer_id,old_status,new_status,decision_reason
  ) values (
    p_submission_id,v_applicant,v_reviewer,v_status,p_decision,v_reason
  );
  insert into public.audit_events(actor_id,event_type,metadata)
  values(v_reviewer,'kyc.decision',
    jsonb_build_object('submission_id',p_submission_id,'applicant_id',v_applicant,
                       'old_status',v_status,'outcome',p_decision));

  -- The outbox worker will deliver this later once notifications are activated.
  insert into public.notification_outbox(event_type,user_id,payload)
  values('kyc.decision',v_applicant,
    jsonb_build_object('submission_id',p_submission_id,'outcome',p_decision));

  return query select p_submission_id,p_decision;
end;
$$;
revoke all on function public.landshop_kyc_decide(uuid,text,text) from public,anon;
grant execute on function public.landshop_kyc_decide(uuid,text,text) to authenticated;

-- Reviewer sees only documents needed for verified KYC review.
drop policy if exists kyc_doc_reviewer_read on public.kyc_documents;
create policy kyc_doc_reviewer_read on public.kyc_documents
for select to authenticated using(
  exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id=m.organization_id
    where m.user_id=(select auth.uid()) and m.status='active'
      and o.kind='landshop' and m.role in ('owner','admin','legal','operations')
  )
);
-- This does not expose storage files. File access must be mediated by
-- a server endpoint with separate reviewer authorization and short-lived URLs.
