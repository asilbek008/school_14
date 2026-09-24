-- The Telegram notice for a new contact message without the admin-panel link at the end (owner's request).

create or replace function private.notify_contact_message() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  s record;
  body text;
begin
  -- pg_net is on Supabase; a plain local Postgres has no way to send.
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    return new;
  end if;
  select bot_token, bot_chat_id, notify_messages into s from public.telegram_settings where id = 1;
  if s is null or not s.notify_messages or s.bot_token is null or s.bot_chat_id is null then
    return new;
  end if;

  body := concat_ws(
    E'\n',
    '📩 Saytdan yangi xabar' || coalesce(' · ' || initcap(new.topic), ''),
    '',
    '👤 ' || new.name,
    '📞 ' || new.phone,
    '✉️ ' || new.email,
    '',
    left(new.message, 3000) || case when char_length(new.message) > 3000 then '…' else '' end
  );
  perform net.http_post(
    url := 'https://api.telegram.org/bot' || s.bot_token || '/sendMessage',
    body := jsonb_build_object('chat_id', s.bot_chat_id, 'text', body, 'disable_web_page_preview', true),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
exception when others then
  -- Never lose a visitor's message over a notice.
  return new;
end;
$$;

revoke all on function private.notify_contact_message() from public, anon, authenticated;
