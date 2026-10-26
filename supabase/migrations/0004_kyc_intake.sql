-- KYC intake foundation, to be applied after 0003.
-- User can create drafts, upload documents privately and submit once.
-- Only privileged, separately reviewed management APIs may approve/reject.
create table if not exists public.kyc_documents(
 id uuid primary key default gen_random_uuid(),
 submission_id uuid not null references public.kyc_submissions(id) on delete cascade,
 applicant_id uuid not null references auth.users(id) on delete cascade,
 document_type text not null check(document_type in ('portrait','government_id','utility_bill','cac_certificate','bank_evidence')),
 object_path text not null unique,
 created_at timestamptz not null default now()
);
create unique index if not exists kyc_documents_type_unique
 on public.kyc_documents(submission_id,document_type);
alter table public.kyc_documents enable row level security;

-- Supabase projects often grant broad public privileges by default.
-- Whitelist only column-level operations necessary for intake.
revoke all on table public.kyc_submissions from anon,authenticated;
revoke all on table public.kyc_documents from anon,authenticated;
grant select on public.kyc_submissions to authenticated;
grant insert (applicant_id,kind,metadata) on public.kyc_submissions to authenticated;
grant update (metadata,status) on public.kyc_submissions to authenticated;
grant select on public.kyc_documents to authenticated;
grant insert (submission_id,applicant_id,document_type,object_path) on public.kyc_documents to authenticated;
grant delete on public.kyc_documents to authenticated;

drop policy if exists kyc_applicant_insert_draft on public.kyc_submissions;
create policy kyc_applicant_insert_draft on public.kyc_submissions
 for insert to authenticated with check(
 applicant_id=(select auth.uid()) and status='draft' and reviewed_by is null and reviewed_at is null
);
drop policy if exists kyc_applicant_update_draft on public.kyc_submissions;
create policy kyc_applicant_update_draft on public.kyc_submissions
 for update to authenticated
 using(applicant_id=(select auth.uid()) and status='draft')
 with check(applicant_id=(select auth.uid()) and status in ('draft','submitted'));
drop policy if exists kyc_doc_select_owner on public.kyc_documents;
create policy kyc_doc_select_owner on public.kyc_documents
 for select to authenticated using(applicant_id=(select auth.uid()));
drop policy if exists kyc_doc_insert_owner on public.kyc_documents;
create policy kyc_doc_insert_owner on public.kyc_documents
 for insert to authenticated with check(
 applicant_id=(select auth.uid()) and
 exists(select 1 from public.kyc_submissions s
  where s.id=submission_id and s.applicant_id=(select auth.uid()) and s.status='draft')
 and object_path like (auth.uid()::text || '/' || submission_id::text || '/%')
);
drop policy if exists kyc_doc_delete_owner_draft on public.kyc_documents;
create policy kyc_doc_delete_owner_draft on public.kyc_documents
 for delete to authenticated using(
 applicant_id=(select auth.uid()) and
 exists(select 1 from public.kyc_submissions s
  where s.id=submission_id and s.applicant_id=(select auth.uid()) and s.status='draft')
);

create or replace function public.guard_kyc_submission_state()
returns trigger language plpgsql set search_path='' as $$
begin
 if current_user='authenticated' then
   if tg_op='UPDATE' then
     if old.status <> 'draft' or new.status not in ('draft','submitted') then
       raise exception 'Only draft KYC can be submitted';
     end if;
     if new.status='submitted' and
       not exists(select 1 from public.kyc_documents d
         where d.submission_id=old.id and d.applicant_id=old.applicant_id
           and d.document_type='government_id') then
       raise exception 'Identity document is required';
     end if;
   end if;
 end if;
 return new;
end $$;
drop trigger if exists guard_kyc_submission_changes on public.kyc_submissions;
create trigger guard_kyc_submission_changes before update on public.kyc_submissions
 for each row execute function public.guard_kyc_submission_state();

-- Secure private media. Customers can only access their own object prefix.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('landshop-kyc','landshop-kyc',false,10485760,
 array['image/jpeg','image/png','image/webp','application/pdf'])
 on conflict(id) do update set public=false,file_size_limit=10485760,
 allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists landshop_kyc_read_own on storage.objects;
create policy landshop_kyc_read_own on storage.objects
 for select to authenticated using(
 bucket_id='landshop-kyc' and (storage.foldername(name))[1]=(select auth.uid())::text
);
drop policy if exists landshop_kyc_upload_draft on storage.objects;
create policy landshop_kyc_upload_draft on storage.objects
 for insert to authenticated with check(
 bucket_id='landshop-kyc' and
 (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.kyc_submissions s
   where s.id::text=(storage.foldername(name))[2]
   and s.applicant_id=(select auth.uid()) and s.status='draft')
);
drop policy if exists landshop_kyc_delete_draft on storage.objects;
create policy landshop_kyc_delete_draft on storage.objects
 for delete to authenticated using(
 bucket_id='landshop-kyc'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.kyc_submissions s
 where s.id::text=(storage.foldername(name))[2]
 and s.applicant_id=(select auth.uid()) and s.status='draft')
);
-- No listing/upload mutation policies for anon.
-- Reviewers must access documents through role-verified backend endpoints,
-- signed short-lived URLs, audit events and explicit organizational approval.
