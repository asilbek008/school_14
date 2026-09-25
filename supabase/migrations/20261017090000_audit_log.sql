-- "Faoliyat jurnali": which admin added, changed or deleted what, and when. Written by triggers on the
-- content tables, so no admin action can skip it; only admins can read it and nobody can edit it through
-- the API (no insert/update/delete policies). Only changes made by a signed-in user are logged — the
-- Telegram sync and scheduled jobs run without one. Column names are kept, never values, so nothing
-- like the bot token ends up here. Drag-and-drop reordering (only sort_order changed) is not logged.

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid,
  email text,
  table_name text not null,
  row_ref text,
  action text not null check (action in ('insert', 'update', 'delete')),
  label text,
  changed text[]
);

alter table public.audit_log enable row level security;
create policy "admins read audit log" on public.audit_log
  for select to authenticated using ((select private.is_admin()));

create index audit_log_at_idx on public.audit_log (at desc);

create function private.log_change() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  j jsonb;
  old_j jsonb;
  cols text[];
begin
  if uid is null then
    return null;
  end if;
  j := to_jsonb(coalesce(new, old));
  if tg_op = 'UPDATE' then
    old_j := to_jsonb(old);
    select coalesce(array_agg(k order by k), '{}') into cols
    from jsonb_object_keys(j) k
    where k not in ('updated_at', 'created_at') and (j -> k) is distinct from (old_j -> k);
    if cols = '{}' or cols = array['sort_order'] then
      return null;
    end if;
  end if;

  insert into public.audit_log (user_id, email, table_name, row_ref, action, label, changed)
  values (
    uid,
    (select u.email from auth.users u where u.id = uid),
    tg_table_name,
    case tg_table_name when 'pages' then j ->> 'slug' when 'school_years' then j ->> 'start_year' else j ->> 'id' end,
    lower(tg_op),
    left(case tg_table_name
      when 'school_classes' then concat(j ->> 'grade', '-', j ->> 'letter', ' sinf')
      when 'school_years' then concat(j ->> 'start_year', '–', (j ->> 'start_year')::int + 1, ' o‘quv yili')
      when 'admission_applications' then concat('Ariza #', j ->> 'id', ' (', j ->> 'grade', '-sinf)')
      when 'telegram_settings' then 'Telegram sozlamalari'
      else coalesce(j ->> 'title_uz', j ->> 'name_uz', j ->> 'full_name', j ->> 'slug')
    end, 200),
    cols
  );
  return null;
exception when others then
  -- The log must never block the change itself.
  return null;
end;
$$;
revoke all on function private.log_change() from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'news', 'events', 'staff', 'clubs', 'gallery_albums', 'programs', 'pages', 'documents', 'calendar_periods',
    'achievements', 'school_classes', 'subjects', 'school_years', 'admission_applications', 'telegram_settings'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.log_change()',
      t || '_audit', t
    );
  end loop;
end;
$$;
