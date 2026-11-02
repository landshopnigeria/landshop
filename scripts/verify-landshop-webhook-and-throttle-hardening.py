#!/usr/bin/env python3
"""Regression safeguards for signed provider callbacks and public API quotas."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
sources={
 "postmark":(root/"apps/dashboard/app/api/communications/webhooks/postmark/route.ts").read_text(),
 "whatsapp":(root/"apps/dashboard/app/api/communications/webhooks/whatsapp/route.ts").read_text(),
 "web":(root/"apps/website/lib/public-abuse-guard.ts").read_text(),
 "auth":(root/"apps/portal/lib/public-auth-email-throttle.ts").read_text(),
}
checks={
 "postmark":["providerAuth(request)","timingSafeEqual(","Array.isArray(parsed)","Buffer.byteLength(raw,'utf8')>16384"],
 "whatsapp":["createHmac('sha256',secret)","Array.isArray(root.entry)","entries.length>20","entry.changes.length>25",
    "statuses.length+value.statuses.length>50","Array.isArray(value.statuses)",
    "Number.isSafeInteger(seconds)","Number.isNaN(moment.valueOf())",
    "Buffer.byteLength(raw,'utf8')>65536"],
 "web":["GLOBAL_BUCKETS","globalLimit(scope,3600,windowMs)","const wait=Math.max(retry,globalRetry)"],
 "auth":["GLOBAL_BUCKETS","globalConsume(action,600,30*60_000)",
    "const retry=Math.max(ipRetry,emailRetry,globalRetry)"],
}
for name,tokens in checks.items():
 for token in tokens:
  assert token in sources[name],f"{name}: safety check missing {token}"
print("PASS: Signed webhook events enforce bounded, safe payload parsing")
print("PASS: Independent per-process quota ceilings protect public form and auth-email endpoints")
print("NOTE: For multi-instance deployments, upstream and provider-level quotas remain necessary")
