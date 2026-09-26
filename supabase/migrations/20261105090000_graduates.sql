-- Graduates by year (owner's request): the list behind each year on the alumni page. Loaded by the admin from an
-- eMaktab pupil list (the year's 11th grades). Like `pupils`, the full name and the birth date stay in the admin panel;
-- visitors read only the short name ("Aliyev A."), the gender and the class.

create table public.graduates (
  id bigint generated always as identity primary key,
  grad_year smallint not null check (grad_year between 1976 and 2100),
  class_label text check (char_length(class_label) between 1 and 12),
  full_name text not null check (char_length(full_name) between 2 and 120),
  display_name text not null check (char_length(display_name) between 1 and 60),
  gender text check (gender in ('m', 'f')),
  birth_date date,
  created_at timestamptz not null default now()
);

create index graduates_year_idx on public.graduates (grad_year, class_label, display_name);

alter table public.graduates enable row level security;
create policy "read graduates" on public.graduates
  for select to anon, authenticated using (true);
create policy "admins insert graduates" on public.graduates
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update graduates" on public.graduates
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete graduates" on public.graduates
  for delete to authenticated using ((select private.is_admin()));

revoke all on public.graduates from anon;
grant select (id, grad_year, class_label, display_name, gender) on public.graduates to anon;

-- Replaces one year's list in one transaction; an empty list removes the year.
create function public.replace_graduates(p_year integer, p_rows jsonb)
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
  delete from public.graduates where grad_year = p_year;
  insert into public.graduates (grad_year, class_label, full_name, display_name, gender, birth_date)
  select p_year, nullif(r ->> 'class_label', ''), r ->> 'full_name', r ->> 'display_name', nullif(r ->> 'gender', ''),
    (r ->> 'birth_date')::date
  from jsonb_array_elements(p_rows) r;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.replace_graduates(integer, jsonb) from public;
grant execute on function public.replace_graduates(integer, jsonb) to authenticated;
