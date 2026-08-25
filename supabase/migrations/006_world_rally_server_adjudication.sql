create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.rally_race_sessions (
  ticket uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  map_id text not null check (map_id in ('taipei', 'paris', 'tokyo')),
  started_at timestamptz not null default clock_timestamp(),
  used_at timestamptz
);

create index if not exists rally_race_sessions_user_idx
on private.rally_race_sessions (user_id, started_at desc);

alter table private.rally_race_sessions enable row level security;

create or replace function public.start_rally_race(p_map_id text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_ticket uuid;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if p_map_id not in ('taipei', 'paris', 'tokyo') then
    raise exception 'invalid rally map' using errcode = '22023';
  end if;

  update private.rally_race_sessions
  set used_at = clock_timestamp()
  where user_id = v_user and used_at is null;

  insert into private.rally_race_sessions (user_id, map_id)
  values (v_user, p_map_id)
  returning ticket into v_ticket;
  return v_ticket;
end;
$$;

create or replace function public.finish_rally_race(
  p_ticket uuid,
  p_display_name text,
  p_rank integer,
  p_ghost_path jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_owner uuid;
  v_map_id text;
  v_started_at timestamptz;
  v_used_at timestamptz;
  v_finish_ms integer;
  v_score integer;
  v_run_id bigint;
  v_points integer;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select user_id, map_id, started_at, used_at
  into v_owner, v_map_id, v_started_at, v_used_at
  from private.rally_race_sessions
  where ticket = p_ticket
  for update;

  if not found or v_owner <> v_user then
    raise exception 'invalid race ticket' using errcode = '42501';
  end if;
  if v_used_at is not null then
    raise exception 'race ticket already used' using errcode = '22023';
  end if;
  if char_length(trim(p_display_name)) not between 1 and 24 then
    raise exception 'invalid display name' using errcode = '22023';
  end if;
  if p_rank not between 1 and 4 then
    raise exception 'invalid race rank' using errcode = '22023';
  end if;
  if jsonb_typeof(p_ghost_path) <> 'array' then
    raise exception 'ghost path must be an array' using errcode = '22023';
  end if;

  v_points := jsonb_array_length(p_ghost_path);
  if v_points not between 2 and 5000 or pg_column_size(p_ghost_path) > 262144 then
    raise exception 'invalid ghost path size' using errcode = '22023';
  end if;

  v_finish_ms := floor(extract(epoch from (clock_timestamp() - v_started_at)) * 1000);
  if v_finish_ms not between 3000 and 3600000 then
    raise exception 'implausible race duration' using errcode = '22023';
  end if;

  v_score := greatest(0, least(1000000,
    round(5000000.0 / v_finish_ms) + (5 - p_rank) * 250 + least(v_points, 1000)
  ));

  update private.rally_race_sessions
  set used_at = clock_timestamp()
  where ticket = p_ticket;

  insert into public.rally_runs
    (user_id, display_name, season, map_id, score, finish_ms, rank, ghost_path)
  values
    (v_user, trim(p_display_name), 'S01', v_map_id, v_score, v_finish_ms, p_rank, p_ghost_path)
  returning id into v_run_id;

  return v_run_id;
end;
$$;

revoke insert on table public.rally_runs from authenticated;
revoke all on function public.start_rally_race(text) from public, anon;
revoke all on function public.finish_rally_race(uuid, text, integer, jsonb) from public, anon;
grant execute on function public.start_rally_race(text) to authenticated;
grant execute on function public.finish_rally_race(uuid, text, integer, jsonb) to authenticated;
