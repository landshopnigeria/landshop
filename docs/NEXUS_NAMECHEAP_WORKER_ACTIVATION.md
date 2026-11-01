# NEXUS: existing Namecheap production worker credential

The automated Namecheap activation workflow has verified SSH, upload, and local Python tests. It deliberately stopped when the worker-specific protected configuration was absent. This is separate from the successfully deployed public applications.

## One-time credential activation (cPanel Terminal only)

1. Open the **existing Namecheap cPanel Terminal** as the account that owns the Landshop production applications. Do not paste credentials into ChatGPT, GitHub issues, or CI logs.
2. Obtain the existing **service_role** credential from an authorized administrator or the production Supabase credentials manager, not the public publishable/anon key.
3. Transfer the reviewed `nexus_provision_interactive.sh` file privately from the source repository to the host and execute it **interactively** with `bash nexus_provision_interactive.sh`. It will prompt with hidden input and create `~/.config/landshop/nexus-worker.env` with owner-only permissions.
4. Run the existing `Activate guarded NEXUS safe-preview worker on Namecheap` workflow from the repository's Actions tab. It performs protected configuration checks, a one-shot queue claim, and schedules a single bounded, locked cron worker only when successful.
5. Verify `landshop/nexus-worker` GitHub commit status is **success**, then enqueue a non-external test workflow in private NEXUS Studio and confirm status progression and audit events. CI success alone does not prove queue execution.

Do **not** replace an existing working config automatically, weaken permissions, embed service credentials in the frontend, or activate outbound social/email/device actions. Revocation and rotation should follow Supabase service-role credential handling. If an existing worker process is found, activation intentionally avoids starting a duplicate.
