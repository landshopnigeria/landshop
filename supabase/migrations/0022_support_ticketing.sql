-- Customer Support / Tickets: private persistent case intake and governed staff transitions.
-- Pending pre-production RLS tests, backup and migration review.
create table if not exists public.support_tickets(
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references auth.users(id),
 subject text not null check(char_length(btrim(subject)) between 5 and 180),
 category text not null check(category in ('property','application','mortgage','investment','document','payment','other')),
 description text not null check(char_length(btrim(description)) between 20 and 5000),
 status text not null default 'open' check(status in ('open','in_progress','awaiting_customer','resolved','closed')),
 priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
 assigned_to uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists support_tickets_requester_time on public.support_tickets(requester_id,created_at desc);
create index if not exists support_tickets_queue on public.support_tickets(status,priority,created_at);
create table if not exists public.support_ticket_events(
 id bigint generated always as identity primary key,
 ticket_id uuid not null references public.support_tickets(id) on delete cascade,
 actor_id uuid not null references auth.users(id),
 event_type text not null,
 note text,
 created_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
alter table public.support_ticket_events enable row level security;
revoke all on public.support_tickets,public.support_ticket_events from public,anon,authenticated;
grant select,insert on public.support_tickets to authenticated;
grant select on public.support_ticket_events to authenticated;
create policy support_ticket_customer_read on public.support_tickets for select to authenticated
 using(requester_id=(select auth.uid()));
create policy support_ticket_customer_insert on public.support_tickets for insert to authenticated
 with check(requester_id=(select auth.uid()) and status='open' and priority='normal' and assigned_to is null);
create policy support_ticket_staff_read on public.support_tickets for select to authenticated
 using(exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
  where m.user_id=(select auth.uid()) and m.status='active' and o.kind='landshop'
  and m.role in ('owner','admin','operations')));
create policy support_events_customer_read on public.support_ticket_events for select to authenticated
 using(exists(select 1 from public.support_tickets t where t.id=ticket_id and t.requester_id=(select auth.uid())));
create policy support_events_staff_read on public.support_ticket_events for select to authenticated
 using(exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
  where m.user_id=(select auth.uid()) and m.status='active' and o.kind='landshop'
  and m.role in ('owner','admin','operations')));

create or replace function public.landshop_support_decide(
 p_ticket uuid,p_status text,p_priority text,p_note text
) returns boolean language plpgsql security definer set search_path=''
as $$
declare
 v_actor uuid:=auth.uid();
 v_ticket public.support_tickets%rowtype;
 v_next text[];
begin
 if v_actor is null or not exists(
  select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
  where m.user_id=v_actor and m.status='active' and o.kind='landshop'
   and m.role in ('owner','admin','operations')
 ) then raise exception 'Authorized Landshop support operator required';end if;
 if p_priority not in ('low','normal','high','urgent') or
    p_status not in ('open','in_progress','awaiting_customer','resolved','closed') then
  raise exception 'Unsupported ticket status or priority';end if;
 if char_length(btrim(coalesce(p_note,'')))<10 or char_length(p_note)>2000 then
  raise exception 'A meaningful case note is required';end if;
 select * into v_ticket from public.support_tickets where id=p_ticket for update;
 if not found then raise exception 'Support ticket not found';end if;
 v_next:=case v_ticket.status
  when 'open' then array['open','in_progress','closed']
  when 'in_progress' then array['in_progress','awaiting_customer','resolved','closed']
  when 'awaiting_customer' then array['awaiting_customer','in_progress','resolved','closed']
  when 'resolved' then array['resolved','in_progress','closed']
  else array['closed'] end;
 if not(p_status=any(v_next)) then raise exception 'Unsupported ticket lifecycle transition';end if;
 update public.support_tickets set status=p_status,priority=p_priority,updated_at=now() where id=p_ticket;
 insert into public.support_ticket_events(ticket_id,actor_id,event_type,note)
 values(p_ticket,v_actor,'status_updated',btrim(p_note));
 insert into public.audit_events(actor_id,event_type,metadata)
 values(v_actor,'support.status_updated',jsonb_build_object('ticket_id',p_ticket,'status',p_status));
 insert into public.notification_outbox(event_type,user_id,payload)
 values('support.status_updated',v_ticket.requester_id,jsonb_build_object('ticket_id',p_ticket,'status',p_status));
 return true;
end;
$$;
revoke all on function public.landshop_support_decide(uuid,text,text,text) from public,anon;
grant execute on function public.landshop_support_decide(uuid,text,text,text) to authenticated;
