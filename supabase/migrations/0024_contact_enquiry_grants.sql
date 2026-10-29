-- Live database: applied with Supabase migration v16_contact_enquiry_grants on 2026-10-29.
-- Existing public.contact_enquiries RLS limits public intake to default-new, consented, unassigned messages.
revoke all on public.contact_enquiries from anon,authenticated;
grant insert(full_name,email,phone,topic,message,consent,fingerprint) on public.contact_enquiries to anon,authenticated;
grant select on public.contact_enquiries to authenticated;
