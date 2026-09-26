-- The question bank (owner's request): every question can carry a topic ("Kasrlar", "Mexanika" …) and a difficulty
-- (1 easy, 2 medium, 3 hard). The site offers practice from a subject's whole bank — every published test of the
-- subject, regular and DTM alike — optionally one topic; the admin panel shows the bank by subject and topic.

alter table public.test_questions
  add column topic text check (topic is null or char_length(topic) between 1 and 80),
  add column difficulty smallint check (difficulty between 1 and 3);

create index test_questions_topic_idx on public.test_questions (topic);

-- Visitors see the topic and the difficulty (not the answer).
grant select (topic, difficulty) on public.test_questions to anon;

-- A random draw from a subject's bank for practice (answers not included), optionally one topic.
create function public.random_bank_questions(p_subject text, p_count integer, p_topic text default null)
returns table (id bigint, test_id bigint, question text, options text[], image text)
language sql
volatile
security invoker
set search_path = ''
as $$
  select q.id, q.test_id, q.question, q.options, q.image
  from public.test_questions q
  join public.tests t on t.id = q.test_id
  where t.subject = p_subject and t.is_published and (p_topic is null or q.topic = p_topic)
  order by random()
  limit least(greatest(p_count, 0), 50);
$$;

revoke all on function public.random_bank_questions(text, integer, text) from public;
grant execute on function public.random_bank_questions(text, integer, text) to anon, authenticated;

-- The bank at a glance for the site: questions per subject, kind and topic (published tests only).
create function public.question_bank_stats()
returns table (subject text, kind text, topic text, questions bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.subject, t.kind, q.topic, count(*)
  from public.test_questions q
  join public.tests t on t.id = q.test_id
  where t.is_published
  group by t.subject, t.kind, q.topic;
$$;

revoke all on function public.question_bank_stats() from public;
grant execute on function public.question_bank_stats() to anon, authenticated;
