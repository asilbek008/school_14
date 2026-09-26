-- Class leaderboard for tests (owner's request): after an exam-mode attempt a pupil may add the result to their
-- class's standing. Nothing about the pupil is stored — only the test, the class and how many answers were right.

create table public.test_results (
  id bigint generated always as identity primary key,
  test_id bigint not null references public.tests (id) on delete cascade,
  class_id bigint not null references public.school_classes (id) on delete cascade,
  correct smallint not null check (correct >= 0),
  total smallint not null check (total > 0 and correct <= total),
  created_at timestamptz not null default now()
);

create index test_results_test_idx on public.test_results (test_id, class_id);
create index test_results_created_idx on public.test_results (created_at desc);
create index test_results_class_idx on public.test_results (class_id);

alter table public.test_results enable row level security;

-- Anyone may read the (anonymous) results of published tests and add one; only admins delete.
create policy "read results of published tests" on public.test_results
  for select to anon, authenticated using (
    exists (select 1 from public.tests t where t.id = test_id and (t.is_published or (select private.is_admin())))
  );
create policy "anyone adds a result" on public.test_results
  for insert to anon, authenticated with check (true);
create policy "admins delete results" on public.test_results
  for delete to authenticated using ((select private.is_admin()));

-- Checks a new result: a published test and class, the whole test answered (total = its questions), server time,
-- and a limit against flooding (per class and test 30 in 10 minutes, overall 300 an hour).
create function private.test_result_guard() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_at := now();
  if not exists (select 1 from public.tests t where t.id = new.test_id and t.is_published)
     or not exists (select 1 from public.school_classes c where c.id = new.class_id and c.is_published) then
    raise exception 'invalid' using errcode = 'P0001';
  end if;
  if new.total <> (select count(*) from public.test_questions q where q.test_id = new.test_id) then
    raise exception 'invalid' using errcode = 'P0001';
  end if;
  if (select count(*) from public.test_results r
      where r.test_id = new.test_id and r.class_id = new.class_id and r.created_at > now() - interval '10 minutes') >= 30
     or (select count(*) from public.test_results r where r.created_at > now() - interval '1 hour') >= 300 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function private.test_result_guard() from public, anon, authenticated;

create trigger test_results_guard before insert on public.test_results
  for each row execute function private.test_result_guard();
