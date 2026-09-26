-- Weekly backups of the site's data (owner's request): every table the admins fill in, as one JSON document per
-- snapshot, kept for 8 weeks. The admin panel lists them and downloads one as a file (to keep off-site too).
-- Left out: secrets (telegram_settings: bot token, sync secret), logs that only grow (site_visits, admin_logins,
-- audit_log) and the backups themselves. Photos and files stay in Storage and are not copied here.

create table public.backups (
  id bigint generated always as identity primary key,
  taken_at timestamptz not null default now(),
  -- 'cron' (weekly) or the admin's email.
  taken_by text not null default 'cron',
  data jsonb not null,
  -- Rows per table, for the list without reading the whole document.
  counts jsonb not null,
  bytes integer not null
);

alter table public.backups enable row level security;

-- Admins read them; nobody writes or deletes through the API (the function below does, as its owner).
create policy "admins read backups" on public.backups
  for select to authenticated using ((select private.is_admin()));

create or replace function private.take_backup(by_whom text default 'cron')
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  tables text[] := array[
    'news', 'news_photos', 'news_videos', 'events', 'staff', 'subjects', 'school_classes', 'lessons', 'clubs',
    'club_media', 'gallery_albums', 'gallery_photos', 'gallery_videos', 'programs', 'program_media', 'league_tables',
    'pages', 'achievements', 'calendar_periods', 'tests', 'test_questions', 'textbooks', 'documents', 'school_years',
    'contact_messages', 'trust_messages', 'admission_applications', 'telegram_posts', 'admins'
  ];
  t text;
  rows jsonb;
  doc jsonb := '{}';
  counts jsonb := '{}';
  new_id bigint;
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]'') from public.%I x', t) into rows;
    doc := doc || jsonb_build_object(t, rows);
    counts := counts || jsonb_build_object(t, jsonb_array_length(rows));
  end loop;

  insert into public.backups (taken_by, data, counts, bytes)
  values (coalesce(by_whom, 'cron'), doc, counts, octet_length(doc::text))
  returning id into new_id;

  -- Keep the 8 newest.
  delete from public.backups where id not in (select id from public.backups order by taken_at desc limit 8);
  return new_id;
end;
$$;

revoke all on function private.take_backup(text) from public, anon, authenticated;

-- "Zaxira olish" in the admin panel: only an admin, and it is recorded who asked.
create or replace function public.take_backup_now()
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return private.take_backup_as_admin();
end;
$$;

-- Definer wrapper so the invoker function above can reach the private one without granting it to everyone.
create or replace function private.take_backup_as_admin()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return private.take_backup(coalesce(auth.jwt() ->> 'email', 'admin'));
end;
$$;

revoke all on function private.take_backup_as_admin() from public, anon;
grant execute on function private.take_backup_as_admin() to authenticated;
revoke all on function public.take_backup_now() from public, anon;
grant execute on function public.take_backup_now() to authenticated;

-- Every Sunday at 03:07 Tashkent time (Saturday 22:07 UTC), and a first one now.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('weekly-backup', '7 22 * * 6', $cron$select private.take_backup('cron')$cron$);
  end if;
end;
$$;

select private.take_backup('cron');
