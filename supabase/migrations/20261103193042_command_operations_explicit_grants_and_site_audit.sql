revoke all on public.support_ticket_attachments,public.landshop_client_surveys,public.landshop_survey_invitations,public.landshop_survey_responses from public,anon;
create function public.landshop_command_survey_close(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.landshop_is_management(auth.uid()) then raise exception 'Management access required';end if;
 update public.landshop_client_surveys set state='closed' where id=p_id;
 if not found then raise exception 'Survey unavailable';end if;return true;
end $$;
revoke all on function public.landshop_command_survey_close(uuid) from public,anon;grant execute on function public.landshop_command_survey_close(uuid) to authenticated;
create function public.landshop_allocation_site_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.landshop_is_management(auth.uid()) then raise exception 'Management access required';end if;
 if new.survey_layout_path is not null and new.survey_layout_path not like '%/'||new.id::text||'/%' then raise exception 'Survey layout must be uploaded to this site folder';end if;
 insert into public.audit_events(actor_id,event_type,metadata) values(auth.uid(),'allocation.site_'||lower(tg_op),jsonb_build_object('site_id',new.id,'survey_status',new.survey_status));
 return new;
end $$;
revoke all on function public.landshop_allocation_site_audit() from public,anon,authenticated;
create trigger allocation_site_audit before insert or update on public.allocation_sites for each row execute function public.landshop_allocation_site_audit();
