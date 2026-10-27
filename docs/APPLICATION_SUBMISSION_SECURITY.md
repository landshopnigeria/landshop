# Landshop product-application submission security — pending release gate

- Versioned migration: `supabase/migrations/0021_application_submission_validation.sql`. **Committed for review only; not applied to production.**
- Existing RPC accepts a draft owned by `auth.uid()`, row-locks its record, validates supported product-required fields and declaration, requires uploaded passport storage object for document-bearing products, posts audit and notification outbox records, and transitions only from draft to submitted.
- Explicit errors identify a missing field by key without revealing other customers' data.
- Product-specific rates, equity splits, investment returns, and refund formulas are intentionally **not** hardcoded.
- Existing application row-level policies remain in force. Privileged staff review and state transitions must remain separate RPCs.
- The current `public` SECURITY DEFINER function is in the exposed schema. Migration replaces an existing RPC, and its explicit ownership check is vital. Long-term hardening should move privilege-bearing implementations into a private schema and expose audited minimal wrappers.
- Prior to applying: inspect all previous drafts, run a database backup and restore drill, run Supabase SQL tests as authenticated owner / unrelated user / anon, check passport object storage lookup, and retest notification outbox insertion and replay.
- A PR build does **not** validate SQL execution or security. Do not claim this migration deployed until database tests and migration history confirm it.
