# Landshop V25 — Newsletter operations handoff

## Implemented

- Newsletter preferences route: `/newsletter/unsubscribe?token=<opaque UUID>`.
- POST-only `/api/newsletter/unsubscribe` endpoint backed by a security-definer Supabase RPC.
- Each subscriber has a unique, unguessable unsubscribe token. Explicit re-subscription rotates the old token.
- Newsletter subscriber email addresses are not readable by the anonymous or ordinary authenticated roles.
- Subscriber existence is not revealed by public unsubscribe requests.
- No signup/login or property purchase account is affected by unsubscribing.
- Data migration `20261030043711_landshop_v25_newsletter_unsubscribe_preferences.sql` applied in Supabase, versioned in GitHub.

## What has NOT been activated

This change does not send bulk email and does not register any cron trigger. Landshop's newsletter component currently stores explicit subscriptions only. Daily delivery requires choosing, verifying and configuring an actual email service and a real sender identity for Landshop.

## Delivery implementation readiness

1. Configure a verified Landshop sender domain and publication-specific email delivery provider. Broadcast traffic must be separate from password resets and other transactional traffic.
2. Adopt the provider's broadcast unsubscribe/suppression capabilities (for example, a Broadcast Stream in Postmark), or properly configure custom one-click unsubscribe with List-Unsubscribe headers. Keep provider suppressions synchronized with the Landshop subscription preferences.
3. Add a reviewed daily editorial campaign composed of **published** Landshop Insights articles only. Do not invent or promote unpublished properties, historical ROI, or unverified mortgage rates.
4. Add a server-side scheduled dispatcher with bounded batch size, idempotency key per day+recipient, retries, explicit approval switch, visibility into sends/failures and an emergency disable.
5. Send only to affirmative consent subscribers and exclude opt-outs, hard bounces, complaints and suppressions.
6. Test delivery to a small controlled internal seed list with no real customer data; confirm received links and one-click opt-out. Only then activate a daily schedule.
7. Treat subscriber information as private; never print email addresses or unsubscribe tokens to GitHub logs or public analytics.

## Security acceptance

- Existing approved V24 footer, carousel and V23 slider/property filter remain unmodified.
- Public `/newsletter/unsubscribe` requires deliberate POST to change preferences; visiting a link (GET) will not unsubscribe accidentally through email link previews.
- New subscribers and existing explicit re-subscribers receive fresh token values internally; tokens are not shown to users until included in authorized mailing links.
- Daily delivery must remain **off** until sender identity, compliance and service integrations are ready.
