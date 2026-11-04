-- Applied to Landshop production Supabase on 2026-11-04 via migration
-- 20261104070210_landshop_management_fk_indexes_nov4. Retained here so
-- development, recovery and production databases share the same schema.
-- The indexes cover management-user foreign-key lookups only. No RLS, grants,
-- role assignments or customer data are modified.
CREATE INDEX IF NOT EXISTS landshop_account_controls_changed_by_idx
  ON public.landshop_account_controls (changed_by);

CREATE INDEX IF NOT EXISTS landshop_management_assignments_assigned_by_idx
  ON public.landshop_management_assignments (assigned_by);

CREATE INDEX IF NOT EXISTS landshop_management_assignments_claimed_by_idx
  ON public.landshop_management_assignments (claimed_by);
