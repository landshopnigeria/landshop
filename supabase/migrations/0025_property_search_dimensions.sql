
-- V16 public property search fields, without changing current public visibility/RLS.
-- All new optional facts are NULL until explicitly verified and entered by authorized editors.
alter table public.estates add column if not exists lga text;
alter table public.estates add column if not exists area text;
alter table public.properties add column if not exists sale_mode text;
alter table public.properties add column if not exists bedrooms integer;
alter table public.properties add column if not exists bathrooms integer;
alter table public.properties add column if not exists floor_area_sqm numeric(12,2);
alter table public.properties add column if not exists land_area_sqm numeric(12,2);
alter table public.properties add column if not exists availability text;
alter table public.properties add constraint landshop_sale_mode_allowed
  check(sale_mode is null or sale_mode in ('Buy','Rent','Shortlet'));
alter table public.properties add constraint landshop_bedrooms_allowed
  check(bedrooms is null or bedrooms between 0 and 100);
alter table public.properties add constraint landshop_bathrooms_allowed
  check(bathrooms is null or bathrooms between 0 and 100);
alter table public.properties add constraint landshop_floor_size_allowed
  check(floor_area_sqm is null or floor_area_sqm > 0);
alter table public.properties add constraint landshop_land_size_allowed
  check(land_area_sqm is null or land_area_sqm > 0);
alter table public.properties add constraint landshop_availability_allowed
  check(availability is null or availability in ('available','under_offer','reserved','sold','rented'));
create index if not exists landshop_property_public_filter_idx on public.properties(status,sale_mode,property_type,amount_kobo);
create index if not exists landshop_property_spec_filter_idx on public.properties(bedrooms,bathrooms,floor_area_sqm);
create index if not exists landshop_estate_region_idx on public.estates(status,state,lga,city);
-- No defaults or bulk assumptions about unknown bedrooms, price, area or availability.
