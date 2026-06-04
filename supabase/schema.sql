-- Stimulus single-user state table.
-- One row per auth user. The full app state is blobbed into `state` (jsonb)
-- and last-write-wins. Migrations from the client run before push, so
-- schema_version on the row matches whatever shape `state` is in.
--
-- Run once against the Supabase project (SQL editor):

create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version int not null,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

create policy "Users read own state"
  on public.user_state for select
  using (auth.uid() = user_id);

create policy "Users insert own state"
  on public.user_state for insert
  with check (auth.uid() = user_id);

create policy "Users update own state"
  on public.user_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
