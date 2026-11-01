# NEXUS safe preview worker

This worker processes the existing **database-backed safe-preview** queue only. It does not post to social media, call external connectors, send email, move money, or control devices.

## Production requirements
- Dedicated protected Node.js 22+ process with restart-on-failure and log retention.
- Server-only environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_`).
- Optional: `NEXUS_BATCH_SIZE=2` (1–4 recommended), `NEXUS_POLL_MS=3000`.
- Run: `node services/nexus-worker/worker.mjs`.
- Enable a single worker first; verify sample job progression and server audit events before scaling.
- Rotate credentials and isolate service-role access; do not expose the key to the browser, CI logs, or public routes.

## Acceptance tests
1. Queue one valid safe preview using the authenticated NEXUS interface.
2. Start a worker. Confirm `queued → leased → queued/completed/waiting` as allowed by the DAG.
3. Confirm external/approval nodes enter `waiting` with no external side effect.
4. Kill a worker with an active lease. Confirm later worker can recover expired leases without duplicate business effects.
5. Verify retries are bounded; terminal failures enter `dead`, with corresponding audit events.
6. Check database grants: the privileged claim/advance RPCs must not be executable by `anon` or `authenticated`.
7. Confirm production process supervision, credentials, alerts and security review before activation.

The database itself owns atomic leases, execution transitions, retries, and dead-letter handling. Worker errors deliberately do not log credentials or user payloads. This branch does not deploy, configure secrets, or enable external actions.
