# Landshop native V4 — controlled release and device acceptance plan

**Status:** source-readiness checks, not a signed or published application. No separate website staging environment is required; this plan uses internal device builds without changing the production domains.

## EAS configuration

Build profiles are defined in `mobile/customer-app/eas.json`:

| Profile | Purpose | Output |
| --- | --- | --- |
| `android-internal` | Android engineer and tester installation | Internal APK |
| `ios-simulator` | iOS simulator QA | Simulator build |
| `ios-internal` | Provisioned real iOS devices | Internal iOS build (requires Apple credentials and registered device IDs) |
| `production` | Future store build only after approval | Signed store-targeted binary; **never auto-submit** |

After the authorized owner connects their Expo/EAS account (and project ID), provisions signing, and configures only the publishable Supabase key on the selected EAS environment:

```bash
cd mobile/customer-app
npm install
npm run typecheck
npm run test
npx expo config --type public
npx eas-cli build --platform android --profile android-internal
npx eas-cli build --platform ios --profile ios-simulator
```

These are **instructions**, not claims that external builds ran. For physical iOS distribution, Apple Developer enrollment and device provisioning are needed. Do not publish using `eas submit` or an automatic submission flag.

## Security requirements before access to real IDs

- Keep native OAuth disabled until the trusted Supabase redirect allowlist and both operating systems' callback behavior are tested with disposable users.
- Use synthetic KYC IDs, never real staff/customer documents in initial QA. Test one approved author and a different authenticated account; cross-account document read/write/delete must be denied.
- Verify `landshop-kyc` remains a nonpublic bucket and review approvals are handled by existing staff-only workflows.
- Only the publishable Supabase key may appear in the native client. Store any EAS signing credentials in the owner's secured EAS account, not GitHub.
- Confirm Android and iOS camera, gallery, file picker, file-type signature checks and 10 MB limit. Verify denied permissions, offline mode, app backgrounding, and retry after failed metadata writes.
- Test draft creation, resume, consent rejection, missing documents, duplicate uploads, status review, and proper restrictions after submission.
- Verify application history with no records, drafts, multiple records, partial event service outage, and unknown product types. Do not invent events or redirect a different product to a Develop House form.
- Test short screens, large fonts, TalkBack/VoiceOver, keyboard/safe areas, low memory, poor connections, return from browser, and expired sessions.

## Release exit criteria

1. Expo config/CI tests green and two-device Android/iOS manual QA signed by responsible engineers.
2. Branding assets: official transparent Landshop logo, installed app icon, and splash correctly exported from approved source. **Do not generate a placeholder brand identity.**
3. Auth redirect verification on signed builds, native KYC upload test with nonproduction test accounts, full RLS isolation and human approval verification.
4. Legal review of identity document consent, retention, account deletion, incident reporting, and Nigerian privacy compliance.
5. Signed internal APK and iOS build distribution, stakeholder acceptance and final approval.
6. Store submission only when user authorizes it. Leave production website and its existing user data untouched.

## What cannot be claimed at V4 source stage

TypeScript unit tests cannot verify runtime device camera access, HTTPS routing, OAuth redirects, real private upload permissions with multiple users, native visual fidelity, Apple provisioning, or app-store approval. Keep those items marked **pending** until real evidence exists.
