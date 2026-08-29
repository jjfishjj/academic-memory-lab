create index if not exists rally_learning_progress_question_idx
on public.rally_learning_progress (question_id);

create index if not exists rally_learning_attempts_question_idx
on public.rally_learning_attempts (question_id);

create index if not exists rally_questions_created_by_idx
on public.rally_questions (created_by)
where created_by is not null;

create index if not exists rally_questions_reviewed_by_idx
on public.rally_questions (reviewed_by)
where reviewed_by is not null;
