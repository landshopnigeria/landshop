-- Management can read operational submissions regardless of which management title was assigned.
-- Own-account policies remain unchanged for staff and customers.
create policy command_management_profiles_read on public.profiles for select to authenticated using ((select public.landshop_is_management(auth.uid())));
create policy command_management_applications_read on public.applications for select to authenticated using ((select public.landshop_is_management(auth.uid())));
create policy command_management_kyc_read on public.kyc_submissions for select to authenticated using ((select public.landshop_is_management(auth.uid())));
create policy command_management_support_read on public.support_tickets for select to authenticated using ((select public.landshop_is_management(auth.uid())));
create policy command_management_enquiries_read on public.contact_enquiries for select to authenticated using ((select public.landshop_is_management(auth.uid())));
