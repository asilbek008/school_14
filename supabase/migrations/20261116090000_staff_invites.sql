-- Adding a colleague to the admin panel without touching the Supabase dashboard (owner's request): an admin
-- enters the email and the role, the panel gives back a one-time link, and the new member opens it and picks
-- their own password. The account is created by the Edge Function `staff-invite` (it runs with the service
-- role Supabase gives it), so no secret key is needed anywhere in the site's code.

create table private.staff_invites (
  id bigint generated always as identity primary key,
  email text not null,
  role text not null check (role in ('admin', 'editor', 'teacher')),
  token text not null unique,
  invited_by uuid references auth.users (id) on delete set null,
  invited_email text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz
);
create index staff_invites_email_idx on private.staff_invites (lower(email));

/** Creates the invite and returns its token; the panel builds the link from it. */
create function private.staff_invite_create(p_email text, p_role text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_token text;
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$' then
    return jsonb_build_object('error', 'email');
  end if;
  if p_role not in ('admin', 'editor', 'teacher') then
    return jsonb_build_object('error', 'role');
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = v_email) then
    return jsonb_build_object('error', 'exists');
  end if;
  -- One live invite per address: asking again replaces the old link.
  delete from private.staff_invites where lower(email) = v_email and used_at is null;
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into private.staff_invites (email, role, token, invited_by, invited_email)
  values (v_email, p_role, v_token, (select auth.uid()), (select auth.jwt() ->> 'email'));
  return jsonb_build_object('ok', true, 'token', v_token, 'email', v_email);
end;
$$;

/** What the team page shows: live invites first, then the last few that were used. */
create function private.staff_invites_list()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return coalesce(
    (select jsonb_agg(row)
     from (
       select jsonb_build_object(
                'id', i.id, 'email', i.email, 'role', i.role, 'token', case when i.used_at is null and i.expires_at > now() then i.token end,
                'created_at', i.created_at, 'expires_at', i.expires_at, 'used_at', i.used_at,
                'invited_email', i.invited_email
              ) as row
       from private.staff_invites i
       order by (i.used_at is not null), i.created_at desc
       limit 20
     ) rows),
    '[]'::jsonb);
end;
$$;

create function private.staff_invite_revoke(p_id bigint)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from private.staff_invites where id = p_id and used_at is null;
end;
$$;

/** The invite page asks who the link is for (service role only). */
create function private.staff_invite_lookup(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  i record;
begin
  select * into i from private.staff_invites where token = p_token;
  if i is null then
    return jsonb_build_object('error', 'unknown');
  end if;
  if i.used_at is not null then
    return jsonb_build_object('error', 'used');
  end if;
  if i.expires_at < now() then
    return jsonb_build_object('error', 'expired');
  end if;
  return jsonb_build_object('ok', true, 'email', i.email, 'role', i.role);
end;
$$;

/** After the account is created: give it its role and spend the invite, in one transaction. */
create function private.staff_invite_complete(p_token text, p_user uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  i record;
begin
  select * into i from private.staff_invites where token = p_token and used_at is null and expires_at > now() for update;
  if i is null then
    return jsonb_build_object('error', 'unknown');
  end if;
  insert into public.admins (user_id, role) values (p_user, i.role)
  on conflict (user_id) do update set role = excluded.role;
  update private.staff_invites set used_at = now() where id = i.id;
  return jsonb_build_object('ok', true, 'role', i.role);
end;
$$;

create function public.staff_invite_create(p_email text, p_role text) returns jsonb
language sql security invoker set search_path = '' as $$ select private.staff_invite_create(p_email, p_role); $$;
create function public.staff_invites_list() returns jsonb
language sql security invoker set search_path = '' as $$ select private.staff_invites_list(); $$;
create function public.staff_invite_revoke(p_id bigint) returns void
language sql security invoker set search_path = '' as $$ select private.staff_invite_revoke(p_id); $$;
create function public.staff_invite_lookup(p_token text) returns jsonb
language sql security invoker set search_path = '' as $$ select private.staff_invite_lookup(p_token); $$;
create function public.staff_invite_complete(p_token text, p_user uuid) returns jsonb
language sql security invoker set search_path = '' as $$ select private.staff_invite_complete(p_token, p_user); $$;

revoke all on function
  private.staff_invite_create(text, text), private.staff_invites_list(), private.staff_invite_revoke(bigint),
  private.staff_invite_lookup(text), private.staff_invite_complete(text, uuid)
from public, anon, authenticated;
grant execute on function
  private.staff_invite_create(text, text), private.staff_invites_list(), private.staff_invite_revoke(bigint)
to authenticated;
grant execute on function private.staff_invite_lookup(text), private.staff_invite_complete(text, uuid) to service_role;

revoke all on function
  public.staff_invite_create(text, text), public.staff_invites_list(), public.staff_invite_revoke(bigint),
  public.staff_invite_lookup(text), public.staff_invite_complete(text, uuid)
from public, anon, authenticated;
grant execute on function
  public.staff_invite_create(text, text), public.staff_invites_list(), public.staff_invite_revoke(bigint)
to authenticated;
grant execute on function public.staff_invite_lookup(text), public.staff_invite_complete(text, uuid) to service_role;
