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
  # Copy the *contents* of public, not the directory itself. The standalone
  # trace can already contain apps/$app/public; copying the directory into an
  # existing destination would silently produce public/public and 404s.
  mkdir -p "$target/apps/$app/public"
  cp -a "$source/public/." "$target/apps/$app/public/"
  if [ -d "$target/apps/$app/public/public" ]; then
    echo "::error::Nested public/public directory in $app release"
    exit 1
  fi
  if [ "$app" = portal ]; then
    # Public /media is the proven Passenger/LiteSpeed asset namespace.
    # Verify original Landshop mobile photographs are inside the *actual*
    # archive, not merely present in GitHub, before any Namecheap upload.
    for photo in \
      landshop-mobile-famous-gardens.jpg \
      landshop-mobile-site-client-inspection.webp \
      landshop-mobile-famous-completed-homes.webp \
      landshop-mobile-product-grow.webp \
      landshop-mobile-green-island-site-progress.webp \
      landshop-mobile-blue-diamonds-concept.webp; do
      test -s "$target/apps/portal/public/media/$photo" || {
        echo "::error::Missing production mobile media in portal bundle: $photo"
        exit 1
      }
    done
    echo "PASS: all 6 copied mobile photographs included in portal archive"
  fi
  # The cPanel Passenger app must use server.js as the entry point.
  printf "require('./apps/%s/server.js');\n" "$app" > "$target/server.js"
  printf '%s\n' "$LANDSHOP_RELEASE_SHA" > "$target/LANDSHOP_RELEASE_SHA"
  mkdir -p release-archives
  tar -czf "release-archives/landshop-$app-$LANDSHOP_RELEASE_SHA.tar.gz" -C "$target" .
  echo "Created archive for $app"
done
sha256sum release-archives/*.tar.gz > release-archives/SHA256SUMS.txt
