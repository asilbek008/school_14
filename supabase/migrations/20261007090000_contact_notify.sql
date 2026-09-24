-- Telegram notice for each new contact-form message. The site's bot (telegram_settings.bot_token) sends it
-- to the private chat of whoever pressed Start in the bot (bot_chat_id). The trigger runs inside the
-- database, so the token never reaches the visitor's request; pg_net sends after the insert commits,
-- and any failure leaves the message saved.

alter table public.telegram_settings add column notify_messages boolean not null default false;

create function private.notify_contact_message() returns trigger
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
    left(new.message, 3000) || case when char_length(new.message) > 3000 then '…' else '' end,
    '',
    'Admin panel: https://qiziriq14maktab.vercel.app/admin/messages'
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

create trigger contact_messages_notify after insert on public.contact_messages
  for each row execute function private.notify_contact_message();
