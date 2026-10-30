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

- In the **existing** Landshop Supabase Auth URL Configuration, add the exact allowed redirect `landshop://auth/callback`.
- Confirm Supabase Google sign-in provider and the official Google Cloud authorized callback.
- Install a signed native development build and test `landshop://auth/callback?code=...` and `landshop://auth/callback?type=recovery&code=...` on real Android and iOS hardware using disposable test accounts. Never reuse a consumed code or paste access tokens in logs.
- Confirm a confirmation-email callback, a Google sign-in callback, and password recovery all return to the correct native screen.
- Then set `EXPO_PUBLIC_NATIVE_AUTH_REDIRECT_READY=true` for the appropriate signed build. Changing an Expo environment variable does not retroactively change an installed binary.

## Present limitations and release gate

- KYC documents and the full product application workflow currently open the protected Landshop **web** experiences; separate website authentication may be required. Native and web cookies are not assumed to be shared.
- Google login opens the existing website until the flag above is enabled. The in-app implementation is ready for controlled test, not yet production-proven.
- Deep links received from untrusted websites cannot be used as an arbitrary redirect or session; the backend verifies PKCE codes, token hashes and referral attribution.
- A successful `npm run typecheck` or GitHub workflow is **not equivalent to device testing**. Expo build signing, approved credentials, QR appearance, biometric/storage review, Android/iOS accessibility and full KYC/document capture remain required before store release.
