create policy allocation_management_read on public.allocation_cases for select to authenticated using(public.landshop_is_management(auth.uid()));
create policy allocation_management_sites_read on public.allocation_sites for select to authenticated using(public.landshop_is_management(auth.uid()));
create policy allocation_management_programmes_read on public.allocation_programmes for select to authenticated using(public.landshop_is_management(auth.uid()));
-- Customer response shape and atomic audit events for questionnaires and invitations.
create function public.landshop_survey_guard_audit() returns trigger language plpgsql security definer set search_path='' as $$
declare q jsonb; survey public.landshop_client_surveys;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if tg_table_name='landshop_survey_responses' then
 select * into survey from public.landshop_client_surveys where id=new.survey_id;
 if survey.state<>'published' or not exists(select 1 from public.landshop_survey_invitations i where i.survey_id=new.survey_id and i.recipient_id=auth.uid()) or new.user_id<>auth.uid() then raise exception 'Survey invitation required';end if;
 if (select count(*) from jsonb_object_keys(new.answers))<>jsonb_array_length(survey.questions) then raise exception 'Answer every survey question';end if;
 for q in select * from jsonb_array_elements(survey.questions) loop
 if jsonb_typeof(new.answers->(q#>>'{}'))<>'string' or length(btrim(coalesce(new.answers->>(q#>>'{}'),''))) not between 1 and 1000 then raise exception 'Every question needs an answer (1-1000 characters)';end if;
 end loop;
 else
 if not public.landshop_is_management(auth.uid()) then raise exception 'Management access required';end if;
 if tg_table_name='landshop_client_surveys' then
 for q in select * from jsonb_array_elements(new.questions) loop
 if jsonb_typeof(q)<>'string' or length(btrim(q#>>'{}')) not between 3 and 500 then raise exception 'Questions must be text (3-500 characters)';end if;
 end loop;
 if (select count(distinct v) from jsonb_array_elements_text(new.questions) v)<>jsonb_array_length(new.questions) then raise exception 'Question wording must be unique';end if;
 end if;
 end if;
 insert into public.audit_events(actor_id,event_type,metadata) values(auth.uid(),tg_table_name||'.'||lower(tg_op),jsonb_build_object('record_id',new.id));
 return new;
end $$;
revoke all on function public.landshop_survey_guard_audit() from public,anon,authenticated;
create trigger client_survey_audit before insert or update on public.landshop_client_surveys for each row execute function public.landshop_survey_guard_audit();
create trigger survey_invitation_audit before insert on public.landshop_survey_invitations for each row execute function public.landshop_survey_guard_audit();
create trigger survey_response_audit before insert on public.landshop_survey_responses for each row execute function public.landshop_survey_guard_audit();
-- Align the existing audited support transition with verified management roles.
create or replace function public.landshop_support_decide(p_ticket uuid,p_status text,p_priority text,p_note text) returns boolean language plpgsql security definer set search_path='' as $$
declare t public.support_tickets; allowed text[];
begin
 if auth.uid() is null or not public.landshop_is_management(auth.uid()) then raise exception 'Management access required';end if;
 if p_priority not in ('low','normal','high','urgent') or p_status not in ('open','in_progress','awaiting_customer','resolved','closed') or length(btrim(coalesce(p_note,''))) not between 10 and 2000 then raise exception 'Valid status, priority and customer-visible note required';end if;
 select * into t from public.support_tickets where id=p_ticket for update;if not found then raise exception 'Ticket not found';end if;
 allowed:=case t.status when 'open' then array['open','in_progress','closed'] when 'in_progress' then array['in_progress','awaiting_customer','resolved','closed'] when 'awaiting_customer' then array['awaiting_customer','in_progress','resolved','closed'] when 'resolved' then array['resolved','in_progress','closed'] else array['closed'] end;
 if not p_status=any(allowed) then raise exception 'Unsupported ticket transition';end if;
 update public.support_tickets set status=p_status,priority=p_priority,updated_at=now() where id=p_ticket;
 insert into public.support_ticket_events(ticket_id,actor_id,event_type,note) values(p_ticket,auth.uid(),'status_updated',btrim(p_note));
 insert into public.audit_events(actor_id,event_type,metadata) values(auth.uid(),'support.status_updated',jsonb_build_object('ticket_id',p_ticket,'status',p_status));
 insert into public.notification_outbox(event_type,user_id,payload) values('support.status_updated',t.requester_id,jsonb_build_object('ticket_id',p_ticket,'status',p_status));
 return true;
end $$;
revoke all on function public.landshop_support_decide(uuid,text,text,text) from public,anon;grant execute on function public.landshop_support_decide(uuid,text,text,text) to authenticated;
