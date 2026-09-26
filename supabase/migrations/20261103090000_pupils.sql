-- Pupils of each class, from eMaktab's "Список учеников" export (owner's request). This is children's personal
-- data: the full name and the birth date stay in the admin panel; the site shows only the short name the import
-- builds ("Aliyev A.") and the gender, for published classes (the owner chose this).

create table public.pupils (
  id bigint generated always as identity primary key,
  class_id bigint not null references public.school_classes (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  display_name text not null check (char_length(display_name) between 1 and 60),
  gender text check (gender in ('m', 'f')),
  birth_date date,
  created_at timestamptz not null default now()
);

create index pupils_class_idx on public.pupils (class_id, display_name);

alter table public.pupils enable row level security;
-- Visible when the class is (its own policy hides unpublished classes from visitors).
create policy "read pupils of visible classes" on public.pupils
  for select to anon, authenticated using (exists (select 1 from public.school_classes c where c.id = class_id));
create policy "admins insert pupils" on public.pupils
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update pupils" on public.pupils
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete pupils" on public.pupils
  for delete to authenticated using ((select private.is_admin()));

-- Visitors read only the short name and the gender — never the full name or the birth date.
revoke all on public.pupils from anon;
grant select (id, class_id, display_name, gender) on public.pupils to anon;

-- The import replaces the whole list in one transaction (the eMaktab export is the whole school) and sets each
-- listed class's pupil count from it.
create function public.replace_pupils(p_rows jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  n integer;
begin
  if not (select private.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.pupils where true;
  insert into public.pupils (class_id, full_name, display_name, gender, birth_date)
  select (r ->> 'class_id')::bigint, r ->> 'full_name', r ->> 'display_name', nullif(r ->> 'gender', ''), (r ->> 'birth_date')::date
  from jsonb_array_elements(p_rows) r;
  get diagnostics n = row_count;
  update public.school_classes c
  set students = s.n
  from (select class_id, count(*)::smallint as n from public.pupils group by class_id) s
  where s.class_id = c.id and c.students is distinct from s.n;
  return n;
end;
$$;

revoke all on function public.replace_pupils(jsonb) from public;
grant execute on function public.replace_pupils(jsonb) to authenticated;
