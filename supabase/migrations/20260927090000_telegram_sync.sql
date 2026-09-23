-- Telegram channel → news and events. The `telegram-sync` Edge Function reads the channel's
-- public web preview (t.me/s/<channel>), and adds new posts; pg_cron calls it every 15 minutes.
-- The function uses the service role (injected by Supabase), so no key leaves Supabase.

-- Which Telegram post a row came from, so a post is imported once (and an edited or deleted row
-- is not re-imported).
alter table public.news add column telegram_post_id integer unique;
alter table public.events add column telegram_post_id integer unique;

-- One row of settings, edited in the admin panel.
create table public.telegram_settings (
  id smallint primary key default 1 check (id = 1),
  channel text check (channel ~ '^[A-Za-z0-9_]{4,32}$'),
  enabled boolean not null default false,
  auto_publish boolean not null default true,
  -- Posts older than this are not imported (so connecting a channel does not pull its whole history).
  import_since timestamptz not null default now(),
  last_synced_at timestamptz,
  last_status text,
  updated_at timestamptz not null default now()
);
insert into public.telegram_settings (id) values (1);

create trigger telegram_settings_updated_at before update on public.telegram_settings
  for each row execute function public.set_updated_at();

alter table public.telegram_settings enable row level security;
create policy "admins read telegram settings" on public.telegram_settings
  for select to authenticated using ((select private.is_admin()));
create policy "admins update telegram settings" on public.telegram_settings
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- Schedule. Skipped where pg_cron / pg_net are not available (plain local Postgres).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron')
     and exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
    create extension if not exists pg_cron;
    perform cron.schedule(
      'telegram-sync',
      '*/15 * * * *',
      $cron$select net.http_post(
        url := 'https://cieusvxrfpshlpjelvkt.supabase.co/functions/v1/telegram-sync',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      )$cron$
    );
  end if;
end
$$;
