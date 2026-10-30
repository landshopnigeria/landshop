-- Landshop customer referrals: privacy-safe activity timeline for owners.
-- Only the logged-in referrer sees status of their own referrals;
-- no email, phone, name, KYC document, or referral target UUID is returned.
create or replace function public.landshop_referral_activity(p_limit integer default 15)
returns table(
  joined_at timestamptz,
  email_verified boolean,
  kyc_approved boolean,
  application_approved boolean,
  milestone text
)
language plpgsql stable security definer set search_path=''
as $$
declare viewer uuid;
begin
 viewer := (select auth.uid());
 if viewer is null then raise exception 'Authenticated account required' using errcode='28000'; end if;
 return query
 select e.created_at,
        (u.email_confirmed_at is not null),
        (coalesce(p.kyc_status,'')='approved'),
        exists(select 1 from public.applications a where a.applicant_id=e.referee_id and a.status='approved'),
        case
          when exists(select 1 from public.applications a where a.applicant_id=e.referee_id and a.status='approved') then 'Application approved'
          when coalesce(p.kyc_status,'')='approved' then 'KYC approved'
          when u.email_confirmed_at is not null then 'Email verified'
          else 'Registered'
        end
 from public.referral_edges e
 inner join auth.users u on u.id=e.referee_id
 left join public.profiles p on p.id=e.referee_id
 where e.referrer_id=viewer
 order by e.created_at desc
 limit least(greatest(coalesce(p_limit,15),1),30);
end $$;

revoke all on function public.landshop_referral_activity(integer) from public,anon;
grant execute on function public.landshop_referral_activity(integer) to authenticated;
comment on function public.landshop_referral_activity(integer) is
'Read-only, owner-scoped referral milestones. Never returns referee PII or authorizes reward credits.';
