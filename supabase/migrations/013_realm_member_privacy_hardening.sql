-- Member identities are internal to the authoritative state machine.
-- The client receives only the active count from RPC and player pose broadcasts.

drop policy if exists "realm members are readable" on public.realm_world_members;
revoke all privileges on table public.realm_world_members from anon, authenticated;
