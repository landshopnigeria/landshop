-- First-party business events -> transactional outbox.
-- Trigger after state transitions only. Payloads contain IDs, never contact, KYC
-- document text, image URLs, payment secrets, or user-submitted rich fields.
create schema if not exists landshop_private;
revoke all on schema landshop_private from public,anon,authenticated;
create or replace function landshop_private.emit_business_event()
returns trigger language plpgsql security definer set search_path='' as $evt$
declare v_kind text;v_user uuid;v_entity uuid;
begin
 if tg_table_name='staff_tasks' and tg_op='INSERT' then
  v_kind:='staff.task_assigned';v_user:=new.assignee_id;v_entity:=new.id;
 elsif tg_table_name='applications'
   and new.status='submitted'
   and (tg_op='INSERT' or old.status is distinct from new.status) then
  v_kind:='application.submitted';v_user:=new.applicant_id;v_entity:=new.id;
 elsif tg_table_name='kyc_submissions'
   and new.status='submitted'
   and (tg_op='INSERT' or old.status is distinct from new.status) then
  v_kind:='kyc.submitted';v_user:=new.applicant_id;v_entity:=new.id;
 elsif tg_table_name='support_tickets' and tg_op='INSERT' then
  v_kind:='support.ticket_created';v_user:=new.requester_id;v_entity:=new.id;
 elsif tg_table_name='referral_edges' and tg_op='INSERT' then
  v_kind:='referral.registered';v_user:=new.referee_id;v_entity:=new.referee_id;
 else
  return new;
 end if;
 insert into public.notification_outbox(event_type,user_id,payload)
 values(v_kind,v_user,jsonb_build_object('entity_id',v_entity,'source_table',tg_table_name));
 return new;
end $evt$;
revoke all on function landshop_private.emit_business_event() from public,anon,authenticated;

drop trigger if exists ls_outbox_staff_task_created on public.staff_tasks;
create trigger ls_outbox_staff_task_created
 after insert on public.staff_tasks
 for each row execute function landshop_private.emit_business_event();

drop trigger if exists ls_outbox_application_submitted on public.applications;
create trigger ls_outbox_application_submitted
 after insert or update of status on public.applications
 for each row execute function landshop_private.emit_business_event();

drop trigger if exists ls_outbox_kyc_submitted on public.kyc_submissions;
create trigger ls_outbox_kyc_submitted
 after insert or update of status on public.kyc_submissions
 for each row execute function landshop_private.emit_business_event();

drop trigger if exists ls_outbox_support_ticket_created on public.support_tickets;
create trigger ls_outbox_support_ticket_created
 after insert on public.support_tickets
 for each row execute function landshop_private.emit_business_event();

drop trigger if exists ls_outbox_referral_registered on public.referral_edges;
create trigger ls_outbox_referral_registered
 after insert on public.referral_edges
 for each row execute function landshop_private.emit_business_event();
