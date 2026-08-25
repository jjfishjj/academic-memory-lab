create schema if not exists private;

create table if not exists public.rally_admin_audit (
  id bigint generated always as identity primary key,
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('appeal_resolved','sanction_revoked','season_scheduled','season_settled')),
  target_type text not null,
  target_id text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists rally_admin_audit_created_idx
on public.rally_admin_audit (created_at desc);

alter table public.rally_admin_audit enable row level security;

create or replace function private.is_rally_admin(p_user uuid default auth.uid())
returns boolean language sql stable security definer
set search_path = public, pg_temp
as $$ select exists(select 1 from public.admins where user_id = p_user) $$;

revoke all on function private.is_rally_admin(uuid) from public, anon, authenticated;

drop policy if exists "rally admins read appeals" on public.rally_appeals;
create policy "rally admins read appeals" on public.rally_appeals
for select to authenticated using (private.is_rally_admin((select auth.uid())));

drop policy if exists "rally admins read sanctions" on public.rally_sanctions;
create policy "rally admins read sanctions" on public.rally_sanctions
for select to authenticated using (private.is_rally_admin((select auth.uid())));

drop policy if exists "rally admins read runs" on public.rally_runs;
create policy "rally admins read runs" on public.rally_runs
for select to authenticated using (private.is_rally_admin((select auth.uid())));

drop policy if exists "rally admins read audit" on public.rally_admin_audit;
create policy "rally admins read audit" on public.rally_admin_audit
for select to authenticated using (private.is_rally_admin((select auth.uid())));

grant select on public.rally_admin_audit to authenticated;

create or replace function public.is_rally_admin()
returns boolean language sql stable security invoker
set search_path = public, pg_temp
as $$ select private.is_rally_admin((select auth.uid())) $$;

create or replace function public.admin_resolve_rally_appeal(
  p_appeal_id bigint, p_status text, p_resolution text
) returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_admin uuid := auth.uid(); v_sanction bigint;
begin
  if v_admin is null or not private.is_rally_admin(v_admin) then raise exception 'admin access required'; end if;
  if p_status not in ('approved','rejected') then raise exception 'invalid appeal status'; end if;
  if length(trim(coalesce(p_resolution,''))) < 5 then raise exception 'resolution is required'; end if;
  update public.rally_appeals set status=p_status, resolution=trim(p_resolution), resolved_at=now()
  where id=p_appeal_id and status='pending' returning sanction_id into v_sanction;
  if not found then raise exception 'pending appeal not found'; end if;
  if p_status='approved' and v_sanction is not null then
    update public.rally_sanctions set revoked_at=coalesce(revoked_at,now()) where id=v_sanction;
  end if;
  insert into public.rally_admin_audit(admin_user_id,action,target_type,target_id,detail)
  values(v_admin,'appeal_resolved','appeal',p_appeal_id::text,jsonb_build_object('status',p_status,'resolution',trim(p_resolution)));
end $$;

create or replace function public.admin_revoke_rally_sanction(
  p_sanction_id bigint, p_reason text
) returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_admin uuid := auth.uid();
begin
  if v_admin is null or not private.is_rally_admin(v_admin) then raise exception 'admin access required'; end if;
  if length(trim(coalesce(p_reason,''))) < 5 then raise exception 'reason is required'; end if;
  update public.rally_sanctions set revoked_at=coalesce(revoked_at,now()) where id=p_sanction_id and revoked_at is null;
  if not found then raise exception 'active sanction not found'; end if;
  insert into public.rally_admin_audit(admin_user_id,action,target_type,target_id,detail)
  values(v_admin,'sanction_revoked','sanction',p_sanction_id::text,jsonb_build_object('reason',trim(p_reason)));
end $$;

create or replace function public.admin_schedule_rally_season(
  p_id text, p_title text, p_starts_at timestamptz, p_ends_at timestamptz, p_daily_run_limit integer default 5
) returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_admin uuid := auth.uid();
begin
  if v_admin is null or not private.is_rally_admin(v_admin) then raise exception 'admin access required'; end if;
  if p_id !~ '^S[0-9]{2,}$' or length(trim(p_title)) < 2 or p_ends_at <= p_starts_at or p_daily_run_limit not between 1 and 20 then
    raise exception 'invalid season schedule';
  end if;
  insert into public.rally_seasons(id,title,status,starts_at,ends_at,daily_run_limit)
  values(upper(p_id),trim(p_title),'scheduled',p_starts_at,p_ends_at,p_daily_run_limit)
  on conflict(id) do update set title=excluded.title,starts_at=excluded.starts_at,ends_at=excluded.ends_at,daily_run_limit=excluded.daily_run_limit
  where rally_seasons.status='scheduled';
  insert into public.rally_admin_audit(admin_user_id,action,target_type,target_id,detail)
  values(v_admin,'season_scheduled','season',upper(p_id),jsonb_build_object('starts_at',p_starts_at,'ends_at',p_ends_at,'daily_run_limit',p_daily_run_limit));
end $$;

create or replace function public.admin_settle_rally_season(
  p_next_id text, p_next_title text, p_starts_at timestamptz, p_ends_at timestamptz
) returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_admin uuid := auth.uid(); v_current text;
begin
  if v_admin is null or not private.is_rally_admin(v_admin) then raise exception 'admin access required'; end if;
  select id into v_current from public.rally_seasons where status='active';
  perform public.rotate_rally_season(p_next_id,p_next_title,p_starts_at,p_ends_at);
  insert into public.rally_admin_audit(admin_user_id,action,target_type,target_id,detail)
  values(v_admin,'season_settled','season',coalesce(v_current,'none'),jsonb_build_object('next_season',p_next_id));
end $$;

revoke all on function public.is_rally_admin() from public,anon;
revoke all on function public.admin_resolve_rally_appeal(bigint,text,text) from public,anon;
revoke all on function public.admin_revoke_rally_sanction(bigint,text) from public,anon;
revoke all on function public.admin_schedule_rally_season(text,text,timestamptz,timestamptz,integer) from public,anon;
revoke all on function public.admin_settle_rally_season(text,text,timestamptz,timestamptz) from public,anon;
grant execute on function public.is_rally_admin() to authenticated;
grant execute on function public.admin_resolve_rally_appeal(bigint,text,text) to authenticated;
grant execute on function public.admin_revoke_rally_sanction(bigint,text) to authenticated;
grant execute on function public.admin_schedule_rally_season(text,text,timestamptz,timestamptz,integer) to authenticated;
grant execute on function public.admin_settle_rally_season(text,text,timestamptz,timestamptz) to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='rally_admin_audit') then
    alter publication supabase_realtime add table public.rally_admin_audit;
  end if;
end $$;
