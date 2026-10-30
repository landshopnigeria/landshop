# Landshop Customer Mobile — Native Foundation

React Native / Expo SDK 58 customer application source. Separate from the live Next.js website and portal so it cannot modify existing production website routes, subscriptions, employees, or customer records.

## Supported in this initial native source
- Existing Supabase Auth sign-in/sign-out, two-step sign-up, email verification information and password recovery.
- LANDSHOPnn referral invitation capture, the signed-in member's own code, QR, copy, and native Share.
- Customer overview with actual application count, KYC status, and approved referral wallet values.
- Secure link to the existing Landshop web KYC, properties and applications. These linked flows are not yet implemented as native screens.
- Green/black gradient CTA, approved building/staff imagery and centred card layouts.

## Run
1. `cd mobile/customer-app`.
2. Copy `.env.example` to `.env` and supply the **existing Supabase publishable key only** (never a service-role key).
3. `npm install` and `npx expo install --fix` to resolve the Expo 58 compatibility matrix and generate a lockfile before release.
4. `npm run typecheck` then `npm run start`.
5. Link this Expo project to an authorized EAS account. Configure iOS/Android signing and verified deep links before producing app-store binaries.

## Before public native release
- Configure the `landshop://` and verified HTTPS redirect allowlists in the existing Supabase project. Avoid opening unaudited OAuth URLs until PKCE callback handling and mobile session return are validated.
- Add first-party native KYC document capture / storage and account recovery.
- Complete Android and iOS simulator testing (small screens, tablets, offline/unstable connections, font scaling, keyboard).
- Add app icons/splash from licensed Landshop source artwork and EAS build profiles, plus privacy/consent review.
- The "Continue with Google" control opens the existing secure web portal; it does **not** silently transfer web cookies to the mobile app.

This is native source groundwork, not an uploaded, store-approved application.
