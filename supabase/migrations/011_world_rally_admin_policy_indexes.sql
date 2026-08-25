create index if not exists rally_admin_audit_admin_idx
on public.rally_admin_audit (admin_user_id, created_at desc);

drop policy if exists "rally admins read runs" on public.rally_runs;

drop policy if exists "players read own appeals" on public.rally_appeals;
drop policy if exists "rally admins read appeals" on public.rally_appeals;
create policy "players or admins read appeals" on public.rally_appeals
for select to authenticated
using ((select auth.uid()) = user_id or private.is_rally_admin());

drop policy if exists "players read own sanctions" on public.rally_sanctions;
drop policy if exists "rally admins read sanctions" on public.rally_sanctions;
create policy "players or admins read sanctions" on public.rally_sanctions
for select to authenticated
using ((select auth.uid()) = user_id or private.is_rally_admin());
