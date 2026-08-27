-- Phase C: server-owned defeat/respawn lifecycle used by reconnecting clients.

alter table public.realm_world_members
  add column if not exists respawn_at timestamptz;

create or replace function public.realm_member_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- The enemy reduced a live player to zero: start a server-clock respawn timer.
  if old.health > 0 and new.health = 0 then
    new.respawn_at := clock_timestamp() + interval '5 seconds';
    new.motion := 'hit';
    return new;
  end if;

  -- A defeated player's position packets remain heartbeats but cannot move the avatar.
  if old.health = 0 and new.health = 0 then
    if old.respawn_at is not null and old.respawn_at <= clock_timestamp() then
      new.health := 100;
      new.respawn_at := null;
      new.x := 0;
      new.z := 8;
      new.ry := 180;
      new.motion := 'idle';
      new.dodging_until := null;
      new.last_hit_at := null;

      update public.realm_worlds
      set version = version + 1,
          last_action = 'player_revived',
          last_actor_name = old.display_name,
          last_combat_result = old.display_name || ' 已在迎賓台復活',
          updated_at = clock_timestamp()
      where room_code = old.room_code;
    else
      new.x := old.x;
      new.z := old.z;
      new.ry := old.ry;
      new.motion := 'hit';
    end if;
    return new;
  end if;

  if new.health > 0 then
    new.respawn_at := null;
  end if;
  return new;
end;
$$;

revoke all on function public.realm_member_lifecycle() from public, anon, authenticated;

drop trigger if exists realm_member_lifecycle_trigger on public.realm_world_members;
create trigger realm_member_lifecycle_trigger
before update on public.realm_world_members
for each row execute function public.realm_member_lifecycle();
