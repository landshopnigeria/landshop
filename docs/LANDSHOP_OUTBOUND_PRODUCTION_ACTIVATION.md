# Landshop production outbound messaging: activation record

Last audited: 2026-11-02. This is an internal operating checklist, not evidence that messages have been sent.

## Verified currently
- The production-safe dispatcher exists and has passed its no-send self-test.
- A five-minute GitHub Action schedule is registered, but scheduled runs are deliberately skipped while the global live flag is disabled.
- The private Supabase outbox and event-rule engine are installed and tested, with no customer test records retained.
- Database now has 70 additional **draft** communication templates plus two approved transactional acknowledgements.
- Signed Meta and authenticated Postmark receipt endpoints are present in the dashboard application.
- Landshop’s management dashboard is at /admin/communications/delivery. It is private.

## Production environment audit: actual findings
The protected `landshop-production` GitHub Actions environment did **not** provide a usable privileged Supabase key, Postmark transactional sender configuration, Meta WhatsApp access/phone configuration, or Termii SMS access/sender configuration at audit time. The global live flag and credential-rotation attestation were both false. The database channel flags and initial delivery rules were all off.

The read-only readiness log is produced by:
`Landshop Outbound Communications` GitHub Action > `Audit current production credentials and consent gates without sending`.

## Complete the security credential step, without pasting secrets into chats
1. In Supabase project `landshop-enterprise`, rotate any compromised legacy `service_role` key and provision a **new dedicated secret key** for the backend worker. Ensure other backends using the previous key are migrated before revoking it.
2. In GitHub repository `landshopnigeria/landshop` open **Settings > Environments > landshop-production**. Under *Environment secrets*, add:
   - `LANDSHOP_SUPABASE_SECRET_KEY` (preferred over the legacy `LANDSHOP_SUPABASE_SERVICE_ROLE_KEY`).
   - `LANDSHOP_POSTMARK_TRANSACTIONAL_TOKEN` (or reuse the existing server's approved `LANDSHOP_POSTMARK_BROADCAST_TOKEN` only if it is truly a server token and the stream is available).
   - `LANDSHOP_WHATSAPP_ACCESS_TOKEN`.
   - `LANDSHOP_TERMII_API_KEY`.
   These must remain **secrets**, not repository files or build-visible `NEXT_PUBLIC_` variables.
3. Add *Environment variables*: `LANDSHOP_SUPABASE_URL` (project endpoint), `LANDSHOP_POSTMARK_TRANSACTIONAL_FROM` (verified @landshopnigeria.com sender), `LANDSHOP_WHATSAPP_PHONE_NUMBER_ID` (Meta registered business number ID), `LANDSHOP_TERMII_SENDER_ID` (verified sender), and optional `LANDSHOP_COMM_BATCH_SIZE` (start at 1 or 5).
4. Configure the separate dashboard **server runtime** environment on Namecheap for `LANDSHOP_SUPABASE_SECRET_KEY` and webhook authentication:
   - `LANDSHOP_POSTMARK_WEBHOOK_USERNAME` and `LANDSHOP_POSTMARK_WEBHOOK_PASSWORD`.
   - `LANDSHOP_WHATSAPP_APP_SECRET`, `LANDSHOP_WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
   - `LANDSHOP_SUPABASE_URL`.
   Do not expose these to the browser.
5. Register the Postmark delivery/bounce/complaint webhook at `https://app.landshopnigeria.com/api/communications/webhooks/postmark` with the same Basic Auth credentials; verify the provider returns HTTP 200. Register the signed Meta status webhook at `https://app.landshopnigeria.com/api/communications/webhooks/whatsapp` with the app secret and verify token. Ensure each WhatsApp outbound rule references an **actually approved** Meta message template.
6. In private Command Center, review the provider channel permissions, exact event-to-template rules and legitimate consent records. Approve templates in the editor. Start with one internally controlled consented test identity. Marketing messages require a compliant unsubscribe workflow and should not be enabled merely because transactional messages are approved.
7. Only when the previous checks pass, set GitHub variables `LANDSHOP_COMM_ROTATION_CONFIRMED=true`, `LANDSHOP_COMM_LIVE_ENABLED=true`, and the exact channel flags `LANDSHOP_COMM_EMAIL_LIVE`, `LANDSHOP_COMM_WHATSAPP_LIVE`, `LANDSHOP_COMM_SMS_LIVE` to `true` for the verified channels. Do not turn on an unverified channel.
8. Run `Landshop Outbound Communications` manually with `mode=send` for the consented test. Verify `accepted` in the outbox, an authentic provider delivery receipt where supported, and the customer's real inbox/phone. Only then leave the five-minute schedule enabled.

## Important semantics
- `accepted` means the provider accepted a request, **not** that the customer received it. Receipt webhooks update later statuses.
- WhatsApp and SMS require explicit channel opt-in. No hidden contact harvesting from anonymous visitors.
- Postmark's `outbound` stream is transactional. Do not broadcast marketing messages through it.
- A delivery result marked `uncertain` is **not automatically retried** because the original provider request may have succeeded.
- A previously observed exposed service key must be rotated before any live action; toggling the frontend controls never replaces this security requirement.
