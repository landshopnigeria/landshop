-- Applied to Landshop production Supabase as version 20261030043711.
-- Subscribers can opt out using an unguessable token; no subscriber table reads exposed.
alter table public.landshop_newsletter_subscribers
 add column if not exists unsubscribe_token uuid not null default gen_random_uuid(),
 add column if not exists unsubscribed_at timestamptz;
create unique index if not exists landshop_newsletter_unsubscribe_token_idx
 on public.landshop_newsletter_subscribers(unsubscribe_token);
create or replace function public.landshop_newsletter_subscribe(p_email text,p_source text default 'global-footer')
returns boolean language plpgsql security definer set search_path='' as $$
declare clean_email text := lower(btrim(coalesce(p_email,'')));
begin
 if char_length(clean_email)<5 or char_length(clean_email)>254
 or clean_email !~ '^[a-z0-9.!#$%&''*+/=?^`{|}~-]+@[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$'
 then raise exception 'Invalid email address' using errcode='22023';end if;
 if p_source is null or p_source not in ('global-footer') then raise exception 'Invalid subscription source';end if;
 insert into public.landshop_newsletter_subscribers(email,status,source,consent_at,updated_at,unsubscribed_at)
 values(clean_email,'subscribed',p_source,now(),now(),null)
 on conflict(email) do update set status='subscribed',source=excluded.source,
 consent_at=now(),updated_at=now(),unsubscribed_at=null,
 unsubscribe_token=gen_random_uuid();
 return true;
end $$;
revoke all on function public.landshop_newsletter_subscribe(text,text) from public,anon,authenticated;
grant execute on function public.landshop_newsletter_subscribe(text,text) to anon,authenticated;
create or replace function public.landshop_newsletter_unsubscribe(p_token uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.landshop_newsletter_subscribers
 set status='unsubscribed',unsubscribed_at=now(),updated_at=now()
 where unsubscribe_token=p_token and status='subscribed';
 return true;
end $$;
revoke all on function public.landshop_newsletter_unsubscribe(uuid) from public,anon,authenticated;
grant execute on function public.landshop_newsletter_unsubscribe(uuid) to anon,authenticated;
