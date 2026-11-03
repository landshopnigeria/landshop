# Command Center implementation

The `/admin` route tree now uses the approved compact white/teal workspace. All module destinations are real existing pages, with authenticated management checks on the layout and privileged APIs. The overview uses live database records; it does not import the design preview’s sample metrics.

## Delivered

- Shared navigation, module search, collapsible desktop navigation and mobile drawer.
- Parallel overview queries and request-scoped management-auth deduplication.
- Website text/link/image editor, public photograph uploads, reason/audit history, revision conflict checks, draft publication isolation and restore original. Public requests read only active publication snapshots, cached for 15 seconds. Changes are scoped to exact route, selector and original content, so source drift fails closed. The editor operates on visible content; layout/code and SEO metadata are still source managed.
- Referral tree with lazy downline expansion, zoom, profile information and submitted portrait access, linked submitted forms and both loaded-tree and full-dataset exports. Private portraits use authorized short-lived URLs; missing photos use initials.
- Paginated export center for all listed operational datasets and account registration records. Nested form objects are flattened with their field names; arrays retain JSON. Exports include the union of fields across rows. CSV, JSON, Excel and Word downloads plus a complete field-by-field print/PDF report. Browser export limit is explicitly 50,000 rows; failures do not offer partial data as complete. Exports are cutoff-filtered live reads, not transactionally frozen database snapshots.
- Workflow full-canvas mode hides outer and inner sidebars, with zoom/pan, manual nodes and official social logos, automatic horizontal/vertical arrangement and clickable outline. Existing graph saves, optimistic versions, rehearsals and durable preview jobs are retained. Email automation and outbound delivery have direct navigation entries.

## Remaining activation boundaries

The existing prompt composer is deterministic, not an AI model. Genuine AI generation requires the user’s API credential decision before API implementation. The visual social destinations are draft connector definitions; this release does not establish OAuth connections or claim successful external posting on Facebook, Instagram, YouTube, TikTok, Pinterest, LinkedIn or groups. The NEXUS runtime remains preview-only. Actual email/SMS/WhatsApp delivery belongs to the separate existing communications engine. At verification, all three channel enable flags were false; this UI release does not activate customer sends.

## Validation

Both Next.js production builds and TypeScript checks passed. `scripts/verify-command-center.mjs` checks route destinations, content URL restrictions, export field preservation/formula safety and canvas syntax. Database integration checks for publishing, draft isolation, optimistic conflicts, original restoration, referral result shape and non-manager isolation passed; test writes were rolled back. Browser QA could not be completed because the available managed preview lacked the application dependencies.
