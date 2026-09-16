create table if not exists public.site_content (
  id boolean primary key default true check (id),
  content jsonb not null default '{"posts":[],"homeSlides":[],"homeCards":[],"gallery":[]}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
revoke all on public.site_content from anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;
drop policy if exists "public can read site content" on public.site_content;
create policy "public can read site content" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "admins manage site content" on public.site_content;
create policy "admins manage site content" on public.site_content for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.site_content (id) values (true) on conflict (id) do nothing;
