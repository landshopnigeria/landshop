-- Read permissions for the live Global Command Center.
-- Application answers contain sensitive personal and financial details. Only verified staff in
-- operations, legal, finance and ownership may view them; realtors and ordinary sales cannot.
drop policy if exists application_staff_review on public.applications;
create policy application_staff_review on public.applications for select to authenticated using(
 exists(select 1 from public.organization_members m
 join public.organizations o on o.id=m.organization_id
 where m.user_id=(select auth.uid()) and m.status='active' and o.kind='landshop'
 and m.role in ('owner','admin','operations','legal','finance')));
drop policy if exists landshop_audit_staff_read on public.audit_events;
create policy landshop_audit_staff_read on public.audit_events for select to authenticated using(
 exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=(select auth.uid()) and m.status='active' and o.kind='landshop'
 and m.role in ('owner','admin','legal')));
grant select on public.audit_events to authenticated;
drop policy if exists landshop_application_events_staff on public.application_events;
create policy landshop_application_events_staff on public.application_events for select to authenticated using(
 exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.user_id=(select auth.uid()) and m.status='active' and o.kind='landshop'
 and m.role in ('owner','admin','operations','legal','finance')));
