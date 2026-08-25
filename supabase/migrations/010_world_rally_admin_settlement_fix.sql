create or replace function public.admin_settle_rally_season(
  p_next_id text,p_next_title text,p_starts_at timestamptz,p_ends_at timestamptz
) returns void language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_admin uuid:=auth.uid(); v_current text;
begin
  if v_admin is null or not private.is_rally_admin() then raise exception 'admin access required'; end if;
  if p_next_id!~'^S[0-9]{2,}$' or length(trim(p_next_title))<2 or p_ends_at<=p_starts_at then
    raise exception 'invalid next season';
  end if;
  select id into v_current from public.rally_seasons where status='active';
  if v_current is null then raise exception 'no active season'; end if;
  delete from public.rally_seasons where id=upper(p_next_id) and status='scheduled';
  perform public.rotate_rally_season(upper(p_next_id),trim(p_next_title),p_starts_at,p_ends_at);
  insert into public.rally_admin_audit(admin_user_id,action,target_type,target_id,detail)
  values(v_admin,'season_settled','season',v_current,jsonb_build_object('next_season',upper(p_next_id)));
end $$;

revoke all on function public.admin_settle_rally_season(text,text,timestamptz,timestamptz) from public,anon;
grant execute on function public.admin_settle_rally_season(text,text,timestamptz,timestamptz) to authenticated;
