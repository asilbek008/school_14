-- "Havola eskirgan" when the link had in fact just worked: the same `/start <token>` reaches the database
-- twice (Telegram resends an update, and the site bot's updates are read both by pg_cron's sync and by the
-- panel's "Botga ulash" check), while the first claim deleted the token. Now a claim keeps the token and a
-- repeat says "already connected". The window is also an hour rather than fifteen minutes.

alter table private.admin_tg_links add column claimed_at timestamptz;
alter table private.cabinet_links add column claimed_at timestamptz;

create or replace function private.admin_tg_sweep() returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  delete from private.admin_tg_codes where expires_at < now() - interval '1 hour';
  delete from private.admin_tg_links where created_at < now() - interval '1 hour';
  delete from private.admin_tg_sessions where expires_at < now();
  delete from private.admin_tg_sends where at < now() - interval '1 day';
end;
$$;

create or replace function private.admin_tg_claim(p_token text, p_chat_id bigint)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  l record;
  v_email text;
begin
  delete from private.admin_tg_links where created_at < now() - interval '1 hour';
  select * into l from private.admin_tg_links where token = p_token;
  if l is null then
    -- The same /start can arrive twice. If this chat is already linked, that is a success, not an error.
    select u.email into v_email
    from private.admin_tg g join auth.users u on u.id = g.user_id
    where g.chat_id = p_chat_id;
    return case when v_email is null then jsonb_build_object('ok', false)
                else jsonb_build_object('ok', true, 'email', v_email, 'again', true) end;
  end if;
  delete from private.admin_tg where chat_id = p_chat_id and user_id <> l.user_id;
  insert into private.admin_tg (user_id, chat_id, enabled)
  values (l.user_id, p_chat_id, true)
  on conflict (user_id) do update set chat_id = excluded.chat_id, enabled = true, linked_at = now();
  if l.session_id is not null then
    insert into private.admin_tg_sessions (user_id, session_id)
    values (l.user_id, l.session_id)
    on conflict (user_id, session_id) do update set verified_at = now(), expires_at = now() + interval '30 days';
  end if;
  update private.admin_tg_links set claimed_at = now() where token = p_token;
  return jsonb_build_object('ok', true, 'again', l.claimed_at is not null,
                            'email', (select u.email from auth.users u where u.id = l.user_id));
end;
$$;

create or replace function private.cabinet_link()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  delete from private.cabinet_links where created_at < now() - interval '1 hour';
  if (select count(*) from private.cabinet_links where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  v_token := replace(gen_random_uuid()::text, '-', '');
  insert into private.cabinet_links (token) values (v_token);
  return v_token;
end;
$$;

create or replace function private.cabinet_claim(p_token text, p_chat_id bigint)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_key text;
begin
  select c.key into v_key from private.cabinets c where c.chat_id = p_chat_id;
  if not exists (select 1 from private.cabinet_links where token = p_token and created_at > now() - interval '1 hour') then
    -- A repeated /start for a chat that already has a cabinet is fine; only an unknown token is an error.
    return case when v_key is null then jsonb_build_object('ok', false)
                else jsonb_build_object('ok', true, 'again', true) end;
  end if;
  if v_key is null then
    v_key := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    insert into private.cabinets (key, chat_id) values (v_key, p_chat_id);
  end if;
  update private.cabinet_links set key = v_key, claimed_at = now() where token = p_token;
  return jsonb_build_object('ok', true);
end;
$$;

-- The browser may ask twice (a slow answer, a reload): hand the key back while the token is young instead of
-- spending it on the first read.
create or replace function private.cabinet_check(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  l record;
begin
  select * into l from private.cabinet_links where token = p_token and created_at > now() - interval '1 hour';
  if l is null or l.key is null then
    return jsonb_build_object('waiting', true);
  end if;
  return jsonb_build_object('key', l.key, 'data', (select c.data from private.cabinets c where c.key = l.key));
end;
$$;

revoke all on function private.admin_tg_claim(text, bigint), private.cabinet_claim(text, bigint) from public, anon, authenticated;
grant execute on function private.admin_tg_claim(text, bigint), private.cabinet_claim(text, bigint) to service_role;
revoke all on function private.cabinet_link(), private.cabinet_check(text) from public, anon, authenticated;
grant execute on function private.cabinet_link(), private.cabinet_check(text) to anon, authenticated;
