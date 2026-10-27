-- Versioned server-side subscription validation; reviewed before production application.
-- Extends the existing authenticated landshop_submit_application RPC in-place.
-- Source: Develop House/Land and Beta Mortgage paper forms; Incubate and Inspection specifications.
-- No historical mortgage rate, deposit percentage, refund policy or investment ROI is enforced here.
create or replace function public.landshop_submit_application(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
 v_user uuid := auth.uid();
 v_app public.applications%rowtype;
 v_required text[];
 v_field text;
 v_number text;
begin
 if v_user is null then
  raise exception 'Authentication required';
 end if;
 select * into v_app from public.applications where id=p_id for update;
 if not found or v_app.applicant_id<>v_user or v_app.status<>'draft' then
  raise exception 'Draft not found, already submitted or not owned by applicant';
 end if;
 if jsonb_typeof(v_app.answers)<>'object' or pg_column_size(v_app.answers)>65536 then
  raise exception 'Invalid or oversized application answers';
 end if;

 v_required := array['first_name','last_name','email','phone','applicant_signature','declaration_date'];
 if v_app.kind in ('develop_house','develop_land') then
  v_required := v_required || array[
   'middle_name','whatsapp','gender','date_of_birth','marital_status',
   'residential_address','state_of_residence','occupation','designation',
   'estate_name','property_location','property_size','quantity'];
 elsif v_app.kind in ('beta_mortgage','mortgage_xtra') then
  v_required := v_required || array[
   'property_choice','property_location','employment_status','annual_income',
   'mortgage_amount','equity_contribution'];
 elsif v_app.kind='incubate' then
  v_required := v_required || array[
   'investment_option','investment_amount','investment_quantity','investment_duration'];
 elsif v_app.kind='inspection' then
  v_required := v_required || array['estate_name','client_interest'];
 end if;
 foreach v_field in array v_required loop
  if coalesce(length(btrim(v_app.answers->>v_field)),0)=0 then
   raise exception 'Missing required application field: %',v_field;
  end if;
 end loop;
 if coalesce(v_app.answers->>'declaration_accepted','false')<>'true' then
  raise exception 'Declaration must be accepted before submission';
 end if;
 if (v_app.answers->>'email') !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
  raise exception 'A valid contact email is required';
 end if;
 if v_app.kind in ('develop_house','develop_land') then
  v_number := v_app.answers->>'quantity';
  if v_number !~ '^[1-9][0-9]*$' then raise exception 'Quantity must be a positive whole number'; end if;
 elsif v_app.kind='incubate' then
  foreach v_field in array array['investment_amount','investment_quantity','investment_duration'] loop
   v_number := v_app.answers->>v_field;
   if v_number !~ '^[0-9]+([.][0-9]{1,2})?$' then
    raise exception 'Invalid positive investment value: %',v_field;
   end if;
   if v_number::numeric<=0 then
    raise exception 'Investment value must be positive: %',v_field;
   end if;
  end loop;
 elsif v_app.kind in ('beta_mortgage','mortgage_xtra') then
  foreach v_field in array array['annual_income','mortgage_amount','equity_contribution'] loop
   v_number := v_app.answers->>v_field;
   if v_number !~ '^[0-9]+([.][0-9]{1,2})?$' then
    raise exception 'Invalid financing input: %',v_field;
   end if;
   if v_field<>'equity_contribution' and v_number::numeric<=0 then
    raise exception 'Financing input must be positive: %',v_field;
   end if;
  end loop;
 end if;

 -- For document-bearing subscription types, verify private storage, not just a self-created registry row.
 if v_app.kind in ('develop_house','develop_land','incubate','beta_mortgage','mortgage_xtra')
    and not exists(
     select 1 from public.application_documents d
     join storage.objects o on o.bucket_id='landshop-applications' and o.name=d.object_path
     where d.application_id=v_app.id and d.applicant_id=v_user and d.document_type='passport_photo'
    ) then
  raise exception 'A securely uploaded passport photograph is required';
 end if;

 update public.applications set status='submitted' where id=p_id and status='draft';
 insert into public.application_events(application_id,actor_id,action)
 values(p_id,v_user,'submitted');
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'application.submitted',jsonb_build_object('application_id',p_id,'kind',v_app.kind));
 insert into public.notification_outbox(event_type,user_id,payload)
 values('application.submitted',v_user,jsonb_build_object('application_id',p_id,'kind',v_app.kind));
 return p_id;
end;
$$;
revoke all on function public.landshop_submit_application(uuid) from public,anon;
grant execute on function public.landshop_submit_application(uuid) to authenticated;
