-- Correct the party-capacity guard: four distinct active actors are allowed;
-- only a fifth actor should be rejected.
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

  delete from public.realm_world_members
  where room_code = v_code
    and last_seen_at < clock_timestamp() - interval '20 seconds';

  select count(*) into v_count
  from public.realm_world_members
  where room_code = v_code and actor_id <> p_actor_id;

  if v_count >= 4 and not exists (
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
