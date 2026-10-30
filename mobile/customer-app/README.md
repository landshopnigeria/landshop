# Landshop Customer Mobile — Native App (development)

This is the isolated React Native / Expo customer application source using the **existing Landshop Supabase project**. It does not replace the live website or portal and does not create new staff identities.

## Implemented source

- Landshop-branded, mobile-centred two-step customer registration and password sign-in.
- Existing Supabase confirmation email and password recovery.
- **Native Google OAuth and direct email return** through a strict `landshop://auth/callback` URI handler, with PKCE code exchange or Supabase token-hash verification.
- Native recovery password screen after a verified recovery callback.
- Signed-in dashboard: applications, KYC status, verified referral code and shareable QR.
- Referrals remain server-attributed; mobile app cannot grant itself commissions or rewrite wallet balances.
- An invitation can be opened with `landshop://invite?ref=LANDSHOP01`. Other domains and arbitrary redirects are discarded.
- Until native redirects are approved, browser-based confirmation, recovery and Google flows use the existing customer portal. The app has **no automatic website-cookie import**.

## Local developer setup

1. `cd mobile/customer-app`
2. Copy `.env.example` to `.env`. Enter only Landshop's **Supabase publishable key**, never a secret or service-role key.
3. `npm install` to install pinned dependencies.
4. `npm run typecheck` and `npm run test:links`.
5. Use a development build for native auth and external callback testing. Expo Go and app-store binaries are not considered verified.

## Native redirect activation (not yet enabled)

Native OAuth is intentionally **off by default**:

```ini
EXPO_PUBLIC_NATIVE_AUTH_REDIRECT_READY=false
```

Enable only after the following have been manually verified by an authorized Supabase/Android/iOS operator:

- In the **existing** Landshop Supabase Auth URL Configuration, add both exact allowed redirects `landshop://auth/callback` (signup and Google) and `landshop://auth/callback?type=recovery` (password reset). Do not enable native auth until both have been tested.
- Confirm Supabase Google sign-in provider and the official Google Cloud authorized callback.
- Install a signed native development build and test `landshop://auth/callback?code=...` and `landshop://auth/callback?type=recovery&code=...` on real Android and iOS hardware using disposable test accounts. Never reuse a consumed code or paste access tokens in logs.
- Confirm a confirmation-email callback, a Google sign-in callback, and password recovery all return to the correct native screen.
- Then set `EXPO_PUBLIC_NATIVE_AUTH_REDIRECT_READY=true` for the appropriate signed build. Changing an Expo environment variable does not retroactively change an installed binary.

## Present limitations and release gate

- Individual KYC document upload and read-only application tracking are now native. Completing certain product application drafts, specialist company/realtor KYC, and account management still opens the protected **web** experience and may require separate web authentication. Native and web cookies are not assumed to be shared.
- Google login opens the existing website until the flag above is enabled. The in-app implementation is ready for controlled test, not yet production-proven.
- Deep links received from untrusted websites cannot be used as an arbitrary redirect or session; the backend verifies PKCE codes, token hashes and referral attribution.
- A successful `npm run typecheck` or GitHub workflow is **not equivalent to device testing**. Expo build signing, approved credentials, QR appearance, biometric/storage review, Android/iOS accessibility and real camera/upload acceptance remain required before store release.

## Native KYC & application tracking (V3)

The individual-customer mobile KYC screen uses the **existing** `public.kyc_submissions`, `public.kyc_documents` and private `landshop-kyc` Storage bucket. Existing database row-level security requires the signed-in user to own the draft and the path; it forbids changing submitted applications. The app uploads to `<userId>/<submissionId>/<documentType>-<uuid>.<extension>`. It never creates public document links or includes a document filename/contents in analytics. The server reviews and approves; **uploads alone never mark KYC verified**.

The flow captures full name, phone and address; selects an ID and address evidence from the document picker; and captures a selfie through the device's front camera with camera permission requested at the point of use. Supported formats are JPEG, PNG, WebP and PDF, each at most 10 MB. It validates a file signature in addition to the declared MIME type, uses an ArrayBuffer upload (not a React Native Blob/FormData), and attempts to delete the uploaded object if its document record cannot be created. Native handling currently covers individual KYC; company, realtor and staff verification stays on its existing protected web flow.

Application tracking reads the signed-in customer's existing `applications` and `application_events` via owner-scoped RLS. It shows real status and recorded changes only; submitting or resuming drafts still opens the web application and may require a separate web sign-in. Neither this native UI nor the referral UI grants approval or money.

**Security and device acceptance gates before Android/iOS publication:**

- Validate Supabase Storage owner-only RLS with two disposable accounts: a user must not upload into another user's prefix, read another user's files, or upload to a submitted draft. Confirm the documents bucket remains private.
- Test selfie camera permission granted and denied, iOS/Android file selection, PDFs, HEIC rejection, oversize rejection, altered-extension rejection, network loss during upload, metadata-record failure cleanup, and repeated uploads.
- Test consent, first-time draft, resume draft, pending/submitted state, rejected state, and business/realtor web fallback. Verify staff and existing KYC records remain untouched.
- Test the application timeline with a user who has no applications, multiple applications, and draft/submitted records with/without activity events. Verify account isolation.
- Test on physical Android and iOS devices, tablets and small screens, accessibility font scaling, screen readers, foreground/background transitions, and unstable network connections. A successful TypeScript build does not establish these results.
- Obtain app-store privacy approvals and provide a deletion/retention policy for identity files before distribution. The private bucket limits access but is **not proof of regulatory compliance**.

## V4 — Build preparation and hardening

Android APK, iOS simulator, iOS internal QA, and future production build profiles are described in [V4_RELEASE_CHECKLIST.md](./V4_RELEASE_CHECKLIST.md). The native client validates the actual size and signature of the selected upload before reading it into memory, rejects PDF selfie submissions, and builds owner-specific private storage paths. The CI suite tests document types, size limits, signature mismatches, path traversal rejection, and authentication links. These are source checks, **not** device tests or server-side malware screening.

The application list continues to display owner-scoped statuses even if event-history retrieval fails; unknown product kinds never redirect to another product's draft. All store binaries, actual device builds and platform sign-in validation remain pending authorization and EAS project configuration.

## V5 — Owner-authorized internal native builds

The approved Landshop logo now feeds generated app-icon/adaptive-icon/splash source assets, and the repo includes an opt-in GitHub Actions **internal** EAS build workflow. Android APK, iOS Simulator and provisioned iOS internal builds require the owner's connected Expo project ID and private EXPO_TOKEN; app-store submission is not part of the workflow. See [V5_INTERNAL_BUILDS.md](./V5_INTERNAL_BUILDS.md) for the exact configuration and QA acceptance steps. Native OAuth remains disabled until device-level checks prove the redirect workflow.

## V6 — Client configuration and installable Android QA

All build profiles now use the same active **publishable** Supabase API key and the existing Landshop project URL. This is intentionally a client-side key and is protected by the database's RLS policies; service-role/secret keys must never appear in a native bundle. GitHub's internal EAS workflow checks that the expected Landshop public key and client URL are set before building.

For testers who cannot yet use Landshop's Expo account, a separate [Android QA APK build workflow](https://github.com/landshopnigeria/landshop/actions/workflows/build-landshop-android-qa-apk.yml) builds a standalone, debug-signed `.qa` application and provides a seven-day artifact on a **successful** workflow run. It is not a Play Store or production-signed build. See [V6_ANDROID_QA.md](./V6_ANDROID_QA.md) for artifact download, SHA-256 verification and safety requirements. iOS build and app-store signing still depend on Apple/EAS configuration and device acceptance tests.
