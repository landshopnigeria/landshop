# NEXUS durable runtime, phase 2A

This phase adds a **durable, idempotent, lease-based INTERNAL PREVIEW runtime**. It does not turn on third-party messages, AI generation, paid ads, WhatsApp, Facebook groups or industrial actuation.

## Workflow

1. An authenticated, authorized Landshop management member opens NEXUS Studio and selects a saved workflow.
2. **Queue safe preview** calls \`landshop_nexus_queue_preview\` with the exact graph version and an idempotency key.
3. PostgreSQL atomically stores the event, immutable graph snapshot, automation run and queued job.
4. A *separately provisioned* worker calls \`landshop_nexus_worker_claim\`. Row locks and lease expiration prevent concurrent workers from claiming the same job within its 60-second lease.
5. The worker calls \`landshop_nexus_worker_advance\`. SQL plans one deterministic internal step and appends an audit event.
6. Every external, approval, branching, cycle or unknown action **halts in waiting**. These are not skipped as if they had successfully run. No external actions can occur in this phase.
7. Worker faults retry with bounded exponential delay. After the limit, the job enters dead letter and the run fails. Stale leases are reclaimed or dead-lettered when claims resume.
8. Authorized management members can inspect queue statuses and events in the NEXUS monitoring drawer.

## Deployment

The existing Namecheap deployment publishes the UI and stores migration files. **It does not provision or launch the isolated Python worker.** Before enabling processing, provision a restricted worker service with outbound access to the correct Supabase project and configure:

- \`LANDSHOP_NEXUS_RUNTIME_ENABLED=1\` only after review.
- \`LANDSHOP_SUPABASE_URL\` set to the exact production project endpoint.
- \`LANDSHOP_SUPABASE_SERVICE_ROLE_KEY\` in an encrypted server-side secret manager, never in JS or the client.
- \`LANDSHOP_NEXUS_WORKER_ID\` unique per worker (e.g. \`nexus-worker-01\`).
- \`LANDSHOP_NEXUS_POLL_SECONDS\` defaults to 2 seconds; .25 to 30 supported.

Install and test: \`python -m unittest test_nexus_runtime_worker -v\`

Once provisioned, run \`python nexus_runtime_worker.py --loop\` under a supervised process with structured logs and alerting. \`--once\` is available for on-demand diagnostics. Provision safe egress, a read-only process filesystem, auto-restart and health monitoring.

## SLO / limitations

The durable backend is prepared for multiple workers; no throughput, latency or uptime SLO is asserted without a deployed worker and load tests. Edge devices, Modbus/OPC UA protocol gateways, OAuth/social connectors, a real AI model and media workers remain unconnected. Retries are at-least-once delivery; external exactly-once business effects will require provider-specific idempotency in later phases. No activation without management approval, verified permissions, platform policies and credential vaulting.

## Security

RLS protects queue metadata from anonymous and non-management access. Only \`service_role\` may claim and acknowledge jobs. Browser users may queue bounded, quota-limited, permission-checked previews of their saved Landshop workflows. Replay keys are scoped by actor and workflow. Never store access tokens, medical details or other private payloads in the event envelope. Output logs contain status codes but no credentials.
