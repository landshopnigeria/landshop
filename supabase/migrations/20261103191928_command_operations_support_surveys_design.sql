-- Support evidence and customer-visible conversations.
alter table public.support_tickets add column if not exists ticket_number text not null default ('LNS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))) unique;
create table public.support_ticket_attachments(id uuid primary key default gen_random_uuid(),ticket_id uuid not null references public.support_tickets(id),uploaded_by uuid not null default auth.uid() references auth.users(id),object_path text not null unique,file_name text not null check(length(file_name) between 1 and 200),mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp','video/mp4','video/webm','application/pdf')),size_bytes bigint not null check(size_bytes between 1 and 31457280),created_at timestamptz not null default now());
alter table public.support_ticket_attachments enable row level security;
grant select,insert on public.support_ticket_attachments to authenticated;
create policy support_evidence_read on public.support_ticket_attachments for select to authenticated using((select public.landshop_is_management(auth.uid())) or exists(select 1 from public.support_tickets t where t.id=ticket_id and t.requester_id=(select auth.uid())));
create policy support_evidence_insert on public.support_ticket_attachments for insert to authenticated with check(uploaded_by=(select auth.uid()) and object_path like auth.uid()::text||'/'||ticket_id::text||'/%' and exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.requester_id=auth.uid() or public.landshop_is_management(auth.uid()))));
create index support_evidence_ticket on public.support_ticket_attachments(ticket_id);
create index support_evidence_uploader on public.support_ticket_attachments(uploaded_by);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('landshop-support-evidence','landshop-support-evidence',false,31457280,array['image/jpeg','image/png','image/webp','video/mp4','video/webm','application/pdf']) on conflict(id) do nothing;
create policy support_upload on storage.objects for insert to authenticated with check(bucket_id='landshop-support-evidence' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.support_tickets t where t.id::text=(storage.foldername(name))[2] and (t.requester_id=auth.uid() or public.landshop_is_management(auth.uid()))));
create policy support_download on storage.objects for select to authenticated using(bucket_id='landshop-support-evidence' and exists(select 1 from public.support_tickets t where t.id::text=(storage.foldername(name))[2] and (t.requester_id=auth.uid() or public.landshop_is_management(auth.uid()))));
create policy support_management_events on public.support_ticket_events for select to authenticated using((select public.landshop_is_management(auth.uid())));
create function public.landshop_support_reply(p_ticket uuid,p_note text) returns boolean language plpgsql security definer set search_path='' as $$
declare t public.support_tickets; manager boolean:=public.landshop_is_management(auth.uid());
begin
 if auth.uid() is null or length(btrim(coalesce(p_note,''))) not between 2 and 2000 then raise exception 'Sign in and enter a message (2-2000 characters)';end if;
 select * into t from public.support_tickets where id=p_ticket for update;
 if not found or (t.requester_id<>auth.uid() and not manager) then raise exception 'Ticket unavailable';end if;
 if t.status='closed' then raise exception 'This ticket is closed. Open a new request';end if;
 insert into public.support_ticket_events(ticket_id,actor_id,event_type,note) values(p_ticket,auth.uid(),case when manager then 'operator_reply' else 'customer_reply' end,btrim(p_note));
 update public.support_tickets set updated_at=now() where id=p_ticket;
 return true;
end $$;
revoke all on function public.landshop_support_reply(uuid,text) from public,anon;
grant execute on function public.landshop_support_reply(uuid,text) to authenticated;
-- Private client questionnaires and template-driven invitations.
create table public.landshop_client_surveys(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 5 and 180),intro text not null check(length(intro)<=5000),questions jsonb not null check(jsonb_typeof(questions)='array' and jsonb_array_length(questions) between 1 and 30),state text not null default 'draft' check(state in ('draft','published','closed')),created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now());
create table public.landshop_survey_invitations(id uuid primary key default gen_random_uuid(),survey_id uuid not null references public.landshop_client_surveys(id),recipient_id uuid not null references auth.users(id),message text not null check(length(message) between 10 and 5000),created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),unique(survey_id,recipient_id));
create table public.landshop_survey_responses(id uuid primary key default gen_random_uuid(),survey_id uuid not null references public.landshop_client_surveys(id),user_id uuid not null default auth.uid() references auth.users(id),answers jsonb not null check(jsonb_typeof(answers)='object' and octet_length(answers::text)<=30000),created_at timestamptz not null default now(),unique(survey_id,user_id));
alter table public.landshop_client_surveys enable row level security;alter table public.landshop_survey_invitations enable row level security;alter table public.landshop_survey_responses enable row level security;
grant select,insert,update on public.landshop_client_surveys to authenticated;grant select,insert on public.landshop_survey_invitations,public.landshop_survey_responses to authenticated;
create policy surveys_read on public.landshop_client_surveys for select to authenticated using(public.landshop_is_management(auth.uid()) or (state<>'draft' and exists(select 1 from public.landshop_survey_invitations i where i.survey_id=landshop_client_surveys.id and i.recipient_id=auth.uid())));
create policy surveys_create on public.landshop_client_surveys for insert to authenticated with check(public.landshop_is_management(auth.uid()) and created_by=auth.uid());
create policy surveys_update on public.landshop_client_surveys for update to authenticated using(public.landshop_is_management(auth.uid()) and not exists(select 1 from public.landshop_survey_invitations i where i.survey_id=landshop_client_surveys.id)) with check(public.landshop_is_management(auth.uid()));
create policy invitations_read on public.landshop_survey_invitations for select to authenticated using(recipient_id=auth.uid() or public.landshop_is_management(auth.uid()));
create policy invitations_create on public.landshop_survey_invitations for insert to authenticated with check(public.landshop_is_management(auth.uid()) and created_by=auth.uid() and exists(select 1 from public.landshop_client_surveys s where s.id=survey_id and s.state='published'));
create policy responses_read on public.landshop_survey_responses for select to authenticated using(user_id=auth.uid() or public.landshop_is_management(auth.uid()));
create policy responses_create on public.landshop_survey_responses for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.landshop_survey_invitations i join public.landshop_client_surveys s on s.id=i.survey_id where i.survey_id=landshop_survey_responses.survey_id and i.recipient_id=auth.uid() and s.state='published'));
create index survey_invitation_recipient on public.landshop_survey_invitations(recipient_id);create index survey_invitation_creator on public.landshop_survey_invitations(created_by);create index survey_response_user on public.landshop_survey_responses(user_id);create index survey_creator on public.landshop_client_surveys(created_by);
-- Audited allocation case editing. Allocation readiness remains subject to all clearances.
create function public.landshop_command_allocation_save(p_id uuid,p_data jsonb,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare c public.allocation_cases; result uuid; next_status text:=coalesce(p_data->>'status','review');
begin
 if auth.uid() is null or not public.landshop_is_management(auth.uid()) then raise exception 'Management access required';end if;
 if length(btrim(coalesce(p_reason,''))) not between 15 and 1000 then raise exception 'Enter a review reason (15-1000 characters)';end if;
 if p_id is not null then select * into c from public.allocation_cases where id=p_id for update;if not found then raise exception 'Case unavailable';end if;end if;
 if next_status in ('ready','allocated') and (p_data->>'eligibility'<>'eligible' or not(coalesce((p_data->>'cx_cleared')::boolean,false) and coalesce((p_data->>'finance_cleared')::boolean,false) and coalesce((p_data->>'legal_cleared')::boolean,false) and coalesce((p_data->>'survey_cleared')::boolean,false)) or length(btrim(coalesce(p_data->>'peg_identifier','')))<2) then raise exception 'Eligible customer, all four clearances and plot/peg identifier required';end if;
 if p_id is null then
 insert into public.allocation_cases(programme_id,applicant_id,site_id,reference) values((p_data->>'programme_id')::uuid,(p_data->>'applicant_id')::uuid,nullif(p_data->>'site_id','')::uuid,btrim(p_data->>'reference')) returning id into result;
 else result:=p_id;end if;
 update public.allocation_cases set site_id=nullif(p_data->>'site_id','')::uuid,eligibility=coalesce(p_data->>'eligibility','pending'),cx_cleared=coalesce((p_data->>'cx_cleared')::boolean,false),finance_cleared=coalesce((p_data->>'finance_cleared')::boolean,false),legal_cleared=coalesce((p_data->>'legal_cleared')::boolean,false),survey_cleared=coalesce((p_data->>'survey_cleared')::boolean,false),allocation_type=coalesce(p_data->>'allocation_type','provisional'),peg_identifier=p_data->>'peg_identifier',status=next_status,invite_status=coalesce(p_data->>'invite_status','not_sent'),approved_by=case when next_status in ('ready','allocated') then auth.uid() else approved_by end,approved_at=case when next_status in ('ready','allocated') then now() else approved_at end where id=result;
 insert into public.allocation_events(case_id,actor_id,action,details) values(result,auth.uid(),'management_update',jsonb_build_object('reason',p_reason,'before',to_jsonb(c),'after',p_data));
 insert into public.audit_events(actor_id,event_type,metadata) values(auth.uid(),'allocation.updated',jsonb_build_object('case_id',result,'reason',p_reason));
 return result;
end $$;
revoke all on function public.landshop_command_allocation_save(uuid,jsonb,text) from public,anon;grant execute on function public.landshop_command_allocation_save(uuid,jsonb,text) to authenticated;
grant insert,update on public.allocation_sites to authenticated;
create policy allocation_site_create on public.allocation_sites for insert to authenticated with check(public.landshop_is_management(auth.uid()));
create policy allocation_site_update on public.allocation_sites for update to authenticated using(public.landshop_is_management(auth.uid())) with check(public.landshop_is_management(auth.uid()));
-- Constrained responsive visual styling, published through existing revision snapshots.
create function public.landshop_valid_page_style(p_text text) returns boolean language plpgsql immutable set search_path='' as $$
declare j jsonb; section record; prop record;
begin
 j:=p_text::jsonb;if jsonb_typeof(j)<>'object' or octet_length(p_text)>6000 then return false;end if;
 for section in select * from jsonb_each(j) loop
 if section.key not in ('base','tablet','mobile') or jsonb_typeof(section.value)<>'object' then return false;end if;
 for prop in select * from jsonb_each_text(section.value) loop
 if prop.key not in ('color','background-color','font-size','font-weight','font-family','line-height','text-align','padding','margin','gap','border-radius','display','grid-template-columns','flex-direction','align-items','justify-content','width','max-width','min-height','order') or length(prop.value)>160 or prop.value !~ '^[#a-zA-Z0-9.% ,()_-]+$' then return false;end if;
 end loop;end loop;return true;
 exception when others then return false;
end $$;
revoke all on function public.landshop_valid_page_style(text) from public;grant execute on function public.landshop_valid_page_style(text) to anon,authenticated;
alter table public.landshop_site_content drop constraint landshop_site_content_kind_check;
alter table public.landshop_site_content drop constraint landshop_site_content_check;
alter table public.landshop_site_content add constraint landshop_site_content_kind_check check(kind in ('text','link','image','video','style'));
alter table public.landshop_site_content add constraint landshop_site_content_check check(kind='text' or (kind='style' and public.landshop_valid_page_style(replacement)) or (kind in ('image','video','link') and replacement ~ '^/([^/]|$)' and replacement !~ '[\\[:cntrl:][:space:]]') or (kind='link' and replacement ~ '^(https://|mailto:|tel:)') or (kind in ('image','video') and replacement ~ '^https://(www[.]landshopnigeria[.]com|landshopnigeria[.]com|iwkfagzkogzidrbbezds[.]supabase[.]co)/'));
update storage.buckets set file_size_limit=52428800,allowed_mime_types=array['image/jpeg','image/png','image/webp','video/mp4','video/webm'] where id='landshop-website-public';
