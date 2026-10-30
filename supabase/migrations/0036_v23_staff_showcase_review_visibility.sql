-- Applied production 20261030011735: landshop_v23_staff_read_approved_prepublication_showcases

-- Staff reviewing draft/review listings must see approved showcase data without public exposure.
grant select on public.property_showcase to authenticated;
drop policy if exists landshop_showcase_verified_staff_read on public.property_showcase;
create policy landshop_showcase_verified_staff_read on public.property_showcase for select to authenticated
 using (public.landshop_property_editor((select auth.uid()),false));
-- Keep private drafts and assets invisible to anonymous users.

