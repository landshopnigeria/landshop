-- Import source and extraction artifacts. Both buckets must remain PRIVATE.
-- Jobs are submitted only by authenticated Landshop staff through a server-protected endpoint.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('landshop-import-uploads','landshop-import-uploads',false,20971520,
 array['text/csv','application/csv','application/vnd.ms-excel',
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 'application/xml','text/xml','application/pdf',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'application/zip','application/x-zip-compressed'])
on conflict(id) do update set public=false,file_size_limit=20971520,
allowed_mime_types=excluded.allowed_mime_types;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('landshop-import-results','landshop-import-results',false,20971520,
 array['application/json'])
on conflict(id) do update set public=false,file_size_limit=20971520,
allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists landshop_import_source_insert on storage.objects;
create policy landshop_import_source_insert on storage.objects
 for insert to authenticated with check(
 bucket_id='landshop-import-uploads'
 and public.landshop_property_editor((select auth.uid()),false)
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and name ~ ('^'||(select auth.uid())::text||'/[a-zA-Z0-9_.-]{1,160}[.](csv|xlsx|xml|pdf|docx|zip)$')
);
drop policy if exists landshop_import_source_read on storage.objects;
create policy landshop_import_source_read on storage.objects
 for select to authenticated using(
 bucket_id='landshop-import-uploads'
 and public.landshop_property_editor((select auth.uid()),false)
 and (storage.foldername(name))[1]=(select auth.uid())::text
);
drop policy if exists landshop_import_results_review on storage.objects;
create policy landshop_import_results_review on storage.objects
 for select to authenticated using(
 bucket_id='landshop-import-results'
 and public.landshop_property_editor((select auth.uid()),true)
);
-- Service-role workers write only extraction artifacts; clients have no INSERT policy for results.
-- Document processing itself never publishes or approves properties.
