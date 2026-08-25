create table if not exists public.memgenius_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '記憶旅人' check (char_length(display_name) between 1 and 24),
  total_xp integer not null default 0 check (total_xp >= 0),
  achievements integer not null default 0 check (achievements >= 0),
  updated_at timestamptz not null default now()
);

alter table public.memgenius_profiles enable row level security;

create policy "leaderboard is publicly readable"
on public.memgenius_profiles for select
to anon, authenticated
using (true);

create policy "users insert own leaderboard profile"
on public.memgenius_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "users update own leaderboard profile"
on public.memgenius_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select on public.memgenius_profiles to anon, authenticated;
grant insert, update on public.memgenius_profiles to authenticated;
