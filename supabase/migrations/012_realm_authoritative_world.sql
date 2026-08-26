-- Server-authoritative shared state for the PlayCanvas Realm vertical slice.
-- Clients can read snapshots, but all mutations must pass through the validated RPC state machine.

create table if not exists public.realm_worlds (
  room_code text primary key
    check (room_code ~ '^[A-Z0-9-]{1,12}$'),
  owner_actor uuid not null,
  enemy_health integer not null default 100
    check (enemy_health between 0 and 100),
  quest_stage text not null default 'combat'
    check (quest_stage in ('combat', 'npc', 'dialogue', 'diplomacy', 'complete')),
  dialogue_branch text
    check (dialogue_branch is null or dialogue_branch in ('listen', 'verify', 'pressure')),
  trust integer not null default 20
    check (trust between 0 and 100),
  tension integer not null default 80
    check (tension between 0 and 100),
  won boolean not null default false,
  version bigint not null default 1 check (version > 0),
  last_action text not null default 'world_created',
  last_actor_name text not null default '系統',
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.realm_world_members (
  room_code text not null references public.realm_worlds(room_code) on delete cascade,
  actor_id uuid not null,
  display_name text not null check (char_length(display_name) between 1 and 14),
  joined_at timestamptz not null default clock_timestamp(),
  last_seen_at timestamptz not null default clock_timestamp(),
  last_action_at timestamptz,
  primary key (room_code, actor_id)
);

create index if not exists realm_world_members_active_idx
on public.realm_world_members (room_code, last_seen_at desc);

alter table public.realm_worlds enable row level security;
alter table public.realm_world_members enable row level security;

drop policy if exists "realm worlds are readable by room code" on public.realm_worlds;
create policy "realm worlds are readable by room code"
on public.realm_worlds for select
to anon, authenticated
using (true);

drop policy if exists "realm members are readable" on public.realm_world_members;
create policy "realm members are readable"
on public.realm_world_members for select
to anon, authenticated
using (true);

revoke all privileges on table public.realm_worlds from anon, authenticated;
revoke all privileges on table public.realm_world_members from anon, authenticated;
grant select on table public.realm_worlds to anon, authenticated;
grant select on table public.realm_world_members to anon, authenticated;

create or replace function public.realm_join_world(
  p_room_code text,
  p_actor_id uuid,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := upper(trim(p_room_code));
  v_name text := trim(p_display_name);
  v_count integer;
  v_world public.realm_worlds%rowtype;
begin
  if v_code !~ '^[A-Z0-9-]{1,12}$' then
    raise exception 'invalid room code' using errcode = '22023';
  end if;
  if p_actor_id is null then
    raise exception 'invalid actor id' using errcode = '22023';
  end if;
  if char_length(v_name) not between 1 and 14 then
    raise exception 'invalid display name' using errcode = '22023';
  end if;

  insert into public.realm_worlds (room_code, owner_actor, last_actor_name)
  values (v_code, p_actor_id, v_name)
  on conflict (room_code) do nothing;

  -- A disconnected browser is removed from the active party after 20 seconds.
  delete from public.realm_world_members
  where room_code = v_code
    and last_seen_at < clock_timestamp() - interval '20 seconds';

  select count(*) into v_count
  from public.realm_world_members
  where room_code = v_code and actor_id <> p_actor_id;

  if v_count >= 3 and not exists (
    select 1 from public.realm_world_members
    where room_code = v_code and actor_id = p_actor_id
  ) then
    raise exception 'room is full' using errcode = 'P0001';
  end if;

  insert into public.realm_world_members (room_code, actor_id, display_name)
  values (v_code, p_actor_id, v_name)
  on conflict (room_code, actor_id) do update
  set display_name = excluded.display_name,
      last_seen_at = clock_timestamp();

  -- If the original owner disappeared, the first active member becomes the new reset authority.
  update public.realm_worlds w
  set owner_actor = p_actor_id
  where w.room_code = v_code
    and not exists (
      select 1 from public.realm_world_members m
      where m.room_code = v_code and m.actor_id = w.owner_actor
    );

  select * into v_world from public.realm_worlds where room_code = v_code;
  select count(*) into v_count from public.realm_world_members where room_code = v_code;

  return jsonb_build_object(
    'world', to_jsonb(v_world),
    'member_count', v_count,
    'is_owner', v_world.owner_actor = p_actor_id
  );
end;
$$;

create or replace function public.realm_touch_world(
  p_room_code text,
  p_actor_id uuid,
  p_display_name text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := upper(trim(p_room_code));
  v_count integer;
begin
  if char_length(trim(p_display_name)) not between 1 and 14 then
    raise exception 'invalid display name' using errcode = '22023';
  end if;

  update public.realm_world_members
  set last_seen_at = clock_timestamp(), display_name = trim(p_display_name)
  where room_code = v_code and actor_id = p_actor_id;

  if not found then
    raise exception 'actor has not joined this room' using errcode = '42501';
  end if;

  delete from public.realm_world_members
  where room_code = v_code
    and last_seen_at < clock_timestamp() - interval '20 seconds';

  select count(*) into v_count
  from public.realm_world_members
  where room_code = v_code;
  return v_count;
end;
$$;

create or replace function public.realm_world_action(
  p_room_code text,
  p_actor_id uuid,
  p_action text,
  p_value text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := upper(trim(p_room_code));
  v_action text := lower(trim(p_action));
  v_value text := lower(trim(coalesce(p_value, '')));
  v_actor_name text;
  v_last_action_at timestamptz;
  v_world public.realm_worlds%rowtype;
  v_trust integer;
  v_tension integer;
  v_count integer;
begin
  select display_name, last_action_at
  into v_actor_name, v_last_action_at
  from public.realm_world_members
  where room_code = v_code
    and actor_id = p_actor_id
    and last_seen_at >= clock_timestamp() - interval '20 seconds'
  for update;

  if not found then
    raise exception 'actor has not joined this room' using errcode = '42501';
  end if;

  select * into v_world
  from public.realm_worlds
  where room_code = v_code
  for update;

  if not found then
    raise exception 'world not found' using errcode = 'P0002';
  end if;

  if v_action = 'attack' then
    if v_world.quest_stage <> 'combat' or v_world.enemy_health <= 0 then
      raise exception 'enemy is not attackable' using errcode = '22023';
    end if;
    if v_last_action_at is not null
      and v_last_action_at > clock_timestamp() - interval '350 milliseconds' then
      raise exception 'action cooldown' using errcode = 'P0001';
    end if;
    v_world.enemy_health := greatest(0, v_world.enemy_health - 34);
    if v_world.enemy_health = 0 then
      v_world.quest_stage := 'npc';
    end if;
    update public.realm_world_members
    set last_action_at = clock_timestamp(), last_seen_at = clock_timestamp()
    where room_code = v_code and actor_id = p_actor_id;

  elsif v_action = 'open_dialogue' then
    if v_world.enemy_health <> 0 or v_world.quest_stage not in ('npc', 'dialogue') then
      raise exception 'dialogue is locked' using errcode = '22023';
    end if;
    v_world.quest_stage := 'dialogue';

  elsif v_action = 'choose_branch' then
    if v_world.quest_stage not in ('dialogue', 'diplomacy') or v_world.won then
      raise exception 'branch selection is locked' using errcode = '22023';
    end if;
    if v_value = 'listen' then
      v_world.trust := 48; v_world.tension := 54;
    elsif v_value = 'verify' then
      v_world.trust := 58; v_world.tension := 45;
    elsif v_value = 'pressure' then
      v_world.trust := 32; v_world.tension := 74;
    else
      raise exception 'invalid dialogue branch' using errcode = '22023';
    end if;
    v_world.dialogue_branch := v_value;
    v_world.quest_stage := 'diplomacy';

  elsif v_action = 'skill' then
    if v_world.quest_stage <> 'diplomacy' or v_world.dialogue_branch is null or v_world.won then
      raise exception 'diplomacy skill is locked' using errcode = '22023';
    end if;
    if v_value = 'mirror' then
      v_trust := 27; v_tension := -22;
    elsif v_value = 'empathy' then
      v_trust := 20; v_tension := -16;
    elsif v_value = 'pressure' then
      v_trust := 7; v_tension := 8;
    else
      raise exception 'invalid diplomacy skill' using errcode = '22023';
    end if;
    v_world.trust := least(100, greatest(0, v_world.trust + v_trust));
    v_world.tension := least(100, greatest(0, v_world.tension + v_tension));
    if v_world.trust >= 82 and v_world.tension <= 25 then
      v_world.won := true;
      v_world.quest_stage := 'complete';
    end if;

  elsif v_action = 'reset' then
    if v_world.owner_actor <> p_actor_id then
      raise exception 'only the room owner can reset the world' using errcode = '42501';
    end if;
    v_world.enemy_health := 100;
    v_world.quest_stage := 'combat';
    v_world.dialogue_branch := null;
    v_world.trust := 20;
    v_world.tension := 80;
    v_world.won := false;

  else
    raise exception 'invalid world action' using errcode = '22023';
  end if;

  update public.realm_worlds
  set enemy_health = v_world.enemy_health,
      quest_stage = v_world.quest_stage,
      dialogue_branch = v_world.dialogue_branch,
      trust = v_world.trust,
      tension = v_world.tension,
      won = v_world.won,
      version = version + 1,
      last_action = v_action || case when v_value = '' then '' else ':' || v_value end,
      last_actor_name = v_actor_name,
      updated_at = clock_timestamp()
  where room_code = v_code
  returning * into v_world;

  select count(*) into v_count
  from public.realm_world_members
  where room_code = v_code
    and last_seen_at >= clock_timestamp() - interval '20 seconds';

  return jsonb_build_object(
    'world', to_jsonb(v_world),
    'member_count', v_count,
    'is_owner', v_world.owner_actor = p_actor_id
  );
end;
$$;

revoke all on function public.realm_join_world(text, uuid, text) from public, anon, authenticated;
revoke all on function public.realm_touch_world(text, uuid, text) from public, anon, authenticated;
revoke all on function public.realm_world_action(text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.realm_join_world(text, uuid, text) to anon, authenticated;
grant execute on function public.realm_touch_world(text, uuid, text) to anon, authenticated;
grant execute on function public.realm_world_action(text, uuid, text, text) to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'realm_worlds'
  ) then
    alter publication supabase_realtime add table public.realm_worlds;
  end if;
end $$;
