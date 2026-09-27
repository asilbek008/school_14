-- The second-step code now comes from the school's own bot (@maktab_14bot, `telegram_settings.bot_token` —
-- the one that already sends admin notices), not from the parents' bot (owner's request). That bot has no
-- webhook (telegram-sync reads its updates with getUpdates), so linking is handled inside the sync function
-- and the panel asks for a sync right after the admin presses "Start".

create or replace function private.admin_tg_state()
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
  select case when bot_token is not null then bot_username end into v_bot
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

create or replace function private.admin_tg_send_code()
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
  select bot_token into v_token from public.telegram_settings where id = 1;
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

revoke all on function private.admin_tg_state(), private.admin_tg_send_code() from public, anon, authenticated;
grant execute on function private.admin_tg_state(), private.admin_tg_send_code() to authenticated;
