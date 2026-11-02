#!/usr/bin/env python3
"""Prevent bypass of Landshop's free k-anonymity password checks in UI flows.

This static check is complemented by the Next.js TypeScript build.
It does not claim that Supabase's provider-side Pro-only setting is enabled.
"""
from pathlib import Path

root=Path(__file__).resolve().parents[1]
lib=(root/"packages/shared/landshop-password-screen.ts").read_text(encoding="utf-8")
must_contain=(
 "crypto.subtle.digest(",
 "'SHA-1'",
 "hash.slice(0, 5)",
 "hash.slice(5)",
 "https://api.pwnedpasswords.com/range/",
 "Number(count) > 0",
 "credentials: 'omit'",
 "referrerPolicy: 'no-referrer'",
 "cache: 'no-store'",
 "controller.abort()",
 "CHECK_UNAVAILABLE_MESSAGE",
)
for token in must_contain:
 assert token in lib, f"Password screening lost safeguard: {token}"

paths={
 "apps/portal/app/page.tsx": "await assertLandshopPasswordSafe(password);",
 "apps/dashboard/app/staff/sign-up/page.tsx": "await assertLandshopPasswordSafe(v.password);",
 "apps/portal/app/update-password/page.tsx": "await assertLandshopPasswordSafe(password);",
}
for path,token in paths.items():
 src=(root/path).read_text(encoding="utf-8")
 assert token in src, f"Free compromised-password check missing from {path}"
 assert "import {assertLandshopPasswordSafe}" in src, f"Password screening import missing from {path}"

print("PASS: Customer/staff signup and password changes screen proposed passwords")
print("PASS: Only the SHA-1 prefix is transmitted; the full password remains private")
print("NOTE: Direct Supabase Auth API calls are not covered by this browser-side check")
