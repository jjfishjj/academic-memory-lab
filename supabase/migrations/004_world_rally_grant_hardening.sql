-- Existing Supabase projects may retain permissive default grants on new public tables.
-- Keep the Data API surface minimal and let RLS decide which rows are accessible.
revoke all privileges on table public.rally_profiles from anon, authenticated;
revoke all privileges on table public.rally_runs from anon, authenticated;
revoke all privileges on sequence public.rally_runs_id_seq from anon, authenticated;

grant select, insert, update on table public.rally_profiles to authenticated;
grant select on table public.rally_runs to anon, authenticated;
grant insert on table public.rally_runs to authenticated;
grant usage, select on sequence public.rally_runs_id_seq to authenticated;
