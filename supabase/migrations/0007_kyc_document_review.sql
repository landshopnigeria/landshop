-- Allow verified Landshop reviewers to inspect private KYC documents.
-- Reviewer role comes from trusted organization_members, not editable user metadata.
drop policy if exists landshop_kyc_reviewer_read on storage.objects;
create policy landshop_kyc_reviewer_read on storage.objects
for select to authenticated using(
  bucket_id='landshop-kyc'
  and exists(
    select 1 from public.organization_members m
    join public.organizations org on org.id=m.organization_id
    where m.user_id=(select auth.uid()) and m.status='active'
      and org.kind='landshop' and m.role in ('owner','admin','legal','operations')
  )
);

-- Record the requested document read before issuing the signed link.
create or replace function public.landshop_kyc_log_document_access(p_document_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid := auth.uid();
  v_submission uuid;
  v_kind text;
  v_status text;
begin
  if v_actor is null then raise exception 'Authentication required'; end if;
  if not exists(
    select 1 from public.organization_members m
      join public.organizations o on o.id=m.organization_id
    where m.user_id=v_actor and m.status='active' and o.kind='landshop'
      and m.role in ('owner','admin','legal','operations')
  ) then raise exception 'Reviewer access denied'; end if;
  select d.submission_id,d.document_type,s.status
    into v_submission,v_kind,v_status
  from public.kyc_documents d
    join public.kyc_submissions s on s.id=d.submission_id
  where d.id=p_document_id;
  if not found or v_status not in ('submitted','review') then
    raise exception 'Document review unavailable';
  end if;
  insert into public.audit_events(actor_id,event_type,metadata)
  values(v_actor,'kyc.document_access',
    jsonb_build_object('document_id',p_document_id,'submission_id',v_submission,'type',v_kind));
  return true;
end;
$$;
revoke all on function public.landshop_kyc_log_document_access(uuid) from public,anon;
grant execute on function public.landshop_kyc_log_document_access(uuid) to authenticated;
