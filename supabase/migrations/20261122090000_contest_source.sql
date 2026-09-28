-- Contests that come from outside the school (robocontest.uz, the ministry's olympiads, and the like).
-- Three things such an announcement needs and an in-house one does not:
--   organizer   -- whose contest it is, so a reader knows who is behind it;
--   source_url  -- the official announcement, so anyone can check the dates we copied;
--   external    -- sign-up happens on the organizer's site, so we link there instead of taking entries.
-- A date nobody can check has no business on a school's official site, so an external contest without
-- source_url is refused by the check below.
alter table public.contests
  add column organizer text,
  add column source_url text,
  add column external boolean not null default false;

alter table public.contests
  add constraint contests_external_needs_source check (not external or source_url is not null);

-- enter_contest() already refuses a closed contest; an external one takes no entries here at all.
create or replace function private.enter_contest(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_code text;
  v_contest record;
  v_grade smallint := nullif(p ->> 'grade', '')::smallint;
begin
  select id, grade_from, grade_to, registration_until, external into v_contest
  from public.contests c where c.slug = (p ->> 'slug') and c.is_published;
  if not found or v_contest.external then
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

-- An external contest keeps no entries of ours, so its slug stays out of the counts.
create or replace function private.contest_counts() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(c.slug, n.total), '{}'::jsonb)
  from public.contests c
  join lateral (select count(*) as total from public.contest_entries e where e.contest_id = c.id) n on true
  where c.is_published and not c.external;
$$;
