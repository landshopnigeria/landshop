#!/usr/bin/env python3
"""Check secure password-recovery and confirmation-resend UX across public portal.

These checks prevent accidental client-side bypass and API regression.
The CI standalone HTTP smoke separately checks actual route responses without
sending a recovery or verification email to any real address.
"""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
api=(root/"apps/portal/app/api/auth/email-action/route.ts").read_text(encoding="utf-8")
throttle=(root/"apps/portal/lib/public-auth-email-throttle.ts").read_text(encoding="utf-8")
reset=(root/"apps/portal/app/reset-password/page.tsx").read_text(encoding="utf-8")
signin=(root/"apps/portal/app/page.tsx").read_text(encoding="utf-8")
checks={
 "API origin restrictions":("ALLOWED_ORIGINS","'sec-fetch-site'","fetchSite==='cross-site'","!origin"),
 "API size and input restrictions":("size>512","raw.length>512","body.action!=='recovery'","body.action!=='resend'"),
 "API confidentiality":("'Cache-Control':'private, no-store","ANSWERS[action]","error.status===429"),
 "Provider delegation":("supabase.auth.resetPasswordForEmail(","supabase.auth.resend(","authEmailThrottle("),
}
for name,tokens in checks.items():
 for token in tokens:
  assert token in api,f"{name}: missing {token}"
for token in ("createHash('sha256')","'Retry-After'","MAX_BUCKETS","30*60_000",":email:"):
 assert token in throttle,f"Abuse guard missing: {token}"
for text,path in (("{action:'recovery'","password reset"),("{action:'resend'","email resend")):
 src=reset if path=="password reset" else signin
 assert text in src and "fetch('/api/auth/email-action'" in src,path+" must use the server API"
 assert ".auth.resetPasswordForEmail(" not in src and ".auth.resend(" not in src,path+" must not bypass the server API"
print("PASS: Auth email requests are bound by origin, payload size, and hashed throttle buckets")
print("PASS: Customer recovery and confirmation resend use Landshop server routes")
print("NOTE: Supabase's independent provider-side Auth rate limits remain necessary")
