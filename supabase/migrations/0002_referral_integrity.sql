-- Landshop permanent referral ancestry. Apply after 0001 and review on a controlled production change.
-- Only a privileged API with authenticated user identity may create a referral edge.
create sequence if not exists public.landshop_referral_sequence start 1 increment 1;

create or replace function public.prevent_referral_cycles()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare cycle_found boolean;
begin
 if new.referee_id=new.referrer_id then raise exception 'Self referral is not allowed'; end if;
 with recursive ancestors(person_id,path) as (
   select new.referrer_id, array[new.referrer_id]
   union all
   select e.referrer_id,a.path || e.referrer_id
   from ancestors a
   join public.referral_edges e on e.referee_id=a.person_id
   where not e.referrer_id=any(a.path)
 )
 select exists(select 1 from ancestors where person_id=new.referee_id) into cycle_found;
 if cycle_found then raise exception 'Referral ancestry cycle is not allowed'; end if;
 return new;
end $$;

drop trigger if exists reject_referral_cycles on public.referral_edges;
create trigger reject_referral_cycles before insert on public.referral_edges
for each row execute function public.prevent_referral_cycles();

-- No insert/update/delete RLS grants are provided to portal visitors.
-- Write referral edges only after verifying the attribution token, signup identity,
-- recipient's lack of existing upline, and fraud controls in a trusted backend.
-- Until then referral attribution must remain marked as pending.
