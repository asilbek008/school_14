-- Staff roles and two-step sign-in (owner's request).
-- * role: 'admin' (everything) or 'editor' (content only: news, events, gallery, achievements, programs, tests,
--   library). Editors never see messages, applications, the trust box, logs, settings or backups.
-- * 2FA: a staff member who has turned on an authenticator app (a verified TOTP factor) counts as staff only in
--   a session that passed the second step (JWT aal = aal2) — a stolen password alone opens nothing.

alter table public.admins add column role text not null default 'admin' check (role in ('admin', 'editor'));

-- The caller's role, or null: not staff, or 2FA is on and this session has not passed it yet.
create function private.staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select a.role
  from public.admins a
  where a.user_id = (select auth.uid())
    and (
      coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = a.user_id and f.status = 'verified')
    );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.staff_role() = 'admin', false);
$$;

create function private.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.staff_role() in ('admin', 'editor'), false);
$$;

-- Membership alone (before the second step), for recording a sign-in.
create function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function private.staff_role(), private.is_editor(), private.is_staff() from public;
grant execute on function private.staff_role(), private.is_editor(), private.is_staff() to anon, authenticated;

-- Content tables (and the media bucket) open to editors: their admin checks become editor checks.
do $$
declare
  r record;
  editor_tables text[] := array[
    'news', 'news_photos', 'news_videos', 'events', 'gallery_albums', 'gallery_photos', 'gallery_videos', 'achievements',
    'programs', 'program_media', 'league_tables', 'tests', 'test_questions', 'test_results', 'textbooks', 'telegram_posts'
  ];
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check from pg_policies
    where ((schemaname = 'public' and tablename = any (editor_tables)) or (schemaname = 'storage' and tablename = 'objects'))
      and coalesce(qual, '') || coalesce(with_check, '') like '%private.is_admin()%'
  loop
    execute format(
      'alter policy %I on %I.%I %s %s',
      r.policyname, r.schemaname, r.tablename,
      case when r.qual is not null then format('using (%s)', replace(r.qual, 'private.is_admin()', 'private.is_editor()')) else '' end,
      case when r.with_check is not null then format('with check (%s)', replace(r.with_check, 'private.is_admin()', 'private.is_editor()')) else '' end
    );
  end loop;
end;
$$;

-- A staff member's sign-in is recorded right after the password, before the second step.
alter policy "record admin logins" on public.admin_logins with check (
  ((event = 'failed') and (user_id is null))
  or (
    (event = any (array['login', 'logout']))
    and (user_id = (select auth.uid()))
    and (email = (select (auth.jwt() ->> 'email')))
    and (select private.is_staff())
  )
);

-- "Jamoa" in the admin panel: who has access, their role and whether 2FA is on; admins change roles and can turn
-- off the 2FA of someone who lost their phone.
create function private.admin_team()
returns table (user_id uuid, email text, role text, mfa boolean, last_sign_in_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select a.user_id, u.email::text, a.role,
      exists (select 1 from auth.mfa_factors f where f.user_id = a.user_id and f.status = 'verified'),
      u.last_sign_in_at
    from public.admins a join auth.users u on u.id = a.user_id
    order by a.role, u.email;
end;
$$;

create function private.set_admin_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'editor') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  if p_user = (select auth.uid()) then
    raise exception 'own role' using errcode = 'P0001';
  end if;
  update public.admins set role = p_role where user_id = p_user;
end;
$$;

create function private.reset_mfa(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_user = (select auth.uid()) or not exists (select 1 from public.admins where user_id = p_user) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from auth.mfa_factors where user_id = p_user;
end;
$$;

revoke all on function private.admin_team(), private.set_admin_role(uuid, text), private.reset_mfa(uuid) from public, anon;
grant execute on function private.admin_team(), private.set_admin_role(uuid, text), private.reset_mfa(uuid) to authenticated;

-- Public entry points (PostgREST only exposes `public`); the checks are in the private functions.
create function public.admin_team()
returns table (user_id uuid, email text, role text, mfa boolean, last_sign_in_at timestamptz)
language sql
security invoker
set search_path = ''
as $$
  select * from private.admin_team();
$$;

create function public.set_admin_role(p_user uuid, p_role text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.set_admin_role(p_user, p_role);
$$;

create function public.reset_mfa(p_user uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.reset_mfa(p_user);
$$;

revoke all on function public.admin_team(), public.set_admin_role(uuid, text), public.reset_mfa(uuid) from public, anon;
grant execute on function public.admin_team(), public.set_admin_role(uuid, text), public.reset_mfa(uuid) to authenticated;
