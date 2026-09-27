-- Two-step sign-in through the school's Telegram bot (owner's request: a code from the bot instead of
-- Google Authenticator). Everything lives in the `private` schema, so nothing here is reachable through the
-- API; the panel talks to it through the `public` wrappers below, and the bot (service role) through
-- public.admin_tg_claim. The bot token never leaves the database: the code is sent with pg_net from a
-- SECURITY DEFINER function, like private.notify_contact_message.

-- Which admin is linked to which private chat of the bot.
create table private.admin_tg (
  user_id uuid primary key references auth.users (id) on delete cascade,
  chat_id bigint not null unique,
  enabled boolean not null default true,
  linked_at timestamptz not null default now()
);

-- One-time tokens for the t.me/<bot>?start=admin_<token> link. The session that asked for the link is
-- remembered, so that session is already verified once the chat is bound (otherwise turning 2FA on would
-- lock the admin out of the very page they are standing on).
create table private.admin_tg_links (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid,
  created_at timestamptz not null default now()
);

-- The code waiting to be typed in: only its salted hash is stored.
create table private.admin_tg_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code_hash text not null,
  salt text not null,
  expires_at timestamptz not null,
  tries integer not null default 0,
  sent_at timestamptz not null default now()
);

-- Every send, for the rate limit.
create table private.admin_tg_sends (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now()
);
create index admin_tg_sends_idx on private.admin_tg_sends (user_id, at desc);

-- Sessions that passed the second step (the JWT's session_id).
create table private.admin_tg_sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  primary key (user_id, session_id)
);

-- A six-digit code and a 32-hex token from gen_random_uuid() (cryptographically random, no extension needed).
create function private.admin_tg_digits() returns text
language sql volatile set search_path = '' as $$
  select lpad((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint % 1000000)::text, 6, '0');
$$;

create function private.admin_tg_hash(p_code text, p_salt text) returns text
language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(p_salt || ':' || p_code, 'utf8')), 'hex');
$$;

/** Housekeeping: expired codes, stale link tokens and old sessions. */
create function private.admin_tg_sweep() returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  delete from private.admin_tg_codes where expires_at < now() - interval '1 hour';
  delete from private.admin_tg_links where created_at < now() - interval '15 minutes';
  delete from private.admin_tg_sessions where expires_at < now();
  delete from private.admin_tg_sends where at < now() - interval '1 day';
end;
$$;

/** Is this session allowed past the Telegram step? */
create function private.admin_tg_ok(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from private.admin_tg g where g.user_id = p_user and g.enabled)
    or exists (
      select 1 from private.admin_tg_sessions s
      where s.user_id = p_user
        and s.session_id = nullif((select auth.jwt() ->> 'session_id'), '')::uuid
        and s.expires_at > now()
    );
$$;

-- The role is withheld until both steps are passed, so RLS refuses an unverified session even if the panel
-- were bypassed. (Authenticator app: unchanged; Telegram: the clause below.)
create or replace function private.staff_role()
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
    )
    and private.admin_tg_ok(a.user_id);
$$;

/** What the panel needs to draw: is the bot linked, is it on, is this session verified. */
create function private.admin_tg_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  g record;
  v_bot text;
begin
  if not private.is_staff() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select chat_id, enabled into g from private.admin_tg where user_id = (select auth.uid());
  select case when parent_bot_token is not null then parent_bot_username end into v_bot
  from public.telegram_settings where id = 1;
  return jsonb_build_object(
    'linked', g.chat_id is not null,
    'enabled', coalesce(g.enabled, false),
    'verified', private.admin_tg_ok((select auth.uid())),
    'bot', v_bot,
    'waiting', exists (select 1 from private.admin_tg_codes c where c.user_id = (select auth.uid()) and c.expires_at > now())
  );
end;
$$;

/** A fresh linking token for this admin; the panel builds t.me/<bot>?start=admin_<token> from it. */
create function private.admin_tg_link()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  if not private.is_staff() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.admin_tg_sweep();
  v_token := replace(gen_random_uuid()::text, '-', '');
  delete from private.admin_tg_links where user_id = (select auth.uid());
  insert into private.admin_tg_links (token, user_id, session_id)
  values (v_token, (select auth.uid()), nullif((select auth.jwt() ->> 'session_id'), '')::uuid);
  return v_token;
end;
$$;

/** The bot's side of linking (service role only): binds the chat and verifies the session that asked. */
create function private.admin_tg_claim(p_token text, p_chat_id bigint)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  l record;
begin
  delete from private.admin_tg_links where created_at < now() - interval '15 minutes';
  select * into l from private.admin_tg_links where token = p_token;
  if l is null then
    return jsonb_build_object('ok', false);
  end if;
  delete from private.admin_tg_links where token = p_token;
  delete from private.admin_tg where chat_id = p_chat_id and user_id <> l.user_id;
  insert into private.admin_tg (user_id, chat_id, enabled)
  values (l.user_id, p_chat_id, true)
  on conflict (user_id) do update set chat_id = excluded.chat_id, enabled = true, linked_at = now();
  if l.session_id is not null then
    insert into private.admin_tg_sessions (user_id, session_id)
    values (l.user_id, l.session_id)
    on conflict (user_id, session_id) do update set verified_at = now(), expires_at = now() + interval '30 days';
  end if;
  return jsonb_build_object('ok', true, 'email', (select u.email from auth.users u where u.id = l.user_id));
end;
$$;

/** Sends a six-digit code to the admin's chat; the token stays in the database. */
create function private.admin_tg_send_code()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  g record;
  v_token text;
  v_code text;
  v_salt text;
  v_sent integer;
begin
  if not private.is_staff() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.admin_tg_sweep();
  select chat_id, enabled into g from private.admin_tg where user_id = (select auth.uid());
  if g is null or not g.enabled then
    return jsonb_build_object('error', 'not_linked');
  end if;
  select count(*) into v_sent from private.admin_tg_sends
  where user_id = (select auth.uid()) and at > now() - interval '10 minutes';
  if v_sent >= 5 then
    return jsonb_build_object('error', 'rate_limited');
  end if;
  select parent_bot_token into v_token from public.telegram_settings where id = 1;
  if v_token is null or not exists (select 1 from pg_extension where extname = 'pg_net') then
    return jsonb_build_object('error', 'no_bot');
  end if;

  v_code := private.admin_tg_digits();
  v_salt := replace(gen_random_uuid()::text, '-', '');
  insert into private.admin_tg_codes (user_id, code_hash, salt, expires_at, tries, sent_at)
  values ((select auth.uid()), private.admin_tg_hash(v_code, v_salt), v_salt, now() + interval '5 minutes', 0, now())
  on conflict (user_id) do update
    set code_hash = excluded.code_hash, salt = excluded.salt, expires_at = excluded.expires_at, tries = 0, sent_at = now();
  insert into private.admin_tg_sends (user_id) values ((select auth.uid()));

  perform net.http_post(
    url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
    body := jsonb_build_object(
      'chat_id', g.chat_id,
      'text', concat_ws(
        E'\n',
        '🔐 Admin panelga kirish kodi',
        '',
        v_code,
        '',
        'Kod 5 daqiqa amal qiladi. Kodni hech kimga bermang.',
        'Agar panelga kirmoqchi bo‘lmagan bo‘lsangiz, parolingizni darhol almashtiring.'
      ),
      'disable_notification', false
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return jsonb_build_object('ok', true);
end;
$$;

/** Checks the typed code and marks this session as passed. */
create function private.admin_tg_verify(p_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c record;
  v_session uuid;
begin
  if not private.is_staff() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  v_session := nullif((select auth.jwt() ->> 'session_id'), '')::uuid;
  if v_session is null then
    return jsonb_build_object('error', 'no_session');
  end if;
  select * into c from private.admin_tg_codes where user_id = (select auth.uid());
  if c is null or c.expires_at < now() then
    return jsonb_build_object('error', 'expired');
  end if;
  if c.tries >= 5 then
    return jsonb_build_object('error', 'too_many');
  end if;
  if private.admin_tg_hash(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'), c.salt) <> c.code_hash then
    update private.admin_tg_codes set tries = tries + 1 where user_id = c.user_id;
    return jsonb_build_object('error', 'bad_code');
  end if;
  delete from private.admin_tg_codes where user_id = c.user_id;
  insert into private.admin_tg_sessions (user_id, session_id)
  values (c.user_id, v_session)
  on conflict (user_id, session_id) do update set verified_at = now(), expires_at = now() + interval '30 days';
  return jsonb_build_object('ok', true);
end;
$$;

/** Turning it off for one's own account — only from a session that has already passed the step. */
create function private.admin_tg_unlink()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.is_staff() or not private.admin_tg_ok((select auth.uid())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from private.admin_tg where user_id = (select auth.uid());
  delete from private.admin_tg_codes where user_id = (select auth.uid());
  delete from private.admin_tg_sessions where user_id = (select auth.uid());
end;
$$;

/** Someone who lost their Telegram: another admin unlinks them (like reset_mfa). */
create function private.admin_tg_reset(p_user uuid)
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
  if p_user = (select auth.uid()) or not exists (select 1 from public.admins where user_id = p_user) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from private.admin_tg where user_id = p_user;
  delete from private.admin_tg_codes where user_id = p_user;
  delete from private.admin_tg_sessions where user_id = p_user;
end;
$$;

-- "Jamoa" also shows who gets a code from the bot.
drop function public.admin_team();
drop function private.admin_team();
create function private.admin_team()
returns table (user_id uuid, email text, role text, mfa boolean, tg boolean, last_sign_in_at timestamptz)
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
      exists (select 1 from private.admin_tg g where g.user_id = a.user_id and g.enabled),
      u.last_sign_in_at
    from public.admins a join auth.users u on u.id = a.user_id
    order by a.role, u.email;
end;
$$;

create function public.admin_team()
returns table (user_id uuid, email text, role text, mfa boolean, tg boolean, last_sign_in_at timestamptz)
language sql
security invoker
set search_path = ''
as $$
  select * from private.admin_team();
$$;

-- Public entry points. The panel (authenticated) may ask for its own state, a link token, a code and the check;
-- claiming a link token is the bot's, so only the service role may call it.
create function public.admin_tg_state() returns jsonb
language sql security invoker set search_path = '' as $$ select private.admin_tg_state(); $$;

create function public.admin_tg_link() returns text
language sql security invoker set search_path = '' as $$ select private.admin_tg_link(); $$;

create function public.admin_tg_send_code() returns jsonb
language sql security invoker set search_path = '' as $$ select private.admin_tg_send_code(); $$;

create function public.admin_tg_verify(p_code text) returns jsonb
language sql security invoker set search_path = '' as $$ select private.admin_tg_verify(p_code); $$;

create function public.admin_tg_unlink() returns void
language sql security invoker set search_path = '' as $$ select private.admin_tg_unlink(); $$;

create function public.admin_tg_reset(p_user uuid) returns void
language sql security invoker set search_path = '' as $$ select private.admin_tg_reset(p_user); $$;

create function public.admin_tg_claim(p_token text, p_chat_id bigint) returns jsonb
language sql security invoker set search_path = '' as $$ select private.admin_tg_claim(p_token, p_chat_id); $$;

revoke all on function
  private.admin_tg_digits(), private.admin_tg_hash(text, text), private.admin_tg_sweep(),
  private.admin_tg_ok(uuid), private.admin_tg_state(), private.admin_tg_link(),
  private.admin_tg_claim(text, bigint), private.admin_tg_send_code(), private.admin_tg_verify(text),
  private.admin_tg_unlink(), private.admin_tg_reset(uuid), private.admin_team()
from public, anon, authenticated;

-- staff_role() is called by the read policies, so anon must be able to call it (it returns null for them).
grant execute on function private.admin_tg_ok(uuid) to anon, authenticated;
grant execute on function
  private.admin_tg_state(), private.admin_tg_link(), private.admin_tg_send_code(),
  private.admin_tg_verify(text), private.admin_tg_unlink(), private.admin_tg_reset(uuid), private.admin_team()
to authenticated;

revoke all on function
  public.admin_tg_state(), public.admin_tg_link(), public.admin_tg_send_code(), public.admin_tg_verify(text),
  public.admin_tg_unlink(), public.admin_tg_reset(uuid), public.admin_tg_claim(text, bigint), public.admin_team()
from public, anon, authenticated;
grant execute on function
  public.admin_tg_state(), public.admin_tg_link(), public.admin_tg_send_code(), public.admin_tg_verify(text),
  public.admin_tg_unlink(), public.admin_tg_reset(uuid), public.admin_team()
to authenticated;
grant execute on function public.admin_tg_claim(text, bigint), private.admin_tg_claim(text, bigint) to service_role;
