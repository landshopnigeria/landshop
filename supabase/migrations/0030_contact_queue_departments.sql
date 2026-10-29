-- Applied live as 20261029184235 / landshop_contact_topic_queue_v20.
-- V20 customer-care queue: allow consent-based property-update requests and audited staff decisions.
alter table public.contact_enquiries drop constraint if exists contact_enquiries_topic_check;
alter table public.contact_enquiries add constraint contact_enquiries_topic_check check (
 topic in ('Property Acquisition','Mortgage Guidance','Property Inspection',
 'Develop','Incubate','Grow','Customer Support','Property Updates','Other'));
create or replace function public.landshop_contact_decide(p_enquiry uuid,p_status text,p_note text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_current text;
begin
 if v_user is null or not exists(
  select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
  where m.user_id=v_user and m.status='active' and o.kind='landshop'
  and m.role in ('owner','executive','admin','operations','sales','marketing')
 ) then raise exception 'Landshop staff access denied';end if;
 if p_status not in ('assigned','in_progress','resolved','closed') or
 length(btrim(coalesce(p_note,''))) not between 15 and 1000 then raise exception 'Invalid enquiry decision';end if;
 select status into v_current from public.contact_enquiries where id=p_enquiry for update;
 if not found or v_current='closed' then raise exception 'Enquiry cannot be updated';end if;
 update public.contact_enquiries set status=p_status,assigned_to=coalesce(assigned_to,v_user),updated_at=now() where id=p_enquiry;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_user,'contact.enquiry.status_changed',jsonb_build_object('enquiry_id',p_enquiry,'status',p_status,'note',trim(p_note)));
 return true;
end $$;
revoke all on function public.landshop_contact_decide(uuid,text,text) from public,anon;
grant execute on function public.landshop_contact_decide(uuid,text,text) to authenticated;

