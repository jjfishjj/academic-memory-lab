-- Phase B: server-authoritative role synergy and a shared diplomacy boss.

alter table public.realm_worlds
  add column if not exists boss_resolve integer not null default 100,
  add column if not exists negotiation_phase text not null default 'opening',
  add column if not exists combo_count integer not null default 0,
  add column if not exists combo_expires_at timestamptz,
  add column if not exists last_diplomacy_role text,
  add column if not exists last_combo text not null default '等待不同職業接技',
  add column if not exists boss_target_actor uuid,
  add column if not exists boss_target_name text,
  add column if not exists boss_next_pressure_at timestamptz not null default clock_timestamp();

alter table public.realm_world_members
  add column if not exists diplomatic_role text not null default 'diplomat',
  add column if not exists diplomatic_threat integer not null default 0,
  add column if not exists last_diplomacy_skill text,
  add column if not exists last_diplomacy_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'realm_worlds_boss_resolve_check' and conrelid = 'public.realm_worlds'::regclass) then
    alter table public.realm_worlds add constraint realm_worlds_boss_resolve_check check (boss_resolve between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'realm_worlds_negotiation_phase_check' and conrelid = 'public.realm_worlds'::regclass) then
    alter table public.realm_worlds add constraint realm_worlds_negotiation_phase_check check (negotiation_phase in ('opening', 'contest', 'brink', 'accord'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'realm_worlds_combo_count_check' and conrelid = 'public.realm_worlds'::regclass) then
    alter table public.realm_worlds add constraint realm_worlds_combo_count_check check (combo_count between 0 and 3);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'realm_members_diplomatic_role_check' and conrelid = 'public.realm_world_members'::regclass) then
    alter table public.realm_world_members add constraint realm_members_diplomatic_role_check check (diplomatic_role in ('diplomat', 'interpreter', 'intelligence'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'realm_members_diplomatic_threat_check' and conrelid = 'public.realm_world_members'::regclass) then
    alter table public.realm_world_members add constraint realm_members_diplomatic_threat_check check (diplomatic_threat between 0 and 100);
  end if;
end $$;

create index if not exists realm_members_room_threat_idx
on public.realm_world_members (room_code, diplomatic_threat desc, joined_at);

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
  v_target public.realm_world_members%rowtype;
  v_trust integer;
  v_tension integer;
  v_damage integer;
  v_distance real;
  v_count integer;
  v_members jsonb;
  v_combo_bonus integer := 0;
  v_threat integer := 0;
begin
  if v_actor is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  -- All player actions acquire the caller row before the world row, matching pose sync.
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
    set dodging_until = v_now + interval '700 milliseconds', last_action_at = v_now, last_seen_at = v_now
    where room_code = v_code and actor_id = v_actor;
    update public.realm_worlds
    set version = version + 1, last_action = 'dodge', last_actor_name = v_member.display_name,
        last_combat_result = v_member.display_name || ' 進入閃避窗口', updated_at = v_now
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
      update public.realm_world_members set last_action_at = v_now, last_seen_at = v_now
      where room_code = v_code and actor_id = v_actor;
      if random() < 0.84 then
        v_damage := 26 + floor(random() * 9)::integer;
        v_world.enemy_health := greatest(0, v_world.enemy_health - v_damage);
        v_world.last_combat_result := v_member.display_name || ' 命中 ' || v_damage;
        v_action := 'attack_hit';
        if v_world.enemy_health = 0 then
          v_world.quest_stage := 'npc'; v_world.enemy_target_actor := null; v_world.enemy_target_name := null;
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
      if v_distance > 2.8 then raise exception 'npc is out of range' using errcode = '22023'; end if;
      v_world.quest_stage := 'dialogue';

    elsif v_action = 'choose_branch' then
      if v_world.quest_stage not in ('dialogue', 'diplomacy') or v_world.won then
        raise exception 'branch selection is locked' using errcode = '22023';
      end if;
      if v_value = 'listen' then v_world.trust := 48; v_world.tension := 54;
      elsif v_value = 'verify' then v_world.trust := 58; v_world.tension := 45;
      elsif v_value = 'pressure' then v_world.trust := 32; v_world.tension := 74;
      else raise exception 'invalid dialogue branch' using errcode = '22023';
      end if;
      v_world.dialogue_branch := v_value;
      v_world.quest_stage := 'diplomacy';
      v_world.boss_resolve := 100;
      v_world.negotiation_phase := 'opening';
      v_world.combo_count := 0;
      v_world.combo_expires_at := null;
      v_world.last_diplomacy_role := null;
      v_world.last_combo := '等待不同職業接技';
      v_world.boss_target_actor := null;
      v_world.boss_target_name := null;
      v_world.boss_next_pressure_at := v_now + interval '2 seconds';
      update public.realm_world_members
      set diplomatic_threat = 0, last_diplomacy_skill = null, last_diplomacy_at = null
      where room_code = v_code;

    elsif v_action = 'set_role' then
      if v_value not in ('diplomat', 'interpreter', 'intelligence') then
        raise exception 'invalid diplomatic role' using errcode = '22023';
      end if;
      if v_world.won or (v_world.quest_stage = 'diplomacy' and v_member.last_diplomacy_at is not null) then
        raise exception 'role is locked during negotiation' using errcode = '22023';
      end if;
      update public.realm_world_members
      set diplomatic_role = v_value, last_seen_at = v_now
      where room_code = v_code and actor_id = v_actor;
      v_world.last_combat_result := v_member.display_name || ' 就任 ' || v_value;

    elsif v_action = 'skill' then
      if v_world.quest_stage <> 'diplomacy' or v_world.dialogue_branch is null or v_world.won then
        raise exception 'diplomacy skill is locked' using errcode = '22023';
      end if;
      if v_member.last_diplomacy_at is not null and v_member.last_diplomacy_at > v_now - interval '900 milliseconds' then
        raise exception 'action cooldown' using errcode = 'P0001';
      end if;

      if v_member.diplomatic_role = 'diplomat' and v_value = 'accord' then
        v_trust := 12; v_tension := -8; v_damage := 13; v_threat := 12;
      elsif v_member.diplomatic_role = 'interpreter' and v_value = 'clarify' then
        v_trust := 8; v_tension := -14; v_damage := 11; v_threat := 8;
      elsif v_member.diplomatic_role = 'intelligence' and v_value = 'evidence' then
        v_trust := 6; v_tension := -5; v_damage := 18; v_threat := 18;
      else
        raise exception 'skill does not match diplomatic role' using errcode = '22023';
      end if;

      if v_world.combo_expires_at is not null and v_world.combo_expires_at > v_now
         and v_world.last_diplomacy_role is distinct from v_member.diplomatic_role then
        v_world.combo_count := least(3, greatest(1, v_world.combo_count) + 1);
        v_combo_bonus := v_world.combo_count * 4;
        v_world.last_combo := v_world.combo_count || ' 連攜：' || v_world.last_diplomacy_role || ' → ' || v_member.diplomatic_role;
        v_trust := v_trust + 4;
        v_tension := v_tension - 3;
      else
        v_world.combo_count := 1;
        v_world.last_combo := '連攜起手：' || v_member.diplomatic_role;
      end if;
      v_world.combo_expires_at := v_now + interval '6 seconds';
      v_world.last_diplomacy_role := v_member.diplomatic_role;
      v_world.boss_resolve := greatest(0, v_world.boss_resolve - v_damage - v_combo_bonus);
      v_world.trust := least(100, greatest(0, v_world.trust + v_trust));
      v_world.tension := least(100, greatest(0, v_world.tension + v_tension));

      update public.realm_world_members
      set diplomatic_threat = least(100, diplomatic_threat + v_threat),
          last_diplomacy_skill = v_value,
          last_diplomacy_at = v_now,
          last_action_at = v_now,
          last_seen_at = v_now
      where room_code = v_code and actor_id = v_actor;

      if v_world.boss_next_pressure_at <= v_now then
        select * into v_target
        from public.realm_world_members
        where room_code = v_code and last_seen_at >= v_now - interval '20 seconds' and health > 0
        order by diplomatic_threat desc, joined_at
        limit 1;
        if found then
          v_world.boss_target_actor := v_target.actor_id;
          v_world.boss_target_name := v_target.display_name;
          v_world.trust := greatest(0, v_world.trust - 5);
          v_world.tension := least(100, v_world.tension + 7);
          v_world.last_combat_result := '灰議長向 ' || v_target.display_name || ' 發動語義施壓';
        end if;
        v_world.boss_next_pressure_at := v_now + interval '3 seconds';
      else
        v_world.last_combat_result := v_member.display_name || ' 施放 ' || v_value || '，削減韌性 ' || (v_damage + v_combo_bonus);
      end if;

      if v_world.boss_resolve = 0 then v_world.negotiation_phase := 'accord';
      elsif v_world.boss_resolve <= 33 then v_world.negotiation_phase := 'brink';
      elsif v_world.boss_resolve <= 66 then v_world.negotiation_phase := 'contest';
      else v_world.negotiation_phase := 'opening';
      end if;
      if v_world.boss_resolve = 0 and v_world.trust >= 82 and v_world.tension <= 25 then
        v_world.won := true;
        v_world.quest_stage := 'complete';
      end if;

    elsif v_action = 'reset' then
      if v_world.owner_actor <> v_actor then raise exception 'only the room owner can reset the world' using errcode = '42501'; end if;
      v_world.enemy_health := 100; v_world.enemy_x := -7; v_world.enemy_z := 2;
      v_world.enemy_target_actor := null; v_world.enemy_target_name := null;
      v_world.enemy_next_attack_at := v_now + interval '1 second';
      v_world.quest_stage := 'combat'; v_world.dialogue_branch := null;
      v_world.trust := 20; v_world.tension := 80; v_world.won := false;
      v_world.boss_resolve := 100; v_world.negotiation_phase := 'opening';
      v_world.combo_count := 0; v_world.combo_expires_at := null; v_world.last_diplomacy_role := null;
      v_world.last_combo := '等待不同職業接技'; v_world.boss_target_actor := null; v_world.boss_target_name := null;
      v_world.boss_next_pressure_at := v_now + interval '2 seconds';
      v_world.last_combat_result := '世界已重置';
      update public.realm_world_members
      set health = 100, dodging_until = null, last_hit_at = null, diplomatic_threat = 0,
          last_diplomacy_skill = null, last_diplomacy_at = null
      where room_code = v_code;
    else
      raise exception 'invalid world action' using errcode = '22023';
    end if;

    update public.realm_worlds
    set enemy_health = v_world.enemy_health, enemy_x = v_world.enemy_x, enemy_z = v_world.enemy_z,
        enemy_target_actor = v_world.enemy_target_actor, enemy_target_name = v_world.enemy_target_name,
        quest_stage = v_world.quest_stage, dialogue_branch = v_world.dialogue_branch,
        trust = v_world.trust, tension = v_world.tension, won = v_world.won,
        boss_resolve = v_world.boss_resolve, negotiation_phase = v_world.negotiation_phase,
        combo_count = v_world.combo_count, combo_expires_at = v_world.combo_expires_at,
        last_diplomacy_role = v_world.last_diplomacy_role, last_combo = v_world.last_combo,
        boss_target_actor = v_world.boss_target_actor, boss_target_name = v_world.boss_target_name,
        boss_next_pressure_at = v_world.boss_next_pressure_at,
        version = version + 1,
        last_action = v_action || case when v_value = '' then '' else ':' || v_value end,
        last_actor_name = v_member.display_name,
        last_combat_result = coalesce(v_world.last_combat_result, last_combat_result), updated_at = v_now
    where room_code = v_code;
  end if;

  select * into v_world from public.realm_worlds where room_code = v_code;
  select * into v_member from public.realm_world_members where room_code = v_code and actor_id = v_actor;
  select count(*) into v_count from public.realm_world_members
  where room_code = v_code and last_seen_at >= clock_timestamp() - interval '20 seconds';
  select coalesce(jsonb_agg(jsonb_build_object(
    'actor_id', m.actor_id, 'display_name', m.display_name, 'x', m.x, 'z', m.z, 'ry', m.ry,
    'motion', m.motion, 'health', m.health, 'dodging_until', m.dodging_until,
    'last_hit_at', m.last_hit_at, 'respawn_at', m.respawn_at,
    'diplomatic_role', m.diplomatic_role, 'diplomatic_threat', m.diplomatic_threat,
    'last_diplomacy_skill', m.last_diplomacy_skill
  ) order by m.joined_at), '[]'::jsonb) into v_members
  from public.realm_world_members m
  where m.room_code = v_code and m.last_seen_at >= clock_timestamp() - interval '20 seconds';
  return jsonb_build_object('world', to_jsonb(v_world), 'self', to_jsonb(v_member),
    'members', v_members, 'member_count', v_count, 'is_owner', v_world.owner_actor = v_actor);
end;
$$;

revoke all on function public.realm_world_action(text, text, text) from public, anon, authenticated;
grant execute on function public.realm_world_action(text, text, text) to authenticated;

-- Keep party role/threat data in the same privacy-scoped heartbeat envelope.
create or replace function public.realm_sync_player(
  p_room_code text, p_x real, p_z real, p_ry real, p_motion text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid(); v_code text := upper(trim(p_room_code)); v_now timestamptz := clock_timestamp();
  v_member public.realm_world_members%rowtype; v_world public.realm_worlds%rowtype;
  v_elapsed real; v_distance real; v_speed real; v_count integer; v_members jsonb;
begin
  if v_actor is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_x not between -12.5 and 12.5 or p_z not between -9 and 9 or p_ry not between -720 and 720 then
    raise exception 'position is outside the world' using errcode = '22023';
  end if;
  if lower(trim(p_motion)) not in ('idle', 'run', 'attack', 'dodge', 'hit', 'talk') then
    raise exception 'invalid motion state' using errcode = '22023';
  end if;
  select * into v_member from public.realm_world_members
  where room_code = v_code and actor_id = v_actor and last_seen_at >= v_now - interval '20 seconds' for update;
  if not found then raise exception 'actor has not joined this room' using errcode = '42501'; end if;
  v_elapsed := least(2, greatest(0.05, extract(epoch from (v_now - v_member.last_pose_at))::real));
  v_distance := sqrt((p_x - v_member.x) * (p_x - v_member.x) + (p_z - v_member.z) * (p_z - v_member.z));
  v_speed := case when lower(trim(p_motion)) = 'dodge' then 18 else 7 end;
  if v_distance > 0.8 + v_speed * v_elapsed then raise exception 'movement rejected' using errcode = '22023'; end if;
  update public.realm_world_members
  set x = p_x, z = p_z, ry = p_ry, motion = lower(trim(p_motion)), last_pose_at = v_now, last_seen_at = v_now
  where room_code = v_code and actor_id = v_actor returning * into v_member;
  delete from public.realm_world_members where room_code = v_code and last_seen_at < v_now - interval '20 seconds';
  perform public.realm_advance_world(v_code);
  select * into v_world from public.realm_worlds where room_code = v_code;
  select * into v_member from public.realm_world_members where room_code = v_code and actor_id = v_actor;
  select count(*) into v_count from public.realm_world_members where room_code = v_code;
  select coalesce(jsonb_agg(jsonb_build_object(
    'actor_id', m.actor_id, 'display_name', m.display_name, 'x', m.x, 'z', m.z, 'ry', m.ry,
    'motion', m.motion, 'health', m.health, 'dodging_until', m.dodging_until,
    'last_hit_at', m.last_hit_at, 'respawn_at', m.respawn_at,
    'diplomatic_role', m.diplomatic_role, 'diplomatic_threat', m.diplomatic_threat,
    'last_diplomacy_skill', m.last_diplomacy_skill
  ) order by m.joined_at), '[]'::jsonb) into v_members
  from public.realm_world_members m
  where m.room_code = v_code and m.last_seen_at >= v_now - interval '20 seconds';
  return jsonb_build_object('world', to_jsonb(v_world), 'self', to_jsonb(v_member),
    'members', v_members, 'member_count', v_count, 'is_owner', v_world.owner_actor = v_actor);
end;
$$;

revoke all on function public.realm_sync_player(text, real, real, real, text) from public, anon, authenticated;
grant execute on function public.realm_sync_player(text, real, real, real, text) to authenticated;
