-- E2E ship pipeline smoke: harmless idempotent schema touch for CI + supabase-migrate verification.
-- Not referenced by apps/web; service_role can write if you choose to log applies later.

create table if not exists public.schema_migrations_log (
  id uuid primary key default gen_random_uuid(),
  migration_name text not null,
  applied_at timestamptz not null default now(),
  constraint schema_migrations_log_name_key unique (migration_name)
);

alter table public.schema_migrations_log enable row level security;

comment on table public.schema_migrations_log is 'Optional audit of applied migration names; RLS enabled with no policies (anon/authenticated denied).';

comment on table public.waitlist is 'Marketing site email waitlist (insert-only for anon). Pipeline smoke migration 20251012160000 applied.';
