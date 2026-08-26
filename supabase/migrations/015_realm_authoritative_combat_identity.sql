-- Phase B: authenticated identity, server-validated movement and authoritative combat AI.

alter table public.realm_worlds
  add column if not exists enemy_x real not null default -7,
  add column if not exists enemy_z real not null default 2,
  add column if not exists enemy_target_actor uuid,
  add column if not exists enemy_target_name text,
  add column if not exists enemy_last_tick_at timestamptz not null default clock_timestamp(),
  add column if not exists enemy_next_attack_at timestamptz not null default clock_timestamp(),
  add column if not exists last_combat_result text not null default 'none';

alter table public.realm_world_members
  add column if not exists x real not null default 0,
  add column if not exists z real not null default 8,
  add column if not exists ry real not null default 180,
  add column if not exists motion text not null default 'idle',
  add column if not exists health integer not null default 100,
  add column if not exists dodging_until timestamptz,
  add column if not exists last_pose_at timestamptz not null default clock_timestamp(),
  add column if not exists last_hit_at timestamptz;

alter table public.realm_world_members
  drop constraint if exists realm_world_members_health_check;
alter table public.realm_world_members
  add constraint realm_world_members_health_check check (health between 0 and 100);

-- Old RPC signatures trusted a client-supplied actor UUID. Remove that attack surface.
revoke all on function public.realm_join_world(text, uuid, text) from public, anon, authenticated;
revoke all on function public.realm_touch_world(text, uuid, text) from public, anon, authenticated;
revoke all on function public.realm_world_action(text, uuid, text, text) from public, anon, authenticated;
drop function public.realm_join_world(text, uuid, text);
drop function public.realm_touch_world(text, uuid, text);
drop function public.realm_world_action(text, uuid, text, text);

-- Internal simulation step. It is callable only by the public authenticated RPCs below.
create or replace function public.realm_advance_world(p_room_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_world public.realm_worlds%rowtype;
  v_target public.realm_world_members%rowtype;
  v_dt real;
  v_dx real;
  v_dz real;
  v_distance real;
  v_step real;
  v_enemy_x real;
  v_enemy_z real;
  v_event text;
  v_result text;
begin
  select * into v_world
  from public.realm_worlds
  where room_code = p_room_code
  for update;

  if not found or v_world.quest_stage <> 'combat' or v_world.enemy_health <= 0 then
    return;
  end if;

  v_dt := least(0.5, greatest(0, extract(epoch from (v_now - v_world.enemy_last_tick_at))::real));
  v_enemy_x := v_world.enemy_x;
  v_enemy_z := v_world.enemy_z;

  select m.* into v_target
  from public.realm_world_members m
  where m.room_code = p_room_code
    and m.last_seen_at >= v_now - interval '20 seconds'
    and m.health > 0
  order by ((m.x - v_enemy_x) * (m.x - v_enemy_x) + (m.z - v_enemy_z) * (m.z - v_enemy_z)), m.joined_at
  limit 1
  for update;

  if found then
    v_dx := v_target.x - v_enemy_x;
    v_dz := v_target.z - v_enemy_z;
    v_distance := sqrt(v_dx * v_dx + v_dz * v_dz);
    if v_distance > 1.55 then
      v_step := least(v_distance - 1.55, 1.85 * v_dt);
      if v_distance > 0 then
        v_enemy_x := v_enemy_x + (v_dx / v_distance) * v_step;
        v_enemy_z := v_enemy_z + (v_dz / v_distance) * v_step;
      end if;
    end if;

    v_dx := v_target.x - v_enemy_x;
    v_dz := v_target.z - v_enemy_z;
    v_distance := sqrt(v_dx * v_dx + v_dz * v_dz);
    if v_distance <= 1.78 and v_world.enemy_next_attack_at <= v_now then
      if v_target.dodging_until is not null and v_target.dodging_until > v_now then
        v_event := 'enemy_evaded';
        v_result := v_target.display_name || ' 閃避成功';
      else
        update public.realm_world_members
        set health = greatest(0, health - 12),
            last_hit_at = v_now
        where room_code = p_room_code and actor_id = v_target.actor_id;
        v_event := 'enemy_hit';
        v_result := v_target.display_name || ' 受到 12 傷害';
      end if;
      v_world.enemy_next_attack_at := v_now + interval '1150 milliseconds';
    end if;

    update public.realm_worlds
    set enemy_x = v_enemy_x,
        enemy_z = v_enemy_z,
        enemy_target_actor = v_target.actor_id,
        enemy_target_name = v_target.display_name,
        enemy_last_tick_at = v_now,
        enemy_next_attack_at = v_world.enemy_next_attack_at,
        version = version + case when v_event is null then 0 else 1 end,
        last_action = coalesce(v_event, last_action),
        last_actor_name = case when v_event is null then last_actor_name else v_target.display_name end,
        last_combat_result = coalesce(v_result, last_combat_result),
        updated_at = v_now
    where room_code = p_room_code;
  else
    -- No live target: patrol around the western road using server time.
    v_dx := (-7 + sin(extract(epoch from v_now) * 0.55) * 2.8)::real - v_enemy_x;
    v_dz := (2 + cos(extract(epoch from v_now) * 0.45) * 2.2)::real - v_enemy_z;
    v_distance := sqrt(v_dx * v_dx + v_dz * v_dz);
    v_step := least(v_distance, 1.2 * v_dt);
    if v_distance > 0 then
      v_enemy_x := v_enemy_x + (v_dx / v_distance) * v_step;
      v_enemy_z := v_enemy_z + (v_dz / v_distance) * v_step;
    end if;
    update public.realm_worlds
    set enemy_x = v_enemy_x,
        enemy_z = v_enemy_z,
        enemy_target_actor = null,
        enemy_target_name = null,
        enemy_last_tick_at = v_now,
        updated_at = v_now
    where room_code = p_room_code;
  end if;
end;
$$;

revoke all on function public.realm_advance_world(text) from public, anon, authenticated;

create or replace function public.realm_join_world(
  p_room_code text,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_code text := upper(trim(p_room_code));
  v_name text := trim(p_display_name);
  v_count integer;
  v_world public.realm_worlds%rowtype;
  v_member public.realm_world_members%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if v_code !~ '^[A-Z0-9-]{1,12}$' then
    raise exception 'invalid room code' using errcode = '22023';
  end if;
  if char_length(v_name) not between 1 and 14 then
    raise exception 'invalid display name' using errcode = '22023';
  end if;

  insert into public.realm_worlds (room_code, owner_actor, last_actor_name)
  values (v_code, v_actor, v_name)
  on conflict (room_code) do nothing;

  delete from public.realm_world_members
  where room_code = v_code
    and last_seen_at < clock_timestamp() - interval '20 seconds';

  select count(*) into v_count
  from public.realm_world_members
  where room_code = v_code and actor_id <> v_actor;

  if v_count >= 4 and not exists (
    select 1 from public.realm_world_members
    where room_code = v_code and actor_id = v_actor
  ) then
    raise exception 'room is full' using errcode = 'P0001';
  end if;

  insert into public.realm_world_members (room_code, actor_id, display_name)
  values (v_code, v_actor, v_name)
  on conflict (room_code, actor_id) do update
  set display_name = excluded.display_name,
      last_seen_at = clock_timestamp();

  update public.realm_worlds w
  set owner_actor = v_actor
  where w.room_code = v_code
    and not exists (
      select 1 from public.realm_world_members m
      where m.room_code = v_code and m.actor_id = w.owner_actor
    );

  perform public.realm_advance_world(v_code);
  select * into v_world from public.realm_worlds where room_code = v_code;
  select * into v_member from public.realm_world_members where room_code = v_code and actor_id = v_actor;
  select count(*) into v_count from public.realm_world_members where room_code = v_code;

  return jsonb_build_object(
    'world', to_jsonb(v_world),
    'self', to_jsonb(v_member),
    'member_count', v_count,
    'is_owner', v_world.owner_actor = v_actor
  );
end;
$$;

create or replace function public.realm_sync_player(
  p_room_code text,
  p_x real,
  p_z real,
  p_ry real,
  p_motion text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_code text := upper(trim(p_room_code));
  v_now timestamptz := clock_timestamp();
  v_member public.realm_world_members%rowtype;
  v_world public.realm_worlds%rowtype;
  v_elapsed real;
  v_distance real;
  v_speed real;
  v_count integer;
begin
  if v_actor is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_x not between -12.5 and 12.5 or p_z not between -9 and 9 or p_ry not between -720 and 720 then
    raise exception 'position is outside the world' using errcode = '22023';
  end if;
  if lower(trim(p_motion)) not in ('idle', 'run', 'attack', 'dodge', 'hit', 'talk') then
    raise exception 'invalid motion state' using errcode = '22023';
  end if;

  select * into v_member
  from public.realm_world_members
  where room_code = v_code
    and actor_id = v_actor
    and last_seen_at >= v_now - interval '20 seconds'
  for update;
  if not found then
    raise exception 'actor has not joined this room' using errcode = '42501';
  end if;

  v_elapsed := least(2, greatest(0.05, extract(epoch from (v_now - v_member.last_pose_at))::real));
  v_distance := sqrt((p_x - v_member.x) * (p_x - v_member.x) + (p_z - v_member.z) * (p_z - v_member.z));
  v_speed := case when lower(trim(p_motion)) = 'dodge' then 18 else 7 end;
  if v_distance > 0.8 + v_speed * v_elapsed then
    raise exception 'movement rejected' using errcode = '22023';
  end if;

  update public.realm_world_members
  set x = p_x,
      z = p_z,
      ry = p_ry,
      motion = lower(trim(p_motion)),
      last_pose_at = v_now,
      last_seen_at = v_now
  where room_code = v_code and actor_id = v_actor
  returning * into v_member;

  delete from public.realm_world_members
  where room_code = v_code and last_seen_at < v_now - interval '20 seconds';
  perform public.realm_advance_world(v_code);

  select * into v_world from public.realm_worlds where room_code = v_code;
  select * into v_member from public.realm_world_members where room_code = v_code and actor_id = v_actor;
  select count(*) into v_count from public.realm_world_members where room_code = v_code;
  return jsonb_build_object(
    'world', to_jsonb(v_world),
    'self', to_jsonb(v_member),
    'member_count', v_count,
    'is_owner', v_world.owner_actor = v_actor
  );
end;
$$;

create or replace function public.realm_world_action(
  p_room_code text,
  p_action text,
  p_value text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_code text := upper(trim(p_room_code));
  v_action text := lower(trim(p_action));
  v_value text := lower(trim(coalesce(p_value, '')));
  v_now timestamptz := clock_timestamp();
  v_member public.realm_world_members%rowtype;
  v_world public.realm_worlds%rowtype;
  v_trust integer;
  v_tension integer;
  v_damage integer;
  v_distance real;
  v_count integer;
begin
  if v_actor is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_member
  from public.realm_world_members
  where room_code = v_code
    and actor_id = v_actor
    and last_seen_at >= v_now - interval '20 seconds'
  for update;
  if not found then
    raise exception 'actor has not joined this room' using errcode = '42501';
  end if;
  if v_member.health <= 0 and v_action not in ('reset') then
    raise exception 'player is defeated' using errcode = '22023';
  end if;

  if v_action = 'dodge' then
    if v_member.last_action_at is not null and v_member.last_action_at > v_now - interval '500 milliseconds' then
      raise exception 'action cooldown' using errcode = 'P0001';
    end if;
    update public.realm_world_members
    set dodging_until = v_now + interval '700 milliseconds',
        last_action_at = v_now,
        last_seen_at = v_now
    where room_code = v_code and actor_id = v_actor;
    update public.realm_worlds
    set version = version + 1,
        last_action = 'dodge',
        last_actor_name = v_member.display_name,
        last_combat_result = v_member.display_name || ' 進入閃避窗口',
        updated_at = v_now
    where room_code = v_code;
    perform public.realm_advance_world(v_code);
  else
    perform public.realm_advance_world(v_code);
    select * into v_world from public.realm_worlds where room_code = v_code for update;

    if v_action = 'attack' then
      if v_world.quest_stage <> 'combat' or v_world.enemy_health <= 0 then
        raise exception 'enemy is not attackable' using errcode = '22023';
      end if;
      if v_member.last_action_at is not null and v_member.last_action_at > v_now - interval '550 milliseconds' then
        raise exception 'action cooldown' using errcode = 'P0001';
      end if;
      v_distance := sqrt((v_member.x - v_world.enemy_x) * (v_member.x - v_world.enemy_x) + (v_member.z - v_world.enemy_z) * (v_member.z - v_world.enemy_z));
      if v_distance > 2.65 then
        raise exception 'enemy is out of range' using errcode = '22023';
      end if;
      update public.realm_world_members
      set last_action_at = v_now, last_seen_at = v_now
      where room_code = v_code and actor_id = v_actor;
      if random() < 0.84 then
        v_damage := 26 + floor(random() * 9)::integer;
        v_world.enemy_health := greatest(0, v_world.enemy_health - v_damage);
        v_world.last_combat_result := v_member.display_name || ' 命中 ' || v_damage;
        v_action := 'attack_hit';
        if v_world.enemy_health = 0 then
          v_world.quest_stage := 'npc';
          v_world.enemy_target_actor := null;
          v_world.enemy_target_name := null;
        end if;
      else
        v_world.last_combat_result := v_member.display_name || ' 的攻擊被霧魘閃避';
        v_action := 'attack_miss';
      end if;

    elsif v_action = 'open_dialogue' then
      if v_world.enemy_health <> 0 or v_world.quest_stage not in ('npc', 'dialogue') then
        raise exception 'dialogue is locked' using errcode = '22023';
      end if;
      v_distance := sqrt((v_member.x - 8.4) * (v_member.x - 8.4) + (v_member.z + 5.2) * (v_member.z + 5.2));
      if v_distance > 2.8 then
        raise exception 'npc is out of range' using errcode = '22023';
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
      if v_world.owner_actor <> v_actor then
        raise exception 'only the room owner can reset the world' using errcode = '42501';
      end if;
      v_world.enemy_health := 100;
      v_world.enemy_x := -7;
      v_world.enemy_z := 2;
      v_world.enemy_target_actor := null;
      v_world.enemy_target_name := null;
      v_world.enemy_next_attack_at := v_now + interval '1 second';
      v_world.quest_stage := 'combat';
      v_world.dialogue_branch := null;
      v_world.trust := 20;
      v_world.tension := 80;
      v_world.won := false;
      v_world.last_combat_result := '世界已重置';
      update public.realm_world_members
      set health = 100, dodging_until = null, last_hit_at = null
      where room_code = v_code;

    else
      raise exception 'invalid world action' using errcode = '22023';
    end if;

    update public.realm_worlds
    set enemy_health = v_world.enemy_health,
        enemy_x = v_world.enemy_x,
        enemy_z = v_world.enemy_z,
        enemy_target_actor = v_world.enemy_target_actor,
        enemy_target_name = v_world.enemy_target_name,
        quest_stage = v_world.quest_stage,
        dialogue_branch = v_world.dialogue_branch,
        trust = v_world.trust,
        tension = v_world.tension,
        won = v_world.won,
        version = version + 1,
        last_action = v_action || case when v_value = '' then '' else ':' || v_value end,
        last_actor_name = v_member.display_name,
        last_combat_result = coalesce(v_world.last_combat_result, last_combat_result),
        updated_at = v_now
    where room_code = v_code;
  end if;

  select * into v_world from public.realm_worlds where room_code = v_code;
  select * into v_member from public.realm_world_members where room_code = v_code and actor_id = v_actor;
  select count(*) into v_count
  from public.realm_world_members
  where room_code = v_code and last_seen_at >= clock_timestamp() - interval '20 seconds';
  return jsonb_build_object(
    'world', to_jsonb(v_world),
    'self', to_jsonb(v_member),
    'member_count', v_count,
    'is_owner', v_world.owner_actor = v_actor
  );
end;
$$;

revoke all on function public.realm_join_world(text, text) from public, anon, authenticated;
revoke all on function public.realm_sync_player(text, real, real, real, text) from public, anon, authenticated;
revoke all on function public.realm_world_action(text, text, text) from public, anon, authenticated;
grant execute on function public.realm_join_world(text, text) to authenticated;
grant execute on function public.realm_sync_player(text, real, real, real, text) to authenticated;
grant execute on function public.realm_world_action(text, text, text) to authenticated;

-- Realtime snapshots require SELECT, but anonymous API-key traffic no longer receives them.
drop policy if exists "realm worlds are readable by room code" on public.realm_worlds;
create policy "authenticated realm worlds are readable"
on public.realm_worlds for select
to authenticated
using (true);
revoke select on table public.realm_worlds from anon;
grant select on table public.realm_worlds to authenticated;

