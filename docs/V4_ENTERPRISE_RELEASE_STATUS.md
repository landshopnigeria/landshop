# Landshop Enterprise — V4 implementation release register

Last updated 2026-10-26.

## Source implemented in landshopnigeria/landshop
- V4 website design: responsive top navigation, hover glass mega menus, 3-slide Develop/Incubate/Grow hero, glass property filters, product overview, estate gallery, insights and footer.
- Portal: real email/Google Supabase auth source, secure multi-step seven form journeys, draft persistence, original product logo lockup references, document uploads, and transactional submission RPC.
- Finance: configurable amortization mortgage calculator, payment breakdown and CSV export. Do not publish old guaranteed ROI or interest-rate claims.
- Global Command Center: role-gated Supabase-backed statistics, inventory, application queues, KYC, import reviews and management navigation, no invented KPI figures.
- Automation Studio: draggable visual editor, sidebars, node inspector and versioned draft saves; Beta Mortgage and Mortgage Xtra examples seeded as DRAFTS.
- Seven Cities: programme metadata, survey-site register, CX/Finance/Legal/Survey prerequisite model, trackable allocation cases and command-center route.
- SQL migrations 0001 through 0020 applied successfully in iwkfagzkogzidrbbezds, including RLS and private media buckets.
- CI deployment workflow: .github/workflows/deploy-landshop-enterprise.yml. The workflow deliberately stops if assets, builds or SSH secrets are missing.

## Required V4 image assets NOT YET COMMITTED IN GITHUB
Image assets exist in the user's Landshop V4 preview ZIP and in the generated transfer pack:
  Landshop_V4_Original_Photos_Production_Asset_Pack.zip
Before deployment, place the files under each Next.js app:
- apps/website/public/media/*.webp
- apps/portal/public/media/*.webp
- apps/dashboard/public/media/*.webp

Do not upload flattened UI screenshots as section images. Validate the original estate ZIP and deck provenance JSON first.
No synthetic images may be represented as actual owner/developer property photos.

## Required deployment access and configuration
- Namecheap app roots must be checked in cPanel Setup Node.js App. Existing candidate folders are /home/maleghif/landshop-website, /home/maleghif/landshop-portal and /home/maleghif/landshop-app, but are NOT verified against each running Passenger application and its URL.
- GitHub landshop-production environment secrets:
 LANDSHOP_SSH_HOST, LANDSHOP_SSH_USER, LANDSHOP_SSH_KEY, LANDSHOP_SSH_KNOWN_HOSTS,
 LANDSHOP_WEBSITE_APPROOT, LANDSHOP_PORTAL_APPROOT, LANDSHOP_DASHBOARD_APPROOT.
- GitHub environment variables:
 LANDSHOP_SUPABASE_URL and LANDSHOP_SUPABASE_PUBLISHABLE_KEY.
- cPanel Node runtime env for Portal and Dashboard must include NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and optional trusted server integrations.
- Node.js runtime must match the Next.js build. Build and all routes must be tested before replacing currently visible static pages.
- Standalone apps are deployed to application roots, NOT /public_html, with Passenger startup server.js and tmp/restart.txt.

## Release blockers at the time of writing
1. All 65 original V4 media files are local artifacts, not yet present in GitHub.
2. No GitHub Action full build/test success has been observed.
3. No cPanel SSH deployment connection or confirmed application-root variables exposed to the tools in this chat.
4. Supabase auth.users currently has zero users; there are no active Landshop organization memberships. Owner sign-in needs a verified account and explicit trusted provisioning.
5. No real property records, customer applications, or permissions test accounts exist. RLS cannot be considered end-to-end verified.
6. Email/SMS/WhatsApp vendor configuration and live delivery are unverified; all mortgage workflows remain drafts.
7. OpenAI article-image server integration, real mobile client binary and live payment processing require further work/credentials.
8. The current live static pages should remain as rollback until all release gates pass.

## Required release tests
- Build website, portal, dashboard with approved original assets and working env.
- Verify auth email callback, reset password, Google OAuth, signed-in dashboards, cross-subdomain cookie handling.
- Create verified test owner, customer, sales, reviewer accounts; exercise every role and RLS deny path.
- Exercise every form's Save Draft → upload → review → Submit RPC and negative validation path.
- Test verified title document/private media and second-reviewer publication of property.
- Verify authorization for KYC and automation draft edits.
- Verify Seven Cities allocation case cannot advance without all four departmental clearances and eligibility.
- Validate invoice and mortgage outputs against lender-approved reference, not legacy marketing document terms.
- Run delivery channel sandboxes and monitor the outbox without sending unauthorized customer messages.
- Validate actual public domain responses, static assets, media, logs and rollback after deploying.

## Safeguard
A committed component or successful SQL migration is NOT equivalent to production publication. Do not announce Landshop enterprise functionality live until final Namecheap release succeeds.
