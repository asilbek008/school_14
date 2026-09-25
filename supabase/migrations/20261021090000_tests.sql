-- Tests for pupils: subject and topic tests, and a question bank for DTM-style mock exams (the
-- university entrance test: 3 compulsory subjects × 10 questions + two main subjects × 30).
-- Pupils take tests without an account; their results stay in their own browser. The correct
-- answer and its explanation are not readable by visitors: anon can select only the other
-- columns, and gets the answers for questions it already answered through public.test_answers().

create table public.tests (
  id bigint generated always as identity primary key,
  title_uz text not null,
  title_ru text,
  title_en text,
  description_uz text,
  description_ru text,
  description_en text,
  subject text not null check (subject in (
    'ona_tili', 'matematika', 'tarix', 'fizika', 'kimyo', 'biologiya', 'geografiya', 'ingliz', 'rus', 'informatika', 'huquq', 'boshqa'
  )),
  -- 'mavzu': a subject or topic test; 'dtm': also part of the subject's DTM question bank.
  kind text not null default 'mavzu' check (kind in ('mavzu', 'dtm')),
  grade smallint check (grade between 1 and 11),
  -- Minutes; empty = no time limit.
  time_limit smallint check (time_limit between 1 and 300),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tests_updated_at before update on public.tests
  for each row execute function public.set_updated_at();

alter table public.tests enable row level security;
create policy "read published tests" on public.tests
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert tests" on public.tests
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update tests" on public.tests
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete tests" on public.tests
  for delete to authenticated using ((select private.is_admin()));

create index tests_subject_idx on public.tests (subject, kind);

create table public.test_questions (
  id bigint generated always as identity primary key,
  test_id bigint not null references public.tests (id) on delete cascade,
  question text not null check (char_length(question) between 1 and 4000),
  options text[] not null check (cardinality(options) between 2 and 6),
  -- Index into options, from 0.
  correct smallint not null check (correct >= 0 and correct < cardinality(options)),
  explanation text,
  image text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.test_questions enable row level security;
-- Visible when the test is (its own policy hides unpublished tests from visitors).
create policy "read questions of visible tests" on public.test_questions
  for select to anon, authenticated using (exists (select 1 from public.tests t where t.id = test_id));
create policy "admins insert questions" on public.test_questions
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update questions" on public.test_questions
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete questions" on public.test_questions
  for delete to authenticated using ((select private.is_admin()));

create index test_questions_test_idx on public.test_questions (test_id, sort_order);

-- Visitors read everything but the answer and its explanation.
revoke select on public.test_questions from anon;
grant select (id, test_id, question, options, image, sort_order, created_at) on public.test_questions to anon;

-- The answers to the questions a pupil has just answered (at most one mock exam's worth per call).
create function private.test_answers(p_ids bigint[])
returns table (id bigint, correct smallint, explanation text)
language sql
stable
security definer
set search_path = ''
as $$
  select q.id, q.correct, q.explanation
  from public.test_questions q
  join public.tests t on t.id = q.test_id
  where q.id = any (p_ids[1:200]) and t.is_published;
$$;
revoke all on function private.test_answers(bigint[]) from public;
grant execute on function private.test_answers(bigint[]) to anon, authenticated;

create function public.test_answers(p_ids bigint[])
returns table (id bigint, correct smallint, explanation text)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.test_answers(p_ids);
$$;

-- A random draw from a subject's DTM bank, for the mock exam (answers not included).
create function public.random_test_questions(p_subject text, p_count integer)
returns table (id bigint, test_id bigint, question text, options text[], image text)
language sql
volatile
security invoker
set search_path = ''
as $$
  select q.id, q.test_id, q.question, q.options, q.image
  from public.test_questions q
  join public.tests t on t.id = q.test_id
  where t.subject = p_subject and t.kind = 'dtm' and t.is_published
  order by random()
  limit least(greatest(p_count, 0), 100);
$$;

create trigger tests_audit after insert or update or delete on public.tests
  for each row execute function private.log_change();
