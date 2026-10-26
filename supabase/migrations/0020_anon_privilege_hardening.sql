-- Defense in depth: anonymous visitors have no SQL table privileges for client,
-- personnel, identity, application or audit records. Properties and estates
-- retain published-only SELECT via RLS and are intentionally public.
revoke all on table
 public.profiles,
 public.applications,
 public.attendance_events,
 public.audit_events,
 public.notification_outbox,
 public.organization_members,
 public.organizations,
 public.referral_codes,
 public.referral_edges,
 public.staff_tasks
from anon;
-- Remove anonymous inherited mutation rights from published catalogs too.
revoke insert,update,delete,truncate,references,trigger on public.properties,public.estates from anon;
grant select on public.properties,public.estates to anon;
