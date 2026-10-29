# Workflow implementation gates

The files in packages/workflows are declarative definitions, not running Temporal workflows.

Before activation:
- Deploy a durable Temporal service and workers outside resource-constrained cPanel runtimes.
- Add durable event-outbox dispatch with transactionally committed event IDs.
- Validate all message templates and contact consent.
- Configure real Postmark and approved WhatsApp/SMS provider credentials.
- Enforce stop-on-opt-out/lead-conversion, lawful quiet hours and rate limits.
- Protect all human approval activities from unauthorized roles.
- Persist run history, retry and dead-letter state and management audit logs.
- Verify provider delivery webhooks with signature validation.
- Implement separate mortgage and investment compliance approval paths.
- Test failure/recovery and duplicate event submission before production activation.

## Landshop V16.1 — audited rehearsals (implemented)

- Authorized Landshop workflow authors can launch a **rehearsal** of a saved diagram.
- The server locks the workflow version at rehearsal start and records an immutable graph snapshot in `automation_runs.context`.
- Advance is transactional; only the starting operator can step a running rehearsal, up to 100 steps. Run and step history is persisted in `automation_run_events`.
- Branches are selected explicitly. Disconnected steps and cycles are rejected by the rehearsal guard.
- Notification, webhook, approval and wait nodes are **simulated and logged**, not executed. No emails, SMS, WhatsApp, payments, HTTP requests or real approvals occur.
- All read access remains governed by RLS, with no direct client mutation grants for run tables; anonymous callers cannot invoke the RPC operations.
- The UI shows current step, supported branches, recent run events and the fact that external actions executed = 0.

## Still required before real activation

1. Separate, approved workflow publish flow with independent human reviewer and per-channel scopes.
2. Production worker with a durable queue, retries, idempotency, dead-letter handling, clocks and checkpoints.
3. Signed inbound provider webhooks, verified outbound providers, consent handling, unsubscribe controls and rate limits.
4. Validated condition evaluators and approval role resolution that cannot be bypassed by user-edited labels.
5. Real end-to-end test with authenticated staff, provider sandbox credentials and recovery/failure drill.

A successful rehearsal is **not** permission to activate a workflow or deliver communications.
