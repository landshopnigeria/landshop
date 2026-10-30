# LANDSHOP V26 — Daily Newsletter Delivery Handoff

## Implemented
- Staff-only `/admin/newsletter` to select one **existing published Insights article** for a specific day in Africa/Lagos, approve it or cancel it.
- Supabase migration `20261030045419` (already applied) adds `landshop_newsletter_campaigns` and `landshop_newsletter_deliveries`. Both are RLS-protected, inaccessible to anonymous readers. Staff-approved RPCs check active Landshop organization membership and relevant roles.
- A GitHub Actions workflow `landshop-daily-newsletter.yml` checks once daily at **08:00 WAT (07:00 UTC)**; manual preview and send modes are supported.
- `scripts/landshop-daily-newsletter.mjs` selects only the approved campaign for today's Lagos date. The article must be in the current Landshop source AND return HTTP success on its public /insights/[slug] page.
- Dispatcher re-checks subscription status immediately before claims, uses a unique campaign/subscriber delivery key to prevent duplicate sends, sends to Postmark **Broadcast stream** only, checks each message response, and records provider ID or rejection without exposing email addresses/tokens in logs.
- Every message includes the existing Landshop opt-out link and Postmark's official `{{{ pm:unsubscribe }}}` provider-managed link.
- A failed or timed-out HTTP response may still have been delivered. Such rows remain **claimed**, require staff investigation, and cannot be blindly retried.
- No user-facing footer, header, product hero, property filter, listing, login or customer portal UI changed.

## Live sending intentionally OFF (required activation checklist)
**Do not turn on live sending** until the following are verified:
1. Set GitHub Actions production environment variable `LANDSHOP_NEWSLETTER_LIVE_ENABLED=true` **only after authorization**. Default is false and all scheduled checks exit before reading subscriber data.
2. Configure GitHub production environment secret `LANDSHOP_SUPABASE_SERVICE_ROLE_KEY` with the actual *Landshop* Supabase key. Never put this in Next.js client, repository files, logs, or user-facing code.
3. Configure `LANDSHOP_POSTMARK_BROADCAST_TOKEN` (Postmark server token with Broadcast stream access), **not** the transactional Postmark token used for authentication/password resets.
4. Configure `LANDSHOP_NEWSLETTER_FROM` to a **confirmed sender** at landshopnigeria.com, e.g. only an address the organization owns and has verified. Configure `LANDSHOP_POSTMARK_BROADCAST_STREAM` to the stream ID, default `broadcast`.
5. SPF, DKIM and DMARC must pass for the sender domain; ensure Postmark broadcast sending approval and provider-managed suppression/unsubscribe are enabled.
6. Confirm subscription collection, recipient consent, contact address, provider suppression handling, and staff campaign review with the organization and applicable Nigerian data protection requirements.
7. Test on an authorized internal seed subscription: approve a real published Insights article, use manual `mode=preview`, then enable and run with a very small `LANDSHOP_NEWSLETTER_MAX_RECIPIENTS` while monitoring inbox rendering and Postmark suppressions. Never use real customer records for QA without authorization.
8. Increase daily capacity gradually (valid range 1–5000). Large audiences may require multiple *same-day* approved reruns, each idempotent; do not reset claimed delivery records.
9. To stop mail at once: set `LANDSHOP_NEWSLETTER_LIVE_ENABLED=false` and cancel the campaign in Admin. Cancelled future campaigns cannot be silently re-approved for the same date because that requires manual review.
10. Ensure the Postmark Subscription Change webhook or periodic suppression audit is configured for production analytics; provider suppressions block future sends even if local consent status has not yet been synchronized.

## What is NOT active
No confirmed Broadcast server token or verified sender has been detected from available Landshop repo references. This PR does **not** create Postmark accounts, verify domain ownership, issue credentials, or send a single broadcast. Scheduled runs are **dry-safe until explicit production enablement**.

## Audit and recovery
- Sender responses are checked individually, even when Postmark returns HTTP 200 for a batch.
- Duplicate emails are guarded by a unique `(campaign_id, subscriber_id)` ledger key.
- No automatic retry on ambiguous transport failures.
- Failed messages and suppressions are logged by **aggregate counts only**.
- Running GitHub Actions on a stale or non-main branch cannot send messages.
- A public article 404, missing sender settings, no approved campaign or missing consent all prevent sending.
- The V24 footer and V25 unsubscribe system remain intact.

## References
- Postmark Broadcast stream: https://postmarkapp.com/message-streams
- Postmark /email/batch up to 500 messages: https://postmarkapp.com/developer/user-guide/send-email-with-api/batch-emails
- Postmark managed unsubscribe: https://postmarkapp.com/support/article/1299-how-to-include-a-list-unsubscribe-header
