-- Anonymous surveys (owner's request): the school asks parents and pupils a few questions, the answers are
-- kept without any name, IP or account — only the answers themselves and when they came. Everyone may
-- answer an open survey; only staff may read the results.

create table public.surveys (
  id bigint generated always as identity primary key,
  title_uz text not null,
  title_ru text,
  title_en text,
  description_uz text,
  description_ru text,
  description_en text,
  /** Who it is for; shown as a label, not a check (nobody signs in). */
  audience text not null default 'hamma' check (audience in ('hamma', 'ota-ona', 'oquvchi', 'oqituvchi')),
  closes_at timestamptz,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger surveys_updated_at before update on public.surveys
  for each row execute function public.set_updated_at();

create table public.survey_questions (
  id bigint generated always as identity primary key,
  survey_id bigint not null references public.surveys (id) on delete cascade,
  question_uz text not null,
  question_ru text,
  question_en text,
  /** single — one option, multi — several, scale — 1..5, text — a few sentences. */
  kind text not null default 'single' check (kind in ('single', 'multi', 'scale', 'text')),
  options_uz text[] not null default '{}',
  options_ru text[] not null default '{}',
  options_en text[] not null default '{}',
  required boolean not null default true,
  sort_order integer not null default 0
);
create index survey_questions_survey_idx on public.survey_questions (survey_id, sort_order);

-- One row per filled-in form: {"<question_id>": 2 | [0,3] | "matn"}.
create table public.survey_responses (
  id bigint generated always as identity primary key,
  survey_id bigint not null references public.surveys (id) on delete cascade,
  answers jsonb not null,
  created_at timestamptz not null default now()
);
create index survey_responses_survey_idx on public.survey_responses (survey_id, created_at desc);

alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_responses enable row level security;

create policy "read open surveys" on public.surveys
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert surveys" on public.surveys
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update surveys" on public.surveys
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete surveys" on public.surveys
  for delete to authenticated using ((select private.is_admin()));

-- Questions follow their survey, like gallery photos follow their album.
create policy "read questions of visible surveys" on public.survey_questions
  for select to anon, authenticated using (exists (select 1 from public.surveys s where s.id = survey_id));
create policy "admins insert survey questions" on public.survey_questions
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update survey questions" on public.survey_questions
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete survey questions" on public.survey_questions
  for delete to authenticated using ((select private.is_admin()));

-- Anyone may answer an open survey; nobody but staff may read the answers.
create policy "anyone answers an open survey" on public.survey_responses
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.surveys s
      where s.id = survey_id and s.is_published and (s.closes_at is null or s.closes_at > now())
    )
  );
create policy "admins read responses" on public.survey_responses
  for select to authenticated using ((select private.is_admin()));
create policy "admins delete responses" on public.survey_responses
  for delete to authenticated using ((select private.is_admin()));

-- Server time, and a cap so nobody can stuff the box (100 per survey in 10 minutes, 500 in an hour).
create function private.survey_rate_limit() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_at := now();
  if (select count(*) from public.survey_responses r
      where r.survey_id = new.survey_id and r.created_at > now() - interval '10 minutes') >= 100
     or (select count(*) from public.survey_responses r where r.created_at > now() - interval '1 hour') >= 500 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger survey_responses_guard before insert on public.survey_responses
  for each row execute function private.survey_rate_limit();

create trigger surveys_audit after insert or update or delete on public.surveys
  for each row execute function private.log_change();
create trigger survey_questions_audit after insert or update or delete on public.survey_questions
  for each row execute function private.log_change();
