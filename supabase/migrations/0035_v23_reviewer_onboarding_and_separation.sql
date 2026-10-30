-- Applied production 20261030011714: landshop_v23_independent_reviewer_onboarding_and_governance

-- V23: second-person verified estate review and owner-controlled reviewer onboarding.
alter table public.estates add column if not exists review_requested_by uuid references auth.users(id);
alter table public.properties add column if not exists price_edited_by uuid references auth.users(id);
CREATE OR REPLACE FUNCTION public.landshop_estate_transition(p_id uuid, p_status text, p_reason text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid:=auth.uid();v_old text;v_owner uuid;v_state text;v_city text;v_requested uuid;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then raise exception 'Estate reviewer required';end if;
 if length(btrim(coalesce(p_reason,''))) not between 20 and 1000 or p_status not in ('review','published','archived')
 then raise exception 'Review decision and evidence required';end if;
 select status,created_by,state,city,review_requested_by into v_old,v_owner,v_state,v_city,v_requested from public.estates where id=p_id for update;
 if not found or not ((v_old='draft' and p_status='review') or (v_old='review' and p_status='published') or (v_old='published' and p_status='archived'))
 then raise exception 'Invalid estate review transition';end if;
 if p_status='published' and (v_requested is null or v_requested=v_user or v_owner=v_user or nullif(v_state,'') is null or nullif(v_city,'') is null)
 then raise exception 'Independent reviewer and verified state/city are required';end if;
 update public.estates set status=p_status,review_requested_by=case when p_status='review' then v_user else review_requested_by end where id=p_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'estate.status_changed',jsonb_build_object('estate_id',p_id,'previous',v_old,'status',p_status,'reason',btrim(p_reason)));
 return p_status;
end $function$
;
CREATE OR REPLACE FUNCTION public.landshop_property_update_draft(p_id uuid, p_title text, p_type text, p_estate uuid, p_amount_kobo bigint, p_sale_mode text, p_bedrooms integer, p_bathrooms integer, p_land_sqm numeric, p_floor_sqm numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid:=auth.uid();v_old text;
begin
 if v_user is null or not public.landshop_property_editor(v_user,false) then raise exception 'Staff authorization required';end if;
 select status into v_old from public.properties where id=p_id for update;
 if not found or v_old<>'draft' then raise exception 'Only draft property records can be edited; review/publication changes require a new approval cycle';end if;
 if length(btrim(coalesce(p_title,''))) not between 5 and 180
 or p_type not in ('land','house','apartment','commercial','shortlet')
 or (p_amount_kobo is not null and (p_amount_kobo<0 or p_amount_kobo>90000000000000))
 or (p_sale_mode is not null and p_sale_mode not in ('Buy','Rent','Shortlet'))
 or (p_bedrooms is not null and p_bedrooms not between 0 and 100)
 or (p_bathrooms is not null and p_bathrooms not between 0 and 100)
 or (p_land_sqm is not null and (p_land_sqm<=0 or p_land_sqm>100000000))
 or (p_floor_sqm is not null and (p_floor_sqm<=0 or p_floor_sqm>100000000))
 then raise exception 'Invalid property draft fields';end if;
 if p_estate is not null and not exists(select 1 from public.estates where id=p_estate)
 then raise exception 'Selected estate does not exist';end if;
 update public.properties set title=btrim(p_title),property_type=p_type,estate_id=p_estate,
 amount_kobo=p_amount_kobo,price_edited_by=case when amount_kobo is distinct from p_amount_kobo then v_user else price_edited_by end,sale_mode=p_sale_mode,bedrooms=p_bedrooms,bathrooms=p_bathrooms,
 land_area_sqm=p_land_sqm,floor_area_sqm=p_floor_sqm,
 price_last_confirmed_at=case when amount_kobo is distinct from p_amount_kobo then null else price_last_confirmed_at end,price_confirmed_by=case when amount_kobo is distinct from p_amount_kobo then null else price_confirmed_by end
 where id=p_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.draft_updated',jsonb_build_object('property_id',p_id,'estate_id',p_estate,'price_changed',true));
 return true;
end $function$
;
CREATE OR REPLACE FUNCTION public.landshop_property_confirm_price(p_id uuid, p_reason text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid:=auth.uid();v_property public.properties%rowtype;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then raise exception 'Independent property-price reviewer required';end if;
 if length(btrim(coalesce(p_reason,''))) not between 20 and 1000 then raise exception 'Describe the source and current price verification';end if;
 select * into v_property from public.properties where id=p_id for update;
 if not found or v_property.status not in ('draft','review') or v_property.amount_kobo is null or v_property.amount_kobo<=0
 then raise exception 'A draft/review property with a valid positive price is required';end if;
 if v_property.created_by=v_user or v_property.price_edited_by=v_user then raise exception 'An independent reviewer must confirm a price they did not create or edit';end if;
 update public.properties set price_last_confirmed_at=now(),price_confirmed_by=v_user where id=p_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.price_verified',jsonb_build_object('property_id',p_id,'price_kobo',v_property.amount_kobo,'basis',btrim(p_reason)));
 return true;
end $function$
;
create or replace function public.landshop_staff_invite_reviewer(p_email text,p_role text,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $invite$
declare v_owner uuid:=auth.uid();v_target uuid;v_org uuid;v_prev text;v_prev_status text;
begin
 if v_owner is null or not exists(
  select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
  where m.user_id=v_owner and m.role='owner' and m.status='active' and o.kind='landshop'
 ) then raise exception 'Only an active Landshop owner may invite independent reviewers';end if;
 if lower(btrim(coalesce(p_email,''))) !~ '^[^@ ]+@[^@ ]+[.][^@ ]+$' or length(p_email)>254
  or p_role not in ('legal','operations','admin')
  or length(btrim(coalesce(p_reason,''))) not between 20 and 1000
 then raise exception 'Valid verified email, eligible role, and documented reason required';end if;
 select id into v_org from public.organizations where kind='landshop';
 if v_org is null then raise exception 'Landshop organization not configured';end if;
 select id into v_target from auth.users
  where lower(email)=lower(btrim(p_email)) and email_confirmed_at is not null and deleted_at is null
  and (banned_until is null or banned_until<now());
 if v_target is null then raise exception 'The intended reviewer must register and verify their email first';end if;
 if v_target=v_owner then raise exception 'You cannot invite yourself as your own independent reviewer';end if;
 select role,status into v_prev,v_prev_status from public.organization_members
  where organization_id=v_org and user_id=v_target for update;
 if v_prev_status in ('suspended','revoked') then raise exception 'Previously suspended or revoked access requires independent security review';end if;
 if v_prev_status='active' then raise exception 'Existing active membership must be managed using a separate audited change request';end if;
 insert into public.organization_members(organization_id,user_id,role,status,invited_by)
 values(v_org,v_target,p_role,'invited',v_owner)
 on conflict(organization_id,user_id) do update set
 role=excluded.role,status='invited',invited_by=excluded.invited_by;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_owner,'landshop.reviewer.invited',jsonb_build_object('member_id',v_target,'role',p_role,'reason',btrim(p_reason)));
 return true;
end $invite$;
revoke all on function public.landshop_staff_invite_reviewer(text,text,text) from public,anon;
grant execute on function public.landshop_staff_invite_reviewer(text,text,text) to authenticated;
create or replace function public.landshop_staff_accept_review_invite()
returns boolean language plpgsql security definer set search_path='' as $accept$
declare v_member uuid:=auth.uid();v_org uuid;v_count integer;
begin
 if v_member is null then raise exception 'Please sign in to accept the invitation';end if;
 select id into v_org from public.organizations where kind='landshop';
 if v_org is null then raise exception 'Landshop organization is not configured';end if;
 if not exists(select 1 from auth.users where id=v_member and email_confirmed_at is not null
   and deleted_at is null and (banned_until is null or banned_until<now()))
 then raise exception 'Confirmed email required before accepting reviewer invitation';end if;
 update public.organization_members set status='active'
 where organization_id=v_org and user_id=v_member and status='invited'
  and invited_by is not null and role in ('legal','operations','admin');
 get diagnostics v_count=row_count;
 if v_count<>1 then raise exception 'You have no pending authorized Landshop review invitation';end if;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_member,'landshop.reviewer.invite_accepted',jsonb_build_object('organization_id',v_org));
 return true;
end $accept$;
revoke all on function public.landshop_staff_accept_review_invite() from public,anon;
grant execute on function public.landshop_staff_accept_review_invite() to authenticated;
-- Safeguard against a price approver simultaneously releasing an unverified property.
create or replace function public.landshop_publish_separation_guard()
returns trigger language plpgsql set search_path='' as $guard$
declare v_user uuid:=auth.uid();v_profile uuid;
begin
 if new.status='published' and old.status is distinct from 'published' then
  if v_user is null then raise exception 'An authenticated publisher is required';end if;
  if new.price_confirmed_by is null or new.price_confirmed_by=v_user
  then raise exception 'Publisher must be different from the independent price approver';end if;
  select approved_by into v_profile from public.property_showcase where property_id=new.id;
  if v_profile is null or v_profile=v_user then raise exception 'Publisher must differ from the property details approver';end if;
 end if;
 return new;
end $guard$;
drop trigger if exists landshop_publish_separation_guard on public.properties;
create trigger landshop_publish_separation_guard before update of status on public.properties for each row
execute function public.landshop_publish_separation_guard();

