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
