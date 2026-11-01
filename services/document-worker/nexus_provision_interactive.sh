#!/usr/bin/env bash
# Run INTERACTIVELY from the Namecheap cPanel Terminal as the deployment user.
# Never run with 'bash -x', in GitHub Actions, or through a chat / ticket.
set -euo pipefail
set +x
umask 077
dest="$HOME/.config/landshop/nexus-worker.env"
if [ ! -t 0 ] || [ ! -t 1 ]; then
  echo 'Interactive terminal required; cannot provision a worker credential from CI.' >&2
  exit 2
fi
if [ -e "$dest" ] || [ -L "$dest" ]; then
  echo 'Existing worker configuration detected; refusing to overwrite.' >&2
  exit 2
fi
printf '%s\n' 'Paste the existing Landshop Supabase service_role key (input hidden).'
IFS= read -r -s -p 'Service-role key: ' service_key
printf '\n'
if [ "${#service_key}" -lt 30 ] || [[ "$service_key" =~ [[:space:]] ]]; then
  unset service_key
  echo 'Invalid credential format; nothing written.' >&2
  exit 2
fi
mkdir -p "$HOME/.config/landshop"
chmod 700 "$HOME/.config/landshop"
temp=$(mktemp "$HOME/.config/landshop/.nexus-worker.XXXXXXXX")
trap 'rm -f "$temp"; unset service_key' EXIT
chmod 600 "$temp"
{
  printf 'LANDSHOP_NEXUS_RUNTIME_ENABLED=1\n'
  printf 'LANDSHOP_SUPABASE_URL=https://iwkfagzkogzidrbbezds.supabase.co\n'
  printf 'LANDSHOP_SUPABASE_SERVICE_ROLE_KEY=%q\n' "$service_key"
} > "$temp"
unset service_key
mv -n "$temp" "$dest"
test -f "$dest" && test ! -L "$dest" && test "$(stat -c %a "$dest")" = 600
echo 'Protected worker configuration installed. Use existing NEXUS Namecheap GitHub workflow to verify and activate.'
