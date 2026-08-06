create table if not exists public.learning_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.learning_snapshots enable row level security;

create policy "users read own learning snapshot"
on public.learning_snapshots for select
using (auth.uid() = user_id);

create policy "users insert own learning snapshot"
on public.learning_snapshots for insert
with check (auth.uid() = user_id);

create policy "users update own learning snapshot"
on public.learning_snapshots for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
