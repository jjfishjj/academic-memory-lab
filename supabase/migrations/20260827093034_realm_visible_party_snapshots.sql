-- Phase A: include a privacy-scoped party snapshot in the authoritative pose heartbeat.
-- The table remains unreadable through the Data API; a player only receives members
-- after the RPC verifies that their authenticated actor is active in the same room.

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
  v_members jsonb;
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
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'actor_id', m.actor_id,
        'display_name', m.display_name,
        'x', m.x,
        'z', m.z,
        'ry', m.ry,
        'motion', m.motion,
        'health', m.health,
        'dodging_until', m.dodging_until,
        'last_hit_at', m.last_hit_at,
        'respawn_at', m.respawn_at
      ) order by m.joined_at
    ),
    '[]'::jsonb
  ) into v_members
  from public.realm_world_members m
  where m.room_code = v_code
    and m.last_seen_at >= v_now - interval '20 seconds';

  return jsonb_build_object(
    'world', to_jsonb(v_world),
    'self', to_jsonb(v_member),
    'members', v_members,
    'member_count', v_count,
    'is_owner', v_world.owner_actor = v_actor
  );
end;
$$;

revoke all on function public.realm_sync_player(text, real, real, real, text) from public, anon, authenticated;
grant execute on function public.realm_sync_player(text, real, real, real, text) to authenticated;
