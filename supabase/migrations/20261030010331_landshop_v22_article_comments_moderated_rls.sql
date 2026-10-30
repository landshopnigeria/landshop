-- Applied to Landshop production Supabase project as migration 20261030010331.
-- Authenticated reader submissions, publish-only-after-review, staff moderation.
create table if not exists public.article_comments (
 id uuid primary key default gen_random_uuid(),
 article_slug text not null check (article_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(article_slug) <= 130),
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check (char_length(btrim(body)) between 12 and 3000),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id) on delete set null
);
create index if not exists article_comments_public_idx on public.article_comments (article_slug, created_at desc) where status='approved';
create index if not exists article_comments_author_idx on public.article_comments(author_id,created_at desc);
create index if not exists article_comments_pending_idx on public.article_comments(created_at desc) where status='pending';
alter table public.article_comments enable row level security;
revoke all on public.article_comments from anon, authenticated;
grant select on public.article_comments to anon, authenticated;
grant insert on public.article_comments to authenticated;
grant update on public.article_comments to authenticated;
create policy article_comments_public_approved on public.article_comments
 for select to anon, authenticated using (status='approved');
create policy article_comments_view_own on public.article_comments
 for select to authenticated using (author_id = (select auth.uid()));
create policy article_comments_staff_review on public.article_comments
 for select to authenticated using (
 exists(select 1 from public.organization_members m
 join public.organizations o on o.id=m.organization_id
 where m.user_id=(select auth.uid()) and m.status='active'
 and o.kind='landshop' and m.role in ('owner','admin','operations'))
 );
create policy article_comments_authored_insert on public.article_comments
 for insert to authenticated
 with check (author_id=(select auth.uid()) and status='pending' and reviewed_by is null and reviewed_at is null);
create policy article_comments_staff_update on public.article_comments
 for update to authenticated
 using (
 exists(select 1 from public.organization_members m
 join public.organizations o on o.id=m.organization_id
 where m.user_id=(select auth.uid()) and m.status='active'
 and o.kind='landshop' and m.role in ('owner','admin','operations'))
 )
 with check (
 exists(select 1 from public.organization_members m
 join public.organizations o on o.id=m.organization_id
 where m.user_id=(select auth.uid()) and m.status='active'
 and o.kind='landshop' and m.role in ('owner','admin','operations'))
 );
