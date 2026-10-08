create table if not exists public.site_content (
  id boolean primary key default true check (id),
  content jsonb not null default '{"posts":[],"homeSlides":[],"homeCards":[],"gallery":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in ('renanhuamani1@gmail.com', 'ivan@admin.com')
    or exists(select 1 from public.admin_users where user_id = auth.uid());
$$;
alter table public.site_content enable row level security;
revoke all on public.site_content from anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;
drop policy if exists "public can read site content" on public.site_content;
create policy "public can read site content" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "admins manage site content" on public.site_content;
create policy "admins manage site content" on public.site_content for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.site_content (id) values (true) on conflict (id) do nothing;
