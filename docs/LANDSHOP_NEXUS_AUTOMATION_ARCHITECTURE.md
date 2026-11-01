# Landshop NEXUS Enterprise Automation Operating System
## Production phase 1: secure visual orchestration and audited rehearsals

**Private entry:** `https://app.landshopnigeria.com/admin/automation`. Authenticated verified management roles only. The page uses the existing Supabase organization membership and management middleware. NEXUS is not linked from the public website.

### Implemented and shippable in this release
- Owner-approved full-height visual canvas with drag/drop nodes, connection drawing, panning, zoom, a focus mode, mini-map, search, workflow templates, prompt-based rule planner and exportable blueprint JSON.
- Wider 6,400 x 4,000 canvas world, responsive three-pane studio, a searchable library including social, Google Workspace, AI, media generation, generic REST, CRM, MQTT, OPC UA, Modbus, gRPC, telemetry, edge gateway, circuit breaker and DLQ descriptors.
- Recognizable original platform-vector marks where distributable for integration identification (not generic Lucide substitutes). Branding does **not** imply official partnership or enabled API permissions.
- All credential-bearing input remains outside saved workflow graphs. The client rejects obvious tokens and secret fields and serializes only sanitized, bounded node options.
- Production draft persistence with version/optimistic-concurrency through existing `landshop_automation_create` and `landshop_automation_save` RPCs. Existing RLS and user/organization checks govern access. No secret-key or service-role exposure to the browser.
- Existing `landshop_automation_rehearse` and `landshop_automation_rehearsal_step` RPCs provide auditable, database-backed, no-side-effects step tests. The UI presents run history and human-selected branch advances.
- The visual application is sandboxed in an opaque-origin iframe. A narrow, source-validated `postMessage` bridge sends sanitized graphs to the authenticated parent. The preview's device-local storage is replaced by the workflow database.
- External API calls, posts, campaigns, group operations, emails, WhatsApp messages, hardware writes and payment effects remain **disabled by design** until credentials, permissions, human review, controls and operational workers are commissioned.

### Production execution plane: staged, not claimed live
The following architecture is the **next engineering stage**, rather than an already running capability:

```
Verified webhook / schedule / staff event / edge gateway
    -> authenticated ingestion + idempotency key + schema registry
    -> durable event outbox / message broker
    -> orchestration service (state transitions, deterministic DAG execution)
    -> horizontally scaled workers (AI, browser, creative, email, social, CRM)
    -> connector policy gate (OAuth scopes, consent, rate limiting, review)
    -> audited results, retry/DLQ, alerts, trace data and versioned rollback
```

#### Runtime requirements
- **Event-driven processing:** use verified source signatures, idempotent delivery IDs, an explicit event ledger, and a queue/outbox hand-off. No anonymous command endpoints or unauthenticated device actuation.
- **Deterministic state:** immutable workflow versions, run/node state, structured event logs, branches, timeouts and idempotent actions. Critical tasks require safe, bounded scheduling; do not promise hard realtime over public cloud.
- **Resilience:** bounded exponential retry and jitter, circuit breakers, dead-letter review, lease-and-fence worker ownership, cancel/compensation workflow, health checks and recovery playbooks.
- **Security:** mTLS edge-agent identities, signed device onboarding, per-org authorization, OAuth token vault external to the graph, RLS/least privilege, signature-verified webhooks, encryption at rest/in transit, comprehensive audit logs.
- **Edge:** an offline-capable mTLS gateway with store-and-forward, signed state transitions and operator-defined safe fallback. Modbus and OPC UA require site-specific gateways and device safety review. MQTT and gRPC require approved broker/service identities.
- **Observability:** OpenTelemetry traces, structured logs with no secret/PII leakage, Prometheus/Grafana metrics, time-series event pipeline and alerting for retry spikes, DLQ growth, low heartbeat, policy violations and aged approvals.
- **OTA:** signed artifacts, staging/canary, atomic promotion and automatic rollback after failed health checks. Hardware/plant OTA must be separately vetted.
- **Content generation:** branded HTML/CSS template renderer using Playwright/Sharp, MJML/React Email for email HTML, optional licensed model-based imagery/copy, object storage plus lifecycle policy and CDN.
- **Outbound publishing:** provider-specific adapter with authorized business accounts and appropriate API scopes. Facebook group permissions, comments and unsolicited outreach are *not* promised or bypassed; obey platform policy and consent.
- **Scale and SLOs:** baseline targets (not measured): 99.9% core-service availability, no dropped accepted events, exactly-once business effects through idempotency rather than exactly-once transport, per-provider concurrency budgets, monitored queue age and DLQ rates.

### Pre-activation checklist
1. Approve provider connector list and actual authorized social/business accounts.
2. Provision edge/broker/worker hosting, Redis or equivalent durable queue, vault, storage and monitoring.
3. Verify OAuth application reviews, relevant permissions, scopes, group rules, consent and unsubscribe workflows.
4. Add server-side authenticated webhook ingress, signed edge onboarding, queue/idempotency tables, retry policies and integration contract tests.
5. Complete independent security review, load/failure testing, disaster recovery, human approval and audit verification.
6. Test canary releases before enabling real external side effects.

### Non-negotiable Landshop design boundaries
Do not alter the public website header, homepage slider, property filter, newsletter, global footer, property detail layout, or article detail layout as part of NEXUS changes. The automation console belongs in the private Global Command Center.
