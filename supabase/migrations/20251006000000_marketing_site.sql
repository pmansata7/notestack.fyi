-- NoteStack marketing site: waitlist + optional release metadata
-- Run via Supabase CLI (`supabase db push`) or paste in SQL Editor.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'website',
  user_agent text,
  created_at timestamptz not null default now(),
  constraint waitlist_email_format check (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

create unique index if not exists waitlist_email_key on public.waitlist (email);

alter table public.waitlist enable row level security;

-- Anonymous visitors can join the waitlist; no public reads.
create policy "waitlist_insert_anon"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

create policy "waitlist_select_service"
  on public.waitlist
  for select
  to service_role
  using (true);

comment on table public.waitlist is 'Marketing site email waitlist (insert-only for anon).';

-- Optional: track published desktop builds (public read for latest macOS URL).
create table if not exists public.app_releases (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('macos', 'windows', 'linux')),
  version text not null,
  download_url text not null,
  release_notes text,
  is_latest boolean not null default false,
  published_at timestamptz not null default now()
);

create unique index if not exists app_releases_one_latest_per_platform
  on public.app_releases (platform)
  where is_latest;

alter table public.app_releases enable row level security;

create policy "app_releases_read_latest"
  on public.app_releases
  for select
  to anon, authenticated
  using (is_latest = true);

create policy "app_releases_manage_service"
  on public.app_releases
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.app_releases is 'Public latest download URLs per platform; manage via dashboard or service role.';
