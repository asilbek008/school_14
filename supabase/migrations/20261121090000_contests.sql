-- Olimpiada va tanlovlar (owner's pick #11): the school announces a contest, pupils sign up from the site,
-- and the staff work the entries. The winners' side of this already exists as "Yutuqlar" -- this is the part
-- before it, which until now happened on paper in a corridor.
create table public.contests (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title_uz text not null,
  title_ru text,
  title_en text,
  description_uz text,
  description_ru text,
  description_en text,
  -- Same vocabulary as the achievements wall (src/lib/categories.ts achievementFields), so a contest and the
  -- result it produces are filed under the same word.
  field text not null check (field in ('olimpiada', 'sport', 'tanlov', 'boshqa')),
  level text not null check (level in ('maktab', 'tuman', 'viloyat', 'respublika', 'xalqaro')),
  grade_from smallint check (grade_from between 1 and 11),
  grade_to smallint check (grade_to between 1 and 11),
  place text,
  starts_at timestamptz,
  -- Sign-up closes on its own: the form disappears once this passes.
  registration_until timestamptz,
  contact text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contests_published_idx on public.contests (is_published, starts_at desc);

create table public.contest_entries (
  id bigint generated always as identity primary key,
  contest_id bigint not null references public.contests (id) on delete cascade,
  code text not null unique,
  pupil_name text not null,
  grade smallint not null check (grade between 1 and 11),
  class_letter text,
  parent_phone text not null,
  teacher text,
  note text,
  status text not null default 'new' check (status in ('new', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contest_entries_contest_idx on public.contest_entries (contest_id, created_at desc);

alter table public.contests enable row level security;
alter table public.contest_entries enable row level security;

-- The contest itself is an announcement: everyone reads a published one.
create policy "read published contests" on public.contests for select to anon, authenticated
  using (is_published or private.is_admin());
create policy "admins insert contests" on public.contests for insert to authenticated with check (private.is_admin());
create policy "admins update contests" on public.contests for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admins delete contests" on public.contests for delete to authenticated using (private.is_admin());

-- An entry names a child and a parent's phone: the school's to read, nobody else's. No insert policy —
-- sign-ups come through enter_contest(), which checks the contest is open before writing anything.
create policy "admins read entries" on public.contest_entries for select to authenticated using (private.is_admin());
create policy "admins update entries" on public.contest_entries for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admins delete entries" on public.contest_entries for delete to authenticated using (private.is_admin());

create trigger contests_updated_at before update on public.contests for each row execute function set_updated_at();
create trigger contest_entries_updated_at before update on public.contest_entries for each row execute function set_updated_at();
create trigger contests_audit after insert or update or delete on public.contests for each row execute function private.log_change();

create or replace function private.contest_entry_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (
    select count(*) from public.contest_entries e
    where e.created_at > now() - interval '10 minutes' and e.parent_phone = new.parent_phone
  ) >= 5
  or (select count(*) from public.contest_entries e where e.created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger contest_entries_rate_limit before insert on public.contest_entries
  for each row execute function private.contest_entry_rate_limit();

create or replace function private.enter_contest(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_code text;
  v_contest record;
  v_grade smallint := nullif(p ->> 'grade', '')::smallint;
begin
  select id, grade_from, grade_to, registration_until into v_contest
  from public.contests c where c.slug = (p ->> 'slug') and c.is_published;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'closed');
  end if;
  if v_contest.registration_until is not null and v_contest.registration_until < now() then
    return jsonb_build_object('ok', false, 'error', 'closed');
  end if;

  if length(coalesce(p ->> 'pupil_name', '')) < 3
     or length(coalesce(p ->> 'parent_phone', '')) < 7
     or v_grade is null or v_grade < 1 or v_grade > 11 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  if (v_contest.grade_from is not null and v_grade < v_contest.grade_from)
     or (v_contest.grade_to is not null and v_grade > v_contest.grade_to) then
    return jsonb_build_object('ok', false, 'error', 'grade');
  end if;

  loop
    v_code := private.new_code('T');
    exit when not exists (select 1 from public.contest_entries e where e.code = v_code);
  end loop;

  insert into public.contest_entries (contest_id, code, pupil_name, grade, class_letter, parent_phone, teacher, note)
  values (
    v_contest.id, v_code, left(p ->> 'pupil_name', 200), v_grade,
    nullif(upper(left(p ->> 'class_letter', 2)), ''), left(p ->> 'parent_phone', 50),
    nullif(left(p ->> 'teacher', 200), ''), nullif(left(p ->> 'note', 1000), '')
  );
  return jsonb_build_object('ok', true, 'code', v_code);
exception
  when sqlstate 'P0001' then return jsonb_build_object('ok', false, 'error', 'rate_limited');
  when others then return jsonb_build_object('ok', false, 'error', 'failed');
end;
$$;

-- How many have signed up, for the contest page. A count is not personal data; the names are not returned.
create or replace function private.contest_counts() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(c.slug, n.total), '{}'::jsonb)
  from public.contests c
  join lateral (select count(*) as total from public.contest_entries e where e.contest_id = c.id) n on true
  where c.is_published;
$$;

revoke all on function private.enter_contest(jsonb), private.contest_counts() from public, anon, authenticated;
grant execute on function private.enter_contest(jsonb), private.contest_counts() to anon, authenticated;

create or replace function public.enter_contest(p jsonb) returns jsonb
language sql security invoker set search_path = '' as $$ select private.enter_contest(p); $$;
create or replace function public.contest_counts() returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.contest_counts(); $$;

revoke all on function public.enter_contest(jsonb), public.contest_counts() from public;
grant execute on function public.enter_contest(jsonb), public.contest_counts() to anon, authenticated;
