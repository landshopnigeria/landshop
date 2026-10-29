# Landshop owner activation — controlled production runbook

This is a manual security workflow, not an automatic promotion of customer accounts.

1. Intended owner registers at https://portal.landshopnigeria.com and confirms the email link.
2. A GitHub administrator separately sets `LANDSHOP_OWNER_EMAIL` as an **environment variable** under Settings → Environments → landshop-production. Only the authorized owner email is allowed. Restrict environment deploy permissions/reviewers.
3. GitHub administrator opens Actions → Activate Verified Landshop Owner Account → Run workflow on main, entering that same email.
4. Workflow requires a matching approved email, verified Supabase auth user, non-banned/non-deleted account, exactly one Landshop organization and no other active owner. It writes membership and an audit event in a transaction and is idempotent for an existing matching owner. No passwords, OTP codes or access tokens are needed in GitHub.
5. Owner signs in and opens https://app.landshopnigeria.com/admin to perform authenticated testing.

If Supabase has no confirmed owner user or emails are undelivered, activation **must fail safely**. Do not use raw user metadata or user-controlled role fields to grant permission. A successful workflow confirms permission assignment, not email deliverability, secure session behavior or KYC business acceptance.

Do not store or share passwords or API keys in the GitHub issue, workflow inputs or chat. All scripts use the previously configured `LANDSHOP_SUPABASE_DATABASE_URL` environment secret.