# Landshop V22 — Approved Design Implementation / Release Readiness

## Implemented on `feature/landshop-v22-approved-content`
- Homepage: approved 9-section editorial design, including three original product journeys, live published inventory cards, service-specific photography, location directory, article carousel, historic testimonial carousel and final CTA.
- Original homepage hero slider and property filter preserved byte-for-byte; `SiteHeader.tsx` and header/navigation CSS untouched.
- About: purpose, company story, vision/mission, values, three-image collage, products, heritage gallery, historical recognition, final action.
- Contact: nine sections; existing `ContactForm` and backend `/api/contact` preserved; verified office map and appointment guidance retained.
- Services: new service directory, with existing dynamic service detail engine extended to six service routes.
- Locations: eight state/FCT directory/detail pages, with historical estate data separated from current published marketplace search.
- Partners: dedicated directory including 11 historical references; no unverified active endorsements claimed.
- Insights: 20 routes, new category/search controls, editorial image cards, longer articles, reading sidebars, related links, article tags, and existing consent-based ContactForm capture.
- Article comments: authenticated POST API, public approved-only GET, secure Supabase RLS migration 20261030010331, client editor, cross-subdomain sign-in return, and a staff-only moderation page at /admin/comments have been implemented. Live authenticated smoke testing still required.
- Shared footer: visually unchanged homepage footer extracted as `SiteFooter`, reused across home, content, and marketplace/contact page templates.
- Existing property details and marketplace property filter files remain untouched. Only approved published property database inventory is shown.

## Verification requirements prior to production
1. GitHub pull request CI: `npm run build -w @landshop/website` must pass.
2. Protected header, hero and filter comparison must pass `node scripts/verify-v22-protected.cjs`.
3. Visually compare homepage, About and Contact at 390, 768, 1024, 1440 px and check keyboard access, reduced motion, animations and layout shifts.
4. Verify `/api/contact` submission and acknowledgment only in a controlled environment; use no real customer PII in automated tests.
5. Check all current service routes, 8 location URLs and 20 Insights routes for 200/404 accuracy, canonical metadata and internal links.
6. Confirm original Landshop asset licensing, image credit, and current partner logo permission before replacing editorial imagery or historical name treatments.
7. Verify property-detail image/media integration with the three genuine approved active listings; no archival sample property must be published as a live listing.
8. Portal sign-in and comment moderation require a confirmed authorized management membership and live, consent-aware smoke testing before activation.
9. Reconcile duplicate footer calls on any application or enterprise route outside the public marketing app without restyling the approved public footer.
10. Make a verified database/file backup and validate deployment/rollback procedures, transactional notification delivery and Supabase authorization policies.
11. Only after successful checks, merge the approved PR and deploy directly to the existing production destinations. No public staging domain.

## Known limitations
- No production deployment has been performed by this branch.
- CI/build and cross-browser E2E tests are pending until GitHub Actions runs.
- Original product-deck image binary assets were not uploaded into the GitHub repository in this change; existing approved editorial photography is reused and historic project assets remain archive-only.
- Article comment data model and moderation UI are committed; final authenticated publish/approve/reject smoke testing requires a verified staff account.
- Historical financial offerings (70% ROI, historic mortgage interest and instalment terms) are intentionally not marketed as current financial offers.

## Protected assets
- `apps/website/components/SiteHeader.tsx` unchanged.
- `apps/website/app/site-navigation.css` unchanged.
- `apps/website/app/icon-treatments.css` unchanged.
- The original homepage hero section and `glass-search` form unchanged.
- `apps/website/lib/marketplace.ts` unchanged.

## Deployment workflow hardening (V22)
- Existing `.github/workflows/deploy-landshop-enterprise.yml` automatically releases a successful `main` foundation workflow to Namecheap. It validates backups and rollback prerequisites, database migrations, current TLS routing, and app build bundles before touching production.
- Added an upload-start marker and an automatic backup restoration step on failure after upload, protecting all three application roots.
- Earlier run 40413886726 had uploaded files but failed public `/api/release-health` with HTTP 404. Publication is not considered successful until the current run confirms exact commit and HTML/asset parity on production domains.
- New Supabase comments migration is already applied and verified with RLS; it is also versioned in the GitHub repo.
