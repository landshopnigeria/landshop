-- Restrict organization visibility to current members; membership itself is service-managed.
drop policy if exists landshop_org_member_read on public.organizations;
create policy landshop_org_member_read on public.organizations
 for select to authenticated using(
   exists(select 1 from public.organization_members m
     where m.organization_id=id and m.user_id=(select auth.uid()) and m.status='active')
 );
-- Read-only review queue access for authorized Landshop staff.
-- No customer or staff access to private KYC files beyond their own prefix.
-- No approval function is exposed by this migration.
drop policy if exists kyc_authorized_reviewer_read on public.kyc_submissions;
create policy kyc_authorized_reviewer_read on public.kyc_submissions
 for select to authenticated using (
 exists (
 select 1 from public.organization_members m
 join public.organizations o on o.id=m.organization_id
 where m.user_id=(select auth.uid())
   and m.status='active'
   and o.kind='landshop'
   and m.role in ('owner','admin','legal','operations')
 )
);
-- The existing own-record policy remains applicable.
-- Role administration remains service-controlled; authenticated members cannot self-assign roles.
