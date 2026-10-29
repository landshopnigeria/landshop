-- Applied to production Supabase as landshop_v22_publication_evidence_and_price_verification_gate / 20261029212709.
-- Only source-grounded draft records, never automatically published.

alter table public.properties add column if not exists price_confirmed_by uuid references auth.users(id);
create or replace function public.landshop_property_confirm_price(p_id uuid,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_property public.properties%rowtype;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then raise exception 'Independent property-price reviewer required';end if;
 if length(btrim(coalesce(p_reason,''))) not between 20 and 1000 then raise exception 'Describe the source and current price verification';end if;
 select * into v_property from public.properties where id=p_id for update;
 if not found or v_property.status not in ('draft','review') or v_property.amount_kobo is null or v_property.amount_kobo<=0
 then raise exception 'A draft/review property with a valid positive price is required';end if;
 if v_property.created_by=v_user then raise exception 'Property creator cannot independently confirm their own price';end if;
 update public.properties set price_last_confirmed_at=now(),price_confirmed_by=v_user where id=p_id;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.price_verified',jsonb_build_object('property_id',p_id,'price_kobo',v_property.amount_kobo,'basis',btrim(p_reason)));
 return true;
end $$;
revoke all on function public.landshop_property_confirm_price(uuid,text) from public,anon;
grant execute on function public.landshop_property_confirm_price(uuid,text) to authenticated;
create or replace function public.landshop_property_transition(p_id uuid,p_status text,p_reason text)
returns text language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_record public.properties%rowtype;
begin
 if v_user is null or not public.landshop_property_editor(v_user,true) then raise exception 'Independent property reviewer required';end if;
 if p_status not in ('review','published','archived') or length(btrim(coalesce(p_reason,''))) not between 20 and 1000
 then raise exception 'A valid decision and evidence note are required';end if;
 select * into v_record from public.properties where id=p_id for update;
 if not found or not ((v_record.status='draft' and p_status='review')
 or (v_record.status='review' and p_status='published')
 or (v_record.status='published' and p_status='archived')) then raise exception 'Invalid property workflow transition';end if;
 if p_status='published' then
  if v_record.created_by=v_user then raise exception 'An independent publisher is required';end if;
  if v_record.amount_kobo is null or v_record.amount_kobo<=0 then raise exception 'No property can be published without a valid approved price';end if;
  if v_record.price_last_confirmed_at is null or v_record.price_last_confirmed_at<now()-interval '30 days' then raise exception 'An authorized reviewer must confirm the current property price within the last 30 days';end if;
  if v_record.estate_id is null or not exists(select 1 from public.estates where id=v_record.estate_id and status='published')
   then raise exception 'First approve the estate and verify its location';end if;
  if not exists(select 1 from public.property_showcase s where s.property_id=p_id and s.location_verified=true
    and length(coalesce(s.payload->>'address_line',''))>=9
    and length(coalesce(s.payload->>'description',''))>=30
    and jsonb_typeof(s.payload->'latitude')='number'
    and jsonb_typeof(s.payload->'longitude')='number'
   ) then raise exception 'Independent property-detail and exact Google Maps pin approval are required';end if;
  if not exists(select 1 from public.property_assets a where a.property_id=p_id and a.kind='marketing_authority' and a.status='verified')
   then raise exception 'Owner/developer marketing authority has not been verified';end if;
  if not exists(select 1 from public.property_assets a where a.property_id=p_id and a.kind='title_document' and a.status='verified')
   then raise exception 'Verified title evidence is required before listing';end if;
  if not (exists(select 1 from public.property_showcase_media m where m.property_id=p_id and m.kind='photo' and m.status='approved')
     or exists(select 1 from public.property_showcase s where s.property_id=p_id
     and jsonb_typeof(s.payload->'videos')='array' and jsonb_array_length(s.payload->'videos')>0))
    then raise exception 'Approved genuine property photograph or supported property-specific video required';end if;
 end if;
 update public.properties set status=p_status where id=p_id;
 insert into public.property_publication_events(property_id,actor_id,from_status,to_status,reason)
 values(p_id,v_user,v_record.status,p_status,btrim(p_reason));
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'property.status_changed',jsonb_build_object('property_id',p_id,'from',v_record.status,'to',p_status));
 return p_status;
end $$;
revoke all on function public.landshop_property_transition(uuid,text,text) from public,anon;
grant execute on function public.landshop_property_transition(uuid,text,text) to authenticated;

