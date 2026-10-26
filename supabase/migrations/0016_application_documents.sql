-- Product application document storage and own-draft intake.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('landshop-applications','landshop-applications',false,10485760,
array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.application_documents(
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.applications(id) on delete cascade,
 applicant_id uuid not null references auth.users(id),
 document_type text not null,
 object_path text not null unique,
 created_at timestamptz not null default now(),
 constraint application_doc_kind check(document_type in
 ('passport_photo','government_id','address_proof','income_statement','mortgage_document','supporting_document'))
);
alter table public.application_documents enable row level security;
revoke all on public.application_documents from public,anon,authenticated;
grant select,insert on public.application_documents to authenticated;
create policy application_docs_self on public.application_documents for select to authenticated
 using(applicant_id=(select auth.uid()));
create policy application_docs_insert on public.application_documents for insert to authenticated
 with check(applicant_id=(select auth.uid()) and
 exists(select 1 from public.applications a where a.id=application_id and
 a.applicant_id=(select auth.uid()) and a.status='draft')
 and object_path like ((select auth.uid())::text || '/' || application_id::text || '/%'));
drop policy if exists application_media_self_select on storage.objects;
create policy application_media_self_select on storage.objects for select to authenticated using(
 bucket_id='landshop-applications' and
 (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists application_media_draft_insert on storage.objects;
create policy application_media_draft_insert on storage.objects for insert to authenticated with check(
 bucket_id='landshop-applications'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.applications a
 where a.id::text=(storage.foldername(name))[2]
 and a.applicant_id=(select auth.uid()) and a.status='draft'));
