-- "Bitiruvchilar" (owner's request): the school's notable graduates. A graduate appears only with their own
-- consent (checked in the form; the table refuses a published row without it). How many graduated each year
-- comes from school_years.graduates.

create table public.alumni (
  id bigint generated always as identity primary key,
  full_name text not null check (length(full_name) between 2 and 120),
  graduation_year smallint not null check (graduation_year between 1976 and 2100),
  class_label text check (length(class_label) <= 20),
  occupation_uz text,
  occupation_ru text,
  occupation_en text,
  story_uz text not null default '',
  story_ru text,
  story_en text,
  photo text,
  consent boolean not null default false,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alumni_published_consent check (not is_published or consent)
);

create trigger alumni_updated_at before update on public.alumni
  for each row execute function public.set_updated_at();
create trigger alumni_audit after insert or update or delete on public.alumni
  for each row execute function private.log_change();

alter table public.alumni enable row level security;
create policy "read published alumni" on public.alumni
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert alumni" on public.alumni
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update alumni" on public.alumni
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete alumni" on public.alumni
  for delete to authenticated using ((select private.is_admin()));

create index alumni_year_idx on public.alumni (graduation_year desc, sort_order);

-- Backups now take every public table except secrets and growing logs, so a new table (like this one) is never
-- forgotten.
create or replace function private.take_backup(by_whom text default 'cron')
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  t text;
  rows jsonb;
  doc jsonb := '{}';
  counts jsonb := '{}';
  new_id bigint;
begin
  for t in
    select tablename from pg_catalog.pg_tables
    where schemaname = 'public'
      and tablename not in ('backups', 'telegram_settings', 'telegram_media', 'site_visits', 'admin_logins', 'audit_log')
    order by tablename
  loop
    execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]'') from public.%I x', t) into rows;
    doc := doc || jsonb_build_object(t, rows);
    counts := counts || jsonb_build_object(t, jsonb_array_length(rows));
  end loop;

  insert into public.backups (taken_by, data, counts, bytes)
  values (coalesce(by_whom, 'cron'), doc, counts, octet_length(doc::text))
  returning id into new_id;

  delete from public.backups where id not in (select id from public.backups order by taken_at desc limit 8);
  return new_id;
end;
$$;

revoke all on function private.take_backup(text) from public, anon, authenticated;
