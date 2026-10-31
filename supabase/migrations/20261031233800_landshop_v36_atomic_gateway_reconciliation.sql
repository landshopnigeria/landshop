-- Service-only atomic Paystack reconciliation. The web handler MUST verify
-- the raw-body HMAC and independently query Paystack before calling this RPC.
create or replace function public.landshop_reconcile_gateway_payment(
 p_reference text,
 p_event_key text,
 p_event_type text,
 p_digest text,
 p_gateway_status text,
 p_amount_kobo bigint,
 p_currency text,
 p_provider_transaction_id text,
 p_verified_by text default 'server_verify'
) returns text language plpgsql security definer set search_path='' as $$
declare v_payment public.landshop_payment_intents%rowtype;
 v_status text; v_existing uuid;
begin
 if current_user <> 'service_role' and auth.role() <> 'service_role' then
   raise exception 'Service role required';
 end if;
 if p_reference !~ '^[A-Za-z0-9._=-]{8,100}$'
   or p_event_key !~ '^[A-Za-z0-9._=-]{8,180}$'
   or p_digest !~ '^[a-f0-9]{64}$'
   or p_event_type is null or length(p_event_type) not between 3 and 100
   or p_verified_by <> 'server_verify'
   or p_gateway_status not in ('success','pending','ongoing','processing','queued','failed','abandoned','reversed')
   or p_amount_kobo is null or p_amount_kobo < 0
   or p_currency <> 'NGN'
 then raise exception 'Invalid verified gateway event';end if;
 select * into v_payment from public.landshop_payment_intents where reference=p_reference for update;
 if not found then raise exception 'Unknown payment reference'; end if;
 if v_payment.amount_kobo<>p_amount_kobo or v_payment.currency<>p_currency then
   raise exception 'Gateway amount or currency mismatch';end if;
 if p_gateway_status='success' and (p_provider_transaction_id is null or length(p_provider_transaction_id)<1)
 then raise exception 'Missing verified transaction id';end if;
 select e.id into v_existing from public.landshop_payment_events e where e.event_key=p_event_key;
 if v_existing is not null then return 'duplicate';end if;
 if v_payment.status='success' and p_gateway_status<>'success' then
   raise exception 'An established successful payment cannot be downgraded by this event';
 end if;
 if v_payment.status='success' and p_gateway_status='success' and
    v_payment.provider_transaction_id is distinct from p_provider_transaction_id then
   raise exception 'Conflicting transaction id for completed payment';
 end if;
 v_status:=case p_gateway_status when 'success' then 'success'
   when 'failed' then 'failed' when 'abandoned' then 'abandoned'
   when 'reversed' then 'reversed' else 'pending' end;
 insert into public.landshop_payment_events(payment_intent_id,provider,event_key,event_type,
   reference,gateway_status,amount_kobo,currency,verified_by,payload_digest)
 values(v_payment.id,'paystack',p_event_key,p_event_type,p_reference,p_gateway_status,
    p_amount_kobo,p_currency,p_verified_by,p_digest);
 update public.landshop_payment_intents
 set status=v_status,provider_transaction_id=coalesce(p_provider_transaction_id,provider_transaction_id),
  verified_at=case when v_status='success' then coalesce(verified_at,now()) else verified_at end,
  updated_at=now()
 where id=v_payment.id;
 return v_status;
end $$;
revoke all on function public.landshop_reconcile_gateway_payment(text,text,text,text,text,bigint,text,text,text) from public,anon,authenticated;
grant execute on function public.landshop_reconcile_gateway_payment(text,text,text,text,text,bigint,text,text,text) to service_role;