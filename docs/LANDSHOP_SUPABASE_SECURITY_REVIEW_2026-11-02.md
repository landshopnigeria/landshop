# Landshop Supabase Access and Performance Review

**Review date:** 2026-11-02  
**Project:** `landshop-enterprise` (`iwkfagzkogzidrbbezds`)  
**Scope:** security and performance advisor findings, privileged public RPCs, foreign-key index coverage and password protection.

## Remediated

- Added all **74** indexes reported by the live Supabase `unindexed_foreign_keys` advisor.
- Confirmed by rerunning the Performance Advisor: **0 remaining unindexed foreign-key findings**.
- Applied migration `20261102101029_landshop_foreign_key_indexes_november_2026.sql` directly to the connected production project and checked the migration history.
- The migration creates indexes only; no data, RLS policies, RPC definitions or existing constraints were removed.

## Reviewed privileged RPCs

At review, Supabase's security advisor listed 74 `SECURITY DEFINER` functions executable by authenticated users; 4 are also executable by anonymous visitors.

The four intentionally anonymous functions are:
1. `landshop_contact_submit`: public enquiry intake (server-side validation, hourly quota, duplicate fingerprint).
2. `landshop_inspection_request`: inspection requests limited to published properties, allowed dates and times, consent and submission quotas.
3. `landshop_newsletter_subscribe`: public email subscription (email and subscription-source validation).
4. `landshop_newsletter_unsubscribe`: unsubscribe by unguessable UUID token.

These are **accepted API exposure points**, not automatically proof of successful privilege escalation. Revoking their anonymous grants without migrating the public website and forms would interrupt those functions. Replacing direct anonymous RPCs with a narrowly authorized, rate-limited server boundary may reduce exposure further, but requires separate end-to-end form testing.

For the other 70 functions, static source inspection identified user-context or authorization helper checks. All 74 reviewed functions have pinned `search_path` configurations, and the scan found no dynamic SQL execution patterns. **Static review is not a penetration test or an assurance of zero vulnerabilities.**

Six tables with RLS and no policies are currently deny-by-default for ordinary API roles; do not grant public policies merely to silence informational lint results.

## Pending account-level setting

The Supabase organization is on the **Free plan**. Supabase's built-in Have I Been Pwned leaked-password protection is available on **Pro or higher**. The setting cannot be activated on the current subscription through this review.

After the organization owner approves the plan upgrade:
1. Open the project Authentication > Sign In / Providers > Email configuration.
2. Enable **Prevent use of leaked passwords** and save.
3. Rerun the Supabase Security Advisor and confirm that the leaked-password warning disappears.

The portal, staff signup and password-reset forms currently require **12 characters**; this is not a substitute for provider-side breached-password detection.

Official documentation: https://supabase.com/docs/guides/auth/password-security

## Monitoring and residual findings

- Newly created indexes initially appear under the `unused_index` informational advisory until real traffic uses them; monitor before deleting them.
- The `multiple_permissive_policies` warnings (18 at review) warrant a separate functional access audit; overlapping permissive policies are not automatically unauthorized access.
- Keep public form rate limiting and anti-spam controls under review, including direct PostgREST RPC paths.
- Do not disable needed privileged functions or weaken RLS solely to clear dashboard warnings.

**Audit conclusion:** Foreign-key indexing resolved and verified. Privileged-function access reviewed with four intentional anonymous exceptions. Provider-level leaked-password protection is blocked by the current Free plan and requires an approved subscription upgrade.
