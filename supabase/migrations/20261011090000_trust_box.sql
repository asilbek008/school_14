-- "Ishonch qutisi": a message anyone may leave without giving their name — about a child's safety, money
-- being collected, or a member of staff. Nothing identifies the sender unless they choose to write a
-- contact themselves, and no IP or browser data is stored.

create table public.trust_messages (
  id bigint generated always as identity primary key,
  topic text not null check (topic in ('xavfsizlik', 'pul', 'munosabat', 'taklif', 'boshqa')),
  message text not null check (char_length(message) between 10 and 5000),
  -- Optional: a phone or email the sender may add if they want an answer.
  contact text check (contact is null or char_length(contact) <= 320),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.trust_messages enable row level security;
-- Anyone may write; only admins may read, mark as read or delete.
create policy "anyone writes trust messages" on public.trust_messages
  for insert to anon, authenticated with check (true);
create policy "admins read trust messages" on public.trust_messages
  for select to authenticated using ((select private.is_admin()));
create policy "admins update trust messages" on public.trust_messages
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete trust messages" on public.trust_messages
  for delete to authenticated using ((select private.is_admin()));

create index trust_messages_created_idx on public.trust_messages (created_at desc);

-- Spam guard. The sender is anonymous, so there is nothing to count per person: only an overall
-- ceiling, high enough that a real class writing at once still gets through.
create function private.trust_rate_limit() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.trust_messages m where m.created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function private.trust_rate_limit() from public, anon, authenticated;

create trigger trust_messages_rate_limit before insert on public.trust_messages
  for each row execute function private.trust_rate_limit();

-- Telegram notice, as for contact messages but marked with a lock so it is read as confidential.
create function private.notify_trust_message() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  s record;
  body text;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    return new;
  end if;
  select bot_token, bot_chat_id, notify_messages into s from public.telegram_settings where id = 1;
  if s is null or not s.notify_messages or s.bot_token is null or s.bot_chat_id is null then
    return new;
  end if;

  body := concat_ws(
    E'\n',
    '🔒 Ishonch qutisi · ' || initcap(new.topic),
    '',
    left(new.message, 3000) || case when char_length(new.message) > 3000 then '…' else '' end,
    case when new.contact is not null then E'\n📞 ' || new.contact else null end
  );
  perform net.http_post(
    url := 'https://api.telegram.org/bot' || s.bot_token || '/sendMessage',
    body := jsonb_build_object('chat_id', s.bot_chat_id, 'text', body, 'disable_web_page_preview', true),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
exception when others then
  -- A notice must never lose the message.
  return new;
end;
$$;
revoke all on function private.notify_trust_message() from public, anon, authenticated;

create trigger trust_messages_notify after insert on public.trust_messages
  for each row execute function private.notify_trust_message();
