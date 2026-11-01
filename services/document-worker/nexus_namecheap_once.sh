#!/usr/bin/env bash
# Namecheap one-shot NEXUS preview worker, called under cron with flock.
set -euo pipefail
umask 077
config="${LANDSHOP_NEXUS_CONFIG_PATH:-$HOME/.config/landshop/nexus-worker.env}"
# Allow an existing protected server-side environment file to be selected by path.
# Never copy or print credentials. Refuse relative paths and symbolic links.
case "$config" in "$HOME"/*) ;; *) echo "NEXUS_CONFIG_PATH_UNSAFE"; exit 3;; esac
test -f "$config" && test ! -L "$config" || { echo "NEXUS_CONFIG_UNAVAILABLE"; exit 3; }
test "$(stat -c %u "$config")" = "$(id -u)" || { echo "NEXUS_CONFIG_OWNER_INVALID"; exit 3; }
permissions=$(stat -c %a "$config")
case "$permissions" in 600|400) ;; *) echo "NEXUS_CONFIG_PERMISSIONS_INVALID";exit 3;; esac
set -a
# File is owned/controlled by the deployment account and must never be web served.
source "$config"
set +a
test "${LANDSHOP_NEXUS_RUNTIME_ENABLED:-}" = 1 || { echo "NEXUS_DISABLED";exit 3; }
test "${LANDSHOP_SUPABASE_URL:-}" = "https://iwkfagzkogzidrbbezds.supabase.co" || { echo "NEXUS_PROJECT_MISMATCH";exit 3; }
test -n "${LANDSHOP_SUPABASE_SERVICE_ROLE_KEY:-}" || { echo "NEXUS_SERVICE_CREDENTIAL_MISSING";exit 3; }
exec /usr/bin/env python3 "$HOME/landshop-nexus-runtime/nexus_runtime_worker.py" --once
