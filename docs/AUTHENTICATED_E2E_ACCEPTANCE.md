# Landshop authenticated end-to-end acceptance

## Why the former E2E run showed two skipped groups

The public smoke test ran without the dedicated production E2E login credentials. It could verify anonymous pages, but not actual sessions or authorized views. The new authenticated suites **fail closed** when credentials are absent, rather than returning an apparent pass.

## Identity and security prerequisites

Use **three separate, real, email-confirmed, dedicated testing identities** in the Landshop Supabase Auth project. Never reuse a real customer, employee, owner, CEO, or administrator account, and never place passwords in the repository, this document, issue comments, Slack, or a chat.

1. **Customer E2E user:** Confirmed customer with a valid customer profile, no staff membership, no management assignment, and only fictional/minimal test data. Use the normal customer registration process or an authorized Supabase Auth admin invitation.
2. **Staff E2E user:** Confirmed, onboarded basic employee with an active personal workspace but **no management permission**. Use the normal staff signup and approval flow. The test verifies this identity cannot access Command Center.
3. **Management E2E user:** Confirmed, separately approved test manager with an **audited, active** organization membership that the existing \`landshop_is_management\` gate recognizes. Provision using the existing authorized Landshop management administration process. Don't add management rights based on editable \`user_metadata\`, a signup role dropdown, raw SQL Auth manipulation, or a test-only bypass. This user must already have claimed any required prior assignment before running E2E.

All three identities should have separate high-entropy passwords kept only in GitHub Actions encrypted repository secrets (or an approved GitHub environment). Ensure the test mailboxes are under business control. Record the test identities and approver in the internal credential vault, and rotate/revoke them if leaked.

## Six GitHub Actions secrets

Go to the Landshop GitHub repository > **Settings > Secrets and variables > Actions > Repository secrets**. Add these exact names, each with the designated **dedicated testing** credential:

| Secret | Purpose |
|---|---|
| \`LANDSHOP_E2E_CUSTOMER_EMAIL\` | Dedicated customer login |
| \`LANDSHOP_E2E_CUSTOMER_PASSWORD\` | Customer password |
| \`LANDSHOP_E2E_STAFF_EMAIL\` | Non-management staff login |
| \`LANDSHOP_E2E_STAFF_PASSWORD\` | Staff password |
| \`LANDSHOP_E2E_MANAGEMENT_EMAIL\` | Authorized test manager (not a personal Owner login) |
| \`LANDSHOP_E2E_MANAGEMENT_PASSWORD\` | Management password |

No service-role or Supabase secret key is required to **execute** these browser suites. Login occurs through the actual public Landshop sign-in forms using Supabase's usual session and access checks.

## Run the full authenticated suite

Open **Actions > Landshop Production End-to-End Readiness > Run workflow**, select the current \`main\` branch and choose **all**. The workflow launches two distinct jobs:

- **Authenticated customer dashboard and permissions:** verifies customer sign-in, dashboard, referrals, account, KYC, applications, restricted admin access and phone/tablet/desktop behavior.
- **Authenticated staff, management and Automation Studio:** verifies ordinary staff access and least privilege, dedicated management sign-in, protected Command Center views, workflow canvas initialization, exclusive accordions, mobile canvas modes, Communications sections, runtime JavaScript errors and responsive layouts.

Both tests are deliberately **read-only** after sign-in: they do not submit KYC, edit tasks, clock attendance, change permission assignments, create/pay invoices, queue workflows, send WhatsApp/SMS/email, or publish campaigns. Signing in creates ordinary authentication sessions; pre-claim a management assignment before the test if your existing login flow would otherwise claim it.

If credentials are missing, the corresponding job fails early with \`AUTH E2E BLOCKED\` and names **only the missing secret variable**, not its value. It is **not** reported as a passed authenticated test.

## Automatic coverage after each successful production release

Once the three dedicated users and six secrets are verified, add repository variable \`LANDSHOP_ENABLE_AUTH_E2E\` with value \`true\` under **Settings > Secrets and variables > Actions > Variables**. A successful Namecheap production release from \`main\` will then launch both authenticated suites automatically. Leave this opt-in disabled until test credentials are provisioned and reviewed. Manual runs can be performed first.

## What a successful release proves

- Public production checks still test anonymous routes, release SHA, assets, logo, core forms, and signed-out protection.
- The **customer** green check confirms real customer sign-in and read-only access to personal dashboard routes.
- The **staff/management** green check confirms separate non-manager and verified management authorization, mobile layouts, an initialized workflow canvas, and safe communications navigation.
- No test asserts zero latency or guarantees a first-place Google ranking. Track Web Vitals and p95 interaction latency separately and maintain indexing exclusively for **public** website pages; private Command Center and customer data must remain noindex.

**Not complete until both authenticated jobs are green against the exact successful production release.** Missing credentials, failed authorization, route regressions or UI initialization failures must be recorded as blocked/failed, never silently skipped.
