drop function if exists public.is_rally_admin();
drop policy if exists "rally admins read appeals" on public.rally_appeals;
drop policy if exists "rally admins read sanctions" on public.rally_sanctions;
drop policy if exists "rally admins read runs" on public.rally_runs;
drop policy if exists "rally admins read audit" on public.rally_admin_audit;
drop function if exists private.is_rally_admin(uuid);

create or replace function private.is_rally_admin()
returns boolean language sql stable security definer
set search_path = public, pg_temp
as $$ select exists(select 1 from public.admins where user_id = (select auth.uid())) $$;

revoke all on function private.is_rally_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_rally_admin() to authenticated;

create or replace function public.is_rally_admin()
returns boolean language sql stable security invoker
set search_path = public, pg_temp
as $$ select private.is_rally_admin() $$;

revoke all on function public.is_rally_admin() from public, anon;
grant execute on function public.is_rally_admin() to authenticated;

drop policy if exists "rally admins read appeals" on public.rally_appeals;
create policy "rally admins read appeals" on public.rally_appeals
for select to authenticated using (private.is_rally_admin());
drop policy if exists "rally admins read sanctions" on public.rally_sanctions;
create policy "rally admins read sanctions" on public.rally_sanctions
for select to authenticated using (private.is_rally_admin());
drop policy if exists "rally admins read runs" on public.rally_runs;
create policy "rally admins read runs" on public.rally_runs
for select to authenticated using (private.is_rally_admin());
drop policy if exists "rally admins read audit" on public.rally_admin_audit;
create policy "rally admins read audit" on public.rally_admin_audit
for select to authenticated using (private.is_rally_admin());

create or replace function public.admin_resolve_rally_appeal(p_appeal_id bigint,p_status text,p_resolution text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_admin uuid:=auth.uid(); v_sanction bigint; begin
if v_admin is null or not private.is_rally_admin() then raise exception 'admin access required'; end if;
if p_status not in ('approved','rejected') then raise exception 'invalid appeal status'; end if;
if length(trim(coalesce(p_resolution,'')))<5 then raise exception 'resolution is required'; end if;
update public.rally_appeals set status=p_status,resolution=trim(p_resolution),resolved_at=now() where id=p_appeal_id and status='pending' returning sanction_id into v_sanction;
if not found then raise exception 'pending appeal not found'; end if;
if p_status='approved' and v_sanction is not null then update public.rally_sanctions set revoked_at=coalesce(revoked_at,now()) where id=v_sanction; end if;
insert into public.rally_admin_audit(admin_user_id,action,target_type,target_id,detail) values(v_admin,'appeal_resolved','appeal',p_appeal_id::text,jsonb_build_object('status',p_status,'resolution',trim(p_resolution)));
end $$;

create or replace function public.admin_revoke_rally_sanction(p_sanction_id bigint,p_reason text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_admin uuid:=auth.uid(); begin
if v_admin is null or not private.is_rally_admin() then raise exception 'admin access required'; end if;
if length(trim(coalesce(p_reason,'')))<5 then raise exception 'reason is required'; end if;
update public.rally_sanctions set revoked_at=coalesce(revoked_at,now()) where id=p_sanction_id and revoked_at is null;
if not found then raise exception 'active sanction not found'; end if;
insert into public.rally_admin_audit(admin_user_id,action,target_type,target_id,detail) values(v_admin,'sanction_revoked','sanction',p_sanction_id::text,jsonb_build_object('reason',trim(p_reason)));
end $$;

create or replace function public.admin_schedule_rally_season(p_id text,p_title text,p_starts_at timestamptz,p_ends_at timestamptz,p_daily_run_limit integer default 5)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_admin uuid:=auth.uid(); begin
if v_admin is null or not private.is_rally_admin() then raise exception 'admin access required'; end if;
if p_id!~'^S[0-9]{2,}$' or length(trim(p_title))<2 or p_ends_at<=p_starts_at or p_daily_run_limit not between 1 and 20 then raise exception 'invalid season schedule'; end if;
insert into public.rally_seasons(id,title,status,starts_at,ends_at,daily_run_limit) values(upper(p_id),trim(p_title),'scheduled',p_starts_at,p_ends_at,p_daily_run_limit)
on conflict(id) do update set title=excluded.title,starts_at=excluded.starts_at,ends_at=excluded.ends_at,daily_run_limit=excluded.daily_run_limit where rally_seasons.status='scheduled';
insert into public.rally_admin_audit(admin_user_id,action,target_type,target_id,detail) values(v_admin,'season_scheduled','season',upper(p_id),jsonb_build_object('starts_at',p_starts_at,'ends_at',p_ends_at,'daily_run_limit',p_daily_run_limit));
end $$;

create or replace function public.admin_settle_rally_season(p_next_id text,p_next_title text,p_starts_at timestamptz,p_ends_at timestamptz)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_admin uuid:=auth.uid(); v_current text; begin
if v_admin is null or not private.is_rally_admin() then raise exception 'admin access required'; end if;
select id into v_current from public.rally_seasons where status='active';
perform public.rotate_rally_season(p_next_id,p_next_title,p_starts_at,p_ends_at);
insert into public.rally_admin_audit(admin_user_id,action,target_type,target_id,detail) values(v_admin,'season_settled','season',coalesce(v_current,'none'),jsonb_build_object('next_season',p_next_id));
end $$;
