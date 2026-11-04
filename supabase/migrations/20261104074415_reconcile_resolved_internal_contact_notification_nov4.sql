-- Production migration 20261104074415_reconcile_resolved_internal_contact_notification_nov4
-- Applied and independently verified on 2026-11-04.
-- Reconcile only never-attempted, recipient-less internal contact events after
-- their underlying contact enquiry was resolved and assigned to Landshop staff.
-- Cancellation is NOT an assertion that email, SMS or WhatsApp was delivered.
-- Preserve both the original outbox row and a system audit trail.
WITH cancelled AS (
 UPDATE public.notification_outbox AS n
 SET status='cancelled'
 FROM public.contact_enquiries AS c
 WHERE n.status='pending'
   AND n.event_type='landshop.contact.received'
   AND n.user_id IS NULL
   AND n.attempts=0
   AND n.payload->>'channel' IS NULL
   AND n.payload->>'enquiry_id'=c.id::text
   AND c.status='resolved'
   AND c.assigned_to IS NOT NULL
   AND n.next_attempt_at < now() - interval '72 hours'
 RETURNING n.id, n.event_type, n.payload->>'enquiry_id' AS enquiry_id
)
INSERT INTO public.audit_events(actor_id,event_type,metadata)
SELECT NULL,
  'notification.internal_contact_cancelled',
  jsonb_build_object(
   'outbox_id',id,
   'enquiry_id',enquiry_id,
   'origin_event',event_type,
   'reason','Contact enquiry already resolved and assigned; unattempted internal event superseded',
   'external_delivery_occurred',false
  )
FROM cancelled;
