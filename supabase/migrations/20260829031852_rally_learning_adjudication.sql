create table if not exists public.rally_questions (
  id text primary key check (id ~ '^[a-z0-9-]{3,80}$'),
  map_id text not null check (map_id in ('taipei','paris','tokyo')),
  question_type text not null check (question_type in ('listening','translation','cloze','diplomacy','confusable')),
  cefr text not null check (cefr in ('A1','A2','B1','B2','C1')),
  phrase text not null check (char_length(phrase) between 1 and 240),
  prompt text not null check (char_length(prompt) between 1 and 300),
  answers jsonb not null check (jsonb_typeof(answers)='array' and jsonb_array_length(answers) between 2 and 4),
  correct_index smallint not null default 0 check (
    correct_index between 0 and 3 and correct_index < jsonb_array_length(answers)
  ),
  memory_hint text not null default '' check (char_length(memory_hint) <= 500),
  active boolean not null default false,
  approved boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rally_questions_pool_idx
on public.rally_questions (map_id, active, approved, cefr);

alter table public.rally_questions enable row level security;
revoke all on table public.rally_questions from anon, authenticated;
grant select on table public.rally_questions to authenticated;

drop policy if exists "rally admins read question bank" on public.rally_questions;
create policy "rally admins read question bank" on public.rally_questions
for select to authenticated using ((select private.is_rally_admin()));

alter table public.rally_admin_audit
  drop constraint if exists rally_admin_audit_action_check;
alter table public.rally_admin_audit
  add constraint rally_admin_audit_action_check check (
    action in (
      'appeal_resolved','sanction_revoked','season_scheduled','season_settled',
      'question_upserted','question_reviewed'
    )
  );

create table if not exists public.rally_learning_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.rally_questions(id) on delete cascade,
  seen_count integer not null default 0 check (seen_count >= 0),
  correct_count integer not null default 0 check (correct_count between 0 and seen_count),
  stage smallint not null default 0 check (stage between 0 and 4),
  lapses integer not null default 0 check (lapses >= 0),
  avg_response_ms integer not null default 0 check (avg_response_ms >= 0),
  next_due_at timestamptz not null default now(),
  last_answered_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists rally_learning_due_idx
on public.rally_learning_progress (user_id, next_due_at);

alter table public.rally_learning_progress enable row level security;
revoke all on table public.rally_learning_progress from anon, authenticated;
grant select on table public.rally_learning_progress to authenticated;
create policy "players read own rally learning progress"
on public.rally_learning_progress for select to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.rally_learning_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ticket uuid not null,
  question_id text not null references public.rally_questions(id) on delete restrict,
  selected_index smallint not null check (selected_index between -1 and 3),
  is_correct boolean not null,
  response_ms integer not null check (response_ms between 250 and 30000),
  bonus_points integer not null default 0 check (bonus_points between 0 and 500),
  answered_at timestamptz not null default clock_timestamp(),
  unique (ticket, question_id)
);

create index if not exists rally_learning_attempts_user_idx
on public.rally_learning_attempts (user_id, answered_at desc);

alter table public.rally_learning_attempts enable row level security;
revoke all on table public.rally_learning_attempts from anon, authenticated;
grant select on table public.rally_learning_attempts to authenticated;
create policy "players read own rally learning attempts"
on public.rally_learning_attempts for select to authenticated
using ((select auth.uid()) = user_id);

alter table private.rally_race_sessions
  add column if not exists question_ids text[] not null default '{}'::text[],
  add column if not exists difficulty text not null default 'review'
    check (difficulty in ('review','standard','challenge')),
  add column if not exists learning_bonus integer not null default 0
    check (learning_bonus between 0 and 1000);

insert into public.rally_questions
  (id,map_id,question_type,cefr,phrase,prompt,answers,correct_index,memory_hint,active,approved)
values
('taipei-trust','taipei','translation','A2','Resilience begins with trust.','城市韌性的起點是？','["互信","封鎖","競爭"]',0,'城市遇到風雨，人們因互相信任而一起修復。',true,true),
('taipei-common-ground','taipei','diplomacy','B1','我們求同存異。','最符合外交語境的英文是？','["We seek common ground while respecting differences.","We erase every difference.","We postpone all dialogue."]',0,'先找共同地面，再替差異保留座位。',true,true),
('taipei-listen-cooperate','taipei','listening','A2','We are ready to cooperate.','你聽到的外交意圖是？','["願意合作","拒絕會談","要求撤離"]',0,'cooperate＝共同運作。',true,true),
('taipei-cloze-dialogue','taipei','cloze','B1','Open ___ builds lasting trust.','填入最適合的字詞。','["dialogue","silence","pressure"]',0,'open dialogue 是開放對話。',true,true),
('taipei-confuse-resilient','taipei','confusable','B2','resilient / resistant','描述城市受災後恢復力，應選哪一個？','["resilient","resistant","reserved"]',0,'resilient 強調受衝擊後恢復。',true,true),
('paris-greeting','paris','translation','A2','Ravi de vous rencontrer.','正式會面時表示？','["很高興認識您","請立刻離開","我不同意"]',0,'Ravi 是高興。',true,true),
('paris-agreement','paris','diplomacy','B1','Trouver un terrain d''entente.','談判時代表什麼？','["找到共識","封鎖道路","更換代表"]',0,'雙方走到同一塊 terrain 上握手。',true,true),
('paris-listen-thanks','paris','listening','A2','Merci pour votre coopération.','對方表達了什麼？','["感謝您的合作","拒絕您的提案","請延後會議"]',0,'Merci 是謝謝。',true,true),
('paris-cloze-dialogue','paris','cloze','B1','Nous souhaitons poursuivre le ___.','填入「對話」。','["dialogue","conflit","secret"]',0,'dialogue 法文與英文拼法相同。',true,true),
('paris-confuse-entente','paris','confusable','B2','entente / attente','哪個字表示理解或協議？','["entente","attente","entrée"]',0,'entente＝協議；attente＝等待。',true,true),
('tokyo-understanding','tokyo','translation','A2','相互理解を深めましょう。','這句倡議的目標是？','["加深相互理解","中止交流","縮短會議"]',0,'兩個對話泡泡逐漸重疊。',true,true),
('tokyo-consensus','tokyo','diplomacy','B1','合意形成が重要です。','何者很重要？','["形成共識","保持沉默","單方面決定"]',0,'合意＝意見合在一起。',true,true),
('tokyo-listen-thanks','tokyo','listening','A2','ご協力ありがとうございます。','這句話的功能是？','["感謝合作","提出抗議","結束談判"]',0,'協力＝合作。',true,true),
('tokyo-cloze-dialogue','tokyo','cloze','B1','対話を___ましょう。','填入「繼續」最合適的形式。','["続け","閉じ","忘れ"]',0,'続ける＝繼續。',true,true),
('tokyo-confuse-koui','tokyo','confusable','B2','合意 / 行為','外交協商達成「共識」應使用？','["合意","行為","好意"]',0,'三者都可讀作 こうい；合意才是共識。',true,true)
on conflict (id) do update set
  map_id=excluded.map_id, question_type=excluded.question_type, cefr=excluded.cefr,
  phrase=excluded.phrase, prompt=excluded.prompt, answers=excluded.answers,
  correct_index=excluded.correct_index, memory_hint=excluded.memory_hint,
  updated_at=now();

create or replace function public.start_rally_race_v2(p_map_id text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_ticket uuid;
  v_ids text[];
  v_difficulty text;
  v_questions jsonb;
  v_answered integer;
  v_accuracy numeric;
begin
  if v_user is null then raise exception 'authentication required' using errcode='28000'; end if;
  v_ticket := public.start_rally_race(p_map_id);

  select coalesce(sum(seen_count),0),
    coalesce(sum(correct_count)::numeric/nullif(sum(seen_count),0),0)
  into v_answered,v_accuracy
  from public.rally_learning_progress p
  join public.rally_questions q on q.id=p.question_id
  where p.user_id=v_user and q.map_id=p_map_id;

  v_difficulty := case
    when v_answered>=12 and v_accuracy>=0.8 then 'challenge'
    when v_answered>=4 and v_accuracy>=0.55 then 'standard'
    else 'review' end;

  select coalesce(array_agg(s.id),'{}'::text[]) into v_ids
  from (
    select q.id
    from public.rally_questions q
    left join public.rally_learning_progress p
      on p.question_id=q.id and p.user_id=v_user
    where q.map_id=p_map_id and q.active and q.approved
      and (v_difficulty<>'review' or q.cefr in ('A1','A2','B1'))
      and (v_difficulty<>'challenge' or q.cefr in ('B1','B2','C1'))
    order by (coalesce(p.next_due_at,now())<=now()) desc,
      coalesce(p.lapses,0) desc, coalesce(p.seen_count,0), random()
    limit 2
  ) s;
  if cardinality(v_ids)<>2 then raise exception 'question pool unavailable' using errcode='22023'; end if;

  update private.rally_race_sessions
  set question_ids=v_ids,difficulty=v_difficulty
  where ticket=v_ticket and user_id=v_user;

  select jsonb_agg(jsonb_build_object(
    'id',q.id,'type',q.question_type,'cefr',q.cefr,'phrase',q.phrase,
    'prompt',q.prompt,'answers',q.answers
  ) order by array_position(v_ids,q.id)) into v_questions
  from public.rally_questions q where q.id=any(v_ids);

  return jsonb_build_object('ticket',v_ticket,'difficulty',v_difficulty,'questions',v_questions);
end $$;

create or replace function public.submit_rally_answer(
  p_ticket uuid,p_question_id text,p_selected_index integer,p_response_ms integer
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_owner uuid; v_used timestamptz; v_ids text[]; v_difficulty text;
  v_correct_index integer; v_correct boolean; v_bonus integer:=0; v_position integer;
  v_memory text; v_stage integer:=0; v_seen integer:=0; v_correct_count integer:=0;
  v_lapses integer:=0; v_avg integer:=0; v_new_stage integer; v_due timestamptz;
begin
  if v_user is null then raise exception 'authentication required' using errcode='28000'; end if;
  if p_selected_index not between -1 and 3 or p_response_ms not between 250 and 30000 then
    raise exception 'invalid answer telemetry' using errcode='22023';
  end if;
  select user_id,used_at,question_ids,difficulty into v_owner,v_used,v_ids,v_difficulty
  from private.rally_race_sessions where ticket=p_ticket for update;
  if not found or v_owner<>v_user then raise exception 'invalid race ticket' using errcode='42501'; end if;
  if v_used is not null then raise exception 'race ticket already used' using errcode='22023'; end if;
  v_position:=array_position(v_ids,p_question_id);
  if v_position is null then raise exception 'question not assigned to ticket' using errcode='42501'; end if;
  select correct_index,memory_hint into v_correct_index,v_memory
  from public.rally_questions where id=p_question_id and active and approved;
  if not found then raise exception 'question unavailable' using errcode='22023'; end if;
  v_correct:=p_selected_index=v_correct_index;
  if v_correct and v_difficulty='challenge' then v_bonus:=case when v_position=1 then 75 else 125 end; end if;

  insert into public.rally_learning_attempts
    (user_id,ticket,question_id,selected_index,is_correct,response_ms,bonus_points)
  values(v_user,p_ticket,p_question_id,p_selected_index,v_correct,p_response_ms,v_bonus);

  select stage,seen_count,correct_count,lapses,avg_response_ms
  into v_stage,v_seen,v_correct_count,v_lapses,v_avg
  from public.rally_learning_progress
  where user_id=v_user and question_id=p_question_id for update;
  if not found then v_stage:=0;v_seen:=0;v_correct_count:=0;v_lapses:=0;v_avg:=0; end if;
  v_new_stage:=case when v_correct then least(4,v_stage+1) else 0 end;
  v_due:=clock_timestamp()+case
    when not v_correct then interval '0 days'
    when v_new_stage=1 then interval '1 day'
    when v_new_stage=2 then interval '3 days'
    when v_new_stage=3 then interval '7 days'
    else interval '14 days' end;

  insert into public.rally_learning_progress
    (user_id,question_id,seen_count,correct_count,stage,lapses,avg_response_ms,next_due_at,last_answered_at,updated_at)
  values(v_user,p_question_id,v_seen+1,v_correct_count+(v_correct::integer),v_new_stage,
    v_lapses+((not v_correct)::integer),
    case when v_seen=0 then p_response_ms else round(v_avg*0.7+p_response_ms*0.3) end,
    v_due,clock_timestamp(),clock_timestamp())
  on conflict(user_id,question_id) do update set
    seen_count=excluded.seen_count,correct_count=excluded.correct_count,stage=excluded.stage,
    lapses=excluded.lapses,avg_response_ms=excluded.avg_response_ms,
    next_due_at=excluded.next_due_at,last_answered_at=excluded.last_answered_at,updated_at=excluded.updated_at;

  update private.rally_race_sessions set learning_bonus=learning_bonus+v_bonus where ticket=p_ticket;
  return jsonb_build_object('correct',v_correct,'correctIndex',v_correct_index,
    'bonus',v_bonus,'nextDueAt',v_due,'memory',v_memory);
exception when unique_violation then
  raise exception 'question already answered' using errcode='23505';
end $$;

create or replace function public.finish_rally_race_v2(
  p_ticket uuid,p_display_name text,p_rank integer,p_ghost_path jsonb
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid()); v_expected integer; v_actual integer;
  v_bonus integer; v_run bigint; v_score integer;
begin
  if v_user is null then raise exception 'authentication required' using errcode='28000'; end if;
  select cardinality(question_ids),learning_bonus into v_expected,v_bonus
  from private.rally_race_sessions where ticket=p_ticket and user_id=v_user and used_at is null for update;
  if not found then raise exception 'invalid race ticket' using errcode='42501'; end if;
  select count(*) into v_actual from public.rally_learning_attempts where ticket=p_ticket and user_id=v_user;
  if v_expected<>2 or v_actual<>v_expected then raise exception 'all assigned questions must be answered' using errcode='22023'; end if;
  v_run:=public.finish_rally_race(p_ticket,p_display_name,p_rank,p_ghost_path);
  update public.rally_runs set score=least(1000000,score+v_bonus)
  where id=v_run and user_id=v_user returning score into v_score;
  return jsonb_build_object('runId',v_run,'score',v_score,'learningBonus',v_bonus);
end $$;

create or replace function public.save_rally_profile_v2(
  p_display_name text,p_profile jsonb,p_story_state jsonb,p_expected_updated_at timestamptz default null
) returns timestamptz language plpgsql security invoker set search_path=''
as $$
declare v_user uuid:=(select auth.uid()); v_updated timestamptz:=clock_timestamp();
begin
  if v_user is null then raise exception 'authentication required' using errcode='28000'; end if;
  if char_length(trim(p_display_name)) not between 1 and 24 then raise exception 'invalid display name' using errcode='22023'; end if;
  if p_expected_updated_at is null then
    insert into public.rally_profiles(user_id,display_name,profile,story_state,updated_at)
    values(v_user,trim(p_display_name),p_profile,p_story_state,v_updated)
    on conflict(user_id) do nothing;
    if found then return v_updated; end if;
    raise exception 'cloud profile conflict; download latest data first' using errcode='40001';
  end if;
  update public.rally_profiles set display_name=trim(p_display_name),profile=p_profile,
    story_state=p_story_state,updated_at=v_updated
  where user_id=v_user and updated_at=p_expected_updated_at returning updated_at into v_updated;
  if not found then raise exception 'cloud profile conflict; download latest data first' using errcode='40001'; end if;
  return v_updated;
end $$;

create or replace function public.admin_upsert_rally_question(
  p_id text,p_map_id text,p_question_type text,p_cefr text,p_phrase text,p_prompt text,
  p_answers jsonb,p_correct_index integer,p_memory_hint text
) returns void language plpgsql security definer set search_path=''
as $$ declare v_admin uuid:=(select auth.uid()); begin
  if v_admin is null or not (select private.is_rally_admin()) then raise exception 'admin access required' using errcode='42501'; end if;
  insert into public.rally_questions(id,map_id,question_type,cefr,phrase,prompt,answers,correct_index,memory_hint,created_by,active,approved,updated_at)
  values(lower(trim(p_id)),p_map_id,p_question_type,p_cefr,trim(p_phrase),trim(p_prompt),p_answers,p_correct_index,trim(coalesce(p_memory_hint,'')),v_admin,false,false,clock_timestamp())
  on conflict(id) do update set map_id=excluded.map_id,question_type=excluded.question_type,cefr=excluded.cefr,
    phrase=excluded.phrase,prompt=excluded.prompt,answers=excluded.answers,correct_index=excluded.correct_index,
    memory_hint=excluded.memory_hint,approved=false,active=false,reviewed_by=null,reviewed_at=null,updated_at=clock_timestamp();
  insert into public.rally_admin_audit(admin_user_id,action,target_type,target_id,detail)
  values(v_admin,'question_upserted','question',lower(trim(p_id)),
    jsonb_build_object('map_id',p_map_id,'question_type',p_question_type,'cefr',p_cefr));
end $$;

create or replace function public.admin_review_rally_question(p_id text,p_approved boolean,p_active boolean)
returns void language plpgsql security definer set search_path=''
as $$ declare v_admin uuid:=(select auth.uid()); begin
  if v_admin is null or not (select private.is_rally_admin()) then raise exception 'admin access required' using errcode='42501'; end if;
  update public.rally_questions set approved=p_approved,active=(p_active and p_approved),
    reviewed_by=v_admin,reviewed_at=clock_timestamp(),updated_at=clock_timestamp() where id=p_id;
  if not found then raise exception 'question not found' using errcode='P0002'; end if;
  insert into public.rally_admin_audit(admin_user_id,action,target_type,target_id,detail)
  values(v_admin,'question_reviewed','question',p_id,
    jsonb_build_object('approved',p_approved,'active',(p_active and p_approved)));
end $$;

revoke all on function public.start_rally_race_v2(text) from public,anon;
revoke all on function public.submit_rally_answer(uuid,text,integer,integer) from public,anon;
revoke all on function public.finish_rally_race_v2(uuid,text,integer,jsonb) from public,anon;
revoke all on function public.save_rally_profile_v2(text,jsonb,jsonb,timestamptz) from public,anon;
revoke all on function public.admin_upsert_rally_question(text,text,text,text,text,text,jsonb,integer,text) from public,anon;
revoke all on function public.admin_review_rally_question(text,boolean,boolean) from public,anon;
grant execute on function public.start_rally_race_v2(text) to authenticated;
grant execute on function public.submit_rally_answer(uuid,text,integer,integer) to authenticated;
grant execute on function public.finish_rally_race_v2(uuid,text,integer,jsonb) to authenticated;
grant execute on function public.save_rally_profile_v2(text,jsonb,jsonb,timestamptz) to authenticated;
grant execute on function public.admin_upsert_rally_question(text,text,text,text,text,text,jsonb,integer,text) to authenticated;
grant execute on function public.admin_review_rally_question(text,boolean,boolean) to authenticated;
