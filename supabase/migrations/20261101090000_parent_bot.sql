-- Telegram bot for parents (owner's request): "/darslar 8-A" answers with the day's lessons, and new news is sent to
-- everyone who subscribed. A separate bot from the site's channel bot: that one reads its updates with getUpdates,
-- while this one answers at once through a webhook (Telegram allows only one of the two per bot).
-- The admin enters its @BotFather token in /admin/parent-bot; the server sets the webhook to the parent-bot Edge
-- Function with a secret that Telegram sends back in every request.

alter table public.telegram_settings
  add column parent_bot_token text,
  add column parent_bot_username text,
  add column parent_bot_secret text;

-- One row per chat that talked to the bot: its chosen class and whether it wants news. Nothing else about the person
-- (no name, no username, no phone).
create table public.parent_bot_chats (
  chat_id bigint primary key,
  class_id bigint references public.school_classes (id) on delete set null,
  subscribed boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index parent_bot_chats_class_idx on public.parent_bot_chats (class_id);

alter table public.parent_bot_chats enable row level security;

-- Admins see the numbers; the Edge Function works with the service role.
create policy "admins read parent bot chats" on public.parent_bot_chats
  for select to authenticated using ((select private.is_admin()));

alter table public.news add column bot_sent_at timestamptz;
-- Already published news is not sent (without touching updated_at); the epoch marks "never sent".
alter table public.news disable trigger news_updated_at;
update public.news set bot_sent_at = 'epoch';
alter table public.news enable trigger news_updated_at;

-- The bot's @username for the site's links (null until it is set up).
create function private.parent_bot_username()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when parent_bot_token is not null then parent_bot_username end from public.telegram_settings where id = 1;
$$;

revoke all on function private.parent_bot_username() from public;
grant execute on function private.parent_bot_username() to anon, authenticated;

create function public.parent_bot_username()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select private.parent_bot_username();
$$;

revoke all on function public.parent_bot_username() from public;
grant execute on function public.parent_bot_username() to anon, authenticated;

-- Every 5 minutes: when news is waiting and someone is subscribed, ask the Edge Function to send it.
create function private.parent_bot_kick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s record;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    return;
  end if;
  select parent_bot_token, parent_bot_secret into s from public.telegram_settings where id = 1;
  if s.parent_bot_token is null or s.parent_bot_secret is null then
    return;
  end if;
  if not exists (
    select 1 from public.news
    where is_published and bot_sent_at is null
      and published_at <= now() and published_at > now() - interval '3 days'
  ) or not exists (select 1 from public.parent_bot_chats where subscribed) then
    return;
  end if;
  perform net.http_post(
    url := 'https://cieusvxrfpshlpjelvkt.supabase.co/functions/v1/parent-bot',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-bot-secret', s.parent_bot_secret),
    body := '{"broadcast": true}'::jsonb,
    timeout_milliseconds := 150000
  );
end;
$$;

revoke all on function private.parent_bot_kick() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('parent-bot-news', '*/5 * * * *', $cron$select private.parent_bot_kick()$cron$);
  end if;
end;
$$;
