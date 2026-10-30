# Landshop V6 — Standalone Android QA APK

**Purpose:** Produce an installable **internal tester-only APK** without waiting for Expo/EAS project linkage or Google Play credentials. This does not release the app to the public or replace the native EAS app-store process.

## What the build does

GitHub workflow: `.github/workflows/build-landshop-android-qa-apk.yml`. It runs on updates to the native app on `main`, and can also be started manually.

1. Installs the pinned Expo/React Native dependencies and Java/Android build toolchain.
2. Reads the **publishable** (client-facing) key and project URL from the reviewed Android EAS profile, never a Supabase service-role key.
3. Generates the official Landshop icon and splash assets from the logo in the repository.
4. Runs TypeScript and authentication/KYC security tests.
5. Uses `expo prebuild` to generate the native Android Gradle project.
6. Compiles **release-mode code with bundled JavaScript** while signing with a temporary **debug** keystore — and a unique `com.landshopnigeria.customer.qa` application ID.
7. Publishes the built APK and SHA-256 digest as a GitHub Actions artifact, retained for 7 days.

The QA APK does not require a connected Expo/EAS project. Native OAuth stays **disabled**. Customer authentication uses existing approved routes.

## Obtain the APK

1. Open [Landshop Android QA workflow](https://github.com/landshopnigeria/landshop/actions/workflows/build-landshop-android-qa-apk.yml).
2. Open the most recent successful run on the `main` branch.
3. Under *Artifacts*, download `landshop-android-internal-qa-apk` and extract the ZIP.
4. Compare the downloaded APK's SHA-256 against `app-release.apk.sha256`.
5. Install only on an authorised QA device. The Android app is named Landshop Nigeria and carries the `.qa` package suffix.

**Important:** A debug-signed APK is not appropriate for Google Play or widespread distribution, and it cannot be used as the signing identity for the future public app. Do not distribute the APK outside approved testers or attempt to submit it to Play Store. Reinstalling a build with a different temporary signing key may require uninstalling the previous QA package, so preserve test data in Supabase rather than local-only state.

## Test protocol

- First-run login, two-step registration, email confirmation and recovery. The web fallback must remain clear until native auth deep links are configured.
- Referral registration/code sharing, QR camera scanning and account isolation. Do not record real referral rewards from QA.
- Individual KYC camera capture, file picker, server file-size policy, failed uploads and consent. Use **synthetic** documents; do not upload customer identity data during smoke tests.
- Applications and actual activity timelines for new, draft, pending, and approved statuses; unknown kinds must not open incorrect forms.
- No internet, slow internet, denied camera permission, very small screen, TalkBack, background/foreground, and sign-out/relaunch.
- Check application uses project `iwkfagzkogzidrbbezds`, cannot read another customer's data and contains **no** service-role key.

## iOS and production stores

An iOS Simulator or iPhone app still needs macOS/Xcode, or the approved EAS build workflow with an Expo project and (for real devices) Apple signing. A Google Play release needs production signing credentials, a properly signed AAB, release review and permission to submit. Neither store is published by this QA workflow.

**Build status is only confirmed after the GitHub workflow succeeds and the APK artifact exists.** A configured workflow alone is not proof a binary has been generated.
