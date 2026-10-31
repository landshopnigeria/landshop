-- LANDSHOP V27: management-visible operational records, owner-controlled export log.
-- Data API remains read-only for export users. No unprotected KYC media links.
create policy ls_management_view_profiles on public.profiles
 for select to authenticated using(public.landshop_is_management((select auth.uid())));
create policy ls_management_view_referral_codes on public.referral_codes
 for select to authenticated using(public.landshop_is_management((select auth.uid())));
create policy ls_management_view_referral_tree on public.referral_edges
 for select to authenticated using(public.landshop_is_management((select auth.uid())));
create policy ls_management_view_referral_wallets on public.referral_wallets
 for select to authenticated using(public.landshop_is_management((select auth.uid())));
create policy ls_management_view_referral_rewards on public.referral_reward_events
 for select to authenticated using(public.landshop_is_management((select auth.uid())));
create policy ls_management_view_application_documents on public.application_documents
 for select to authenticated using(public.landshop_is_management((select auth.uid())));
create policy ls_management_view_audit on public.audit_events
 for select to authenticated using(public.landshop_is_management((select auth.uid())));

create or replace function public.landshop_record_command_export(
 p_dataset text,p_format text,p_count integer
) returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid());
begin
 if actor is null or not exists(select 1 from public.organization_members m join public.organizations o
 on o.id=m.organization_id where m.user_id=actor and m.role='owner' and m.status='active' and o.kind='landshop')
 then raise exception 'Verified Landshop owner only';end if;
 if p_dataset not in ('referrals','referral_codes','referral_wallets','referral_rewards','referral_qualifications','customers','applications',
  'kyc','application_documents','staff','staff_reports','tasks','payments','subscriptions','properties','automation_runs','audit_events')
  or p_format not in ('csv','json','xlsx','pdf') or p_count not between 0 and 10000
 then raise exception 'Invalid export request';end if;
 if (select count(*) from public.audit_events where actor_id=actor and event_type='command.export_requested'
  and created_at>now()-interval '1 hour')>=40 then raise exception 'Hourly export limit reached';end if;
 insert into public.audit_events(actor_id,event_type,metadata)
 values(actor,'command.export_requested',jsonb_build_object('dataset',p_dataset,'format',p_format,'rows',p_count));
 return true;
end $$;
revoke all on function public.landshop_record_command_export(text,text,integer) from public,anon;
grant execute on function public.landshop_record_command_export(text,text,integer) to authenticated;
