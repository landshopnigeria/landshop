#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${LANDSHOP_RELEASE_SHA:?Set LANDSHOP_RELEASE_SHA to the validated Git commit}"
mkdir -p release
for app in website portal dashboard; do
  source="apps/$app"
  root="$source/.next/standalone"
  entry="$root/apps/$app/server.js"
  test -s "$entry" || { echo "::error::Missing standalone entry: $entry"; exit 1; }
  test -d "$source/.next/static" || { echo "::error::Missing built static assets: $app"; exit 1; }
  test -s "$source/public/media/logo.webp" || { echo "::error::Missing approved media for $app"; exit 1; }
  target="release/$app"
  mkdir -p "$target/apps/$app/.next"
  cp -a "$root/." "$target/"
  cp -a "$source/.next/static" "$target/apps/$app/.next/static"
  cp -a "$source/public" "$target/apps/$app/public"
  # cPanel Passenger can serve /media directly from the app root's public folder.
  # Mirror only the small mobile gallery there so a static 404 cannot block release.
  # Next.js continues to use the original apps/portal/public directory as before.
  if [ "$app" = portal ]; then
    test -s "$source/public/media/mobile/famous-gardens-homepage-2026-11-mobile.jpg"
    mkdir -p "$target/public/media"
    cp -a "$source/public/media/mobile" "$target/public/media/mobile"
    test -s "$target/public/media/mobile/famous-gardens-homepage-2026-11-mobile.jpg"
  fi
  # The cPanel Passenger app must use server.js as the entry point.
  printf "require('./apps/%s/server.js');\n" "$app" > "$target/server.js"
  printf '%s\n' "$LANDSHOP_RELEASE_SHA" > "$target/LANDSHOP_RELEASE_SHA"
  mkdir -p release-archives
  tar -czf "release-archives/landshop-$app-$LANDSHOP_RELEASE_SHA.tar.gz" -C "$target" .
  echo "Created archive for $app"
done
sha256sum release-archives/*.tar.gz > release-archives/SHA256SUMS.txt
