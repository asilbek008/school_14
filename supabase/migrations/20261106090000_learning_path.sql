-- "O‘quv yo‘li" (owner's request, after comparing UzExam, MockCenter, BirPrep …): a subject's topics from easy to
-- hard, a short lesson for each topic, practice per topic, and the pupil's own progress (kept in the browser).
-- Also: anonymous per-question answer counts, so the admin sees which questions are answered wrong most often.

-- The bank's topics now come with their average difficulty (the path orders topics by it), and the random draws
-- return each question's topic (the browser tallies results per topic).
drop function public.question_bank_stats();
create function public.question_bank_stats()
returns table (subject text, kind text, topic text, questions bigint, difficulty numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.subject, t.kind, q.topic, count(*), round(avg(q.difficulty), 2)
  from public.test_questions q
  join public.tests t on t.id = q.test_id
  where t.is_published
  group by t.subject, t.kind, q.topic;
$$;
revoke all on function public.question_bank_stats() from public;
grant execute on function public.question_bank_stats() to anon, authenticated;

drop function public.random_bank_questions(text, integer, text);
create function public.random_bank_questions(p_subject text, p_count integer, p_topic text default null)
returns table (id bigint, test_id bigint, question text, options text[], image text, topic text)
language sql
volatile
security invoker
set search_path = ''
as $$
  select q.id, q.test_id, q.question, q.options, q.image, q.topic
  from public.test_questions q
  join public.tests t on t.id = q.test_id
  where t.subject = p_subject and t.is_published and (p_topic is null or q.topic = p_topic)
  order by random()
  limit least(greatest(p_count, 0), 50);
$$;
revoke all on function public.random_bank_questions(text, integer, text) from public;
grant execute on function public.random_bank_questions(text, integer, text) to anon, authenticated;

drop function public.random_test_questions(text, integer);
create function public.random_test_questions(p_subject text, p_count integer)
returns table (id bigint, test_id bigint, question text, options text[], image text, topic text)
language sql
volatile
security invoker
set search_path = ''
as $$
  select q.id, q.test_id, q.question, q.options, q.image, q.topic
  from public.test_questions q
  join public.tests t on t.id = q.test_id
  where t.subject = p_subject and t.kind = 'dtm' and t.is_published
  order by random()
  limit least(greatest(p_count, 0), 100);
$$;
revoke all on function public.random_test_questions(text, integer) from public;
grant execute on function public.random_test_questions(text, integer) to anon, authenticated;

-- A short lesson per topic: the rule, a worked example, the usual mistake. Plain text like the rest of the site.
create table public.study_notes (
  id bigint generated always as identity primary key,
  subject text not null check (char_length(subject) between 2 and 30),
  topic text not null check (char_length(topic) between 1 and 80),
  body_uz text not null check (char_length(body_uz) between 1 and 6000),
  body_ru text check (char_length(body_ru) <= 6000),
  body_en text check (char_length(body_en) <= 6000),
  is_published boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (subject, topic)
);

alter table public.study_notes enable row level security;
create policy "read published notes" on public.study_notes
  for select to anon, authenticated using (is_published or (select private.is_editor()));
create policy "editors insert notes" on public.study_notes
  for insert to authenticated with check ((select private.is_editor()));
create policy "editors update notes" on public.study_notes
  for update to authenticated using ((select private.is_editor())) with check ((select private.is_editor()));
create policy "editors delete notes" on public.study_notes
  for delete to authenticated using ((select private.is_editor()));

create trigger study_notes_audit after insert or update or delete on public.study_notes
  for each row execute function private.log_change();

-- How often each question is answered, and answered right (no one's identity: just two counters).
create table public.question_stats (
  question_id bigint primary key references public.test_questions (id) on delete cascade,
  attempts integer not null default 0,
  correct integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.question_stats enable row level security;
create policy "editors read question stats" on public.question_stats
  for select to authenticated using ((select private.is_editor()));

-- A finished attempt reports its answered questions (100 at most; only questions of published tests count).
create function private.record_answers(p_ids bigint[], p_right boolean[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(array_length(p_ids, 1), 0) = 0 or array_length(p_ids, 1) > 100
     or array_length(p_ids, 1) <> coalesce(array_length(p_right, 1), 0) then
    return;
  end if;
  insert into public.question_stats as s (question_id, attempts, correct)
  select a.id, 1, case when a.ok then 1 else 0 end
  from (select distinct on (id) id, ok from unnest(p_ids, p_right) as u(id, ok)) a
  join public.test_questions q on q.id = a.id
  join public.tests t on t.id = q.test_id and t.is_published
  on conflict (question_id) do update
    set attempts = s.attempts + 1, correct = s.correct + excluded.correct, updated_at = now();
end;
$$;
revoke all on function private.record_answers(bigint[], boolean[]) from public;
grant execute on function private.record_answers(bigint[], boolean[]) to anon, authenticated;

create function public.record_answers(p_ids bigint[], p_right boolean[])
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.record_answers(p_ids, p_right);
$$;
revoke all on function public.record_answers(bigint[], boolean[]) from public;
grant execute on function public.record_answers(bigint[], boolean[]) to anon, authenticated;
