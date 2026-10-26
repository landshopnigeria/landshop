-- Canonical Landshop organization and Seven Cities allocation programme.
-- No privileged user membership is auto-provisioned by this migration.
insert into public.organizations(name,kind)
select 'Landshop','landshop' where not exists(
 select 1 from public.organizations where kind='landshop' and name='Landshop'
);
insert into public.allocation_programmes(name,status)
values('Seven Cities Allocation','planning')
on conflict(name) do nothing;
