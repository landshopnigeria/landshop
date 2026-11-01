#!/usr/bin/env python3
"""Read-only verification that staff IDV cannot be forged or used anonymously.

No user identity is submitted and no biometric media is transmitted.
"""
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import json
import sys

base="https://iwkfagzkogzidrbbezds.supabase.co/functions/v1/staff-identity"
cases=[
 ("unsigned-user-status",base,{"action":"status"},{401}),
 ("unsigned-provider-event",base+"?event=decision",{"verification":{"id":"00000000-0000-4000-8000-000000000000"}},{401,503}),
]
errors=[]
for name,url,payload,allowed in cases:
 data=json.dumps(payload).encode()
 request=Request(url,data=data,method="POST",headers={
  "Content-Type":"application/json",
  "User-Agent":"Landshop-IDV-Security-ReadOnly/1.0",
  "Cache-Control":"no-store",
 })
 try:
  try:
   with urlopen(request,timeout=20) as response: status=response.status; headers=response.headers
  except HTTPError as response:
   status=response.code;headers=response.headers
  if status not in allowed:raise AssertionError("unexpected status "+str(status))
  if "no-store" not in headers.get("Cache-Control",""):raise AssertionError("sensitive response cacheable")
  print("PASS "+name+": HTTP "+str(status))
 except (URLError,AssertionError,TimeoutError) as error:
  errors.append(name+": "+str(error))
if errors:
 for e in errors: print("FAIL "+e,file=sys.stderr)
 sys.exit(1)
print("PASS: Staff biometric endpoint refuses unsigned verification and unauthenticated access")
