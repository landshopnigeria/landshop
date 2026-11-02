-- Ensure management cannot create duplicate communication rules with an unscoped product.
-- PostgreSQL's ordinary UNIQUE constraint treats NULL product values as distinct;
-- duplicate rules could otherwise produce multiple outbound messages per event.
create unique index if not exists landshop_comm_unique_delivery_rule
 on public.landshop_comm_delivery_rules(event_type,coalesce(product,''),template_id,channel);
