-- The telegram-sync function is public (no JWT check), so callers must send this secret in the
-- x-sync-secret header: pg_cron reads it from here, the admin panel reads it as an admin.
-- Anonymous users cannot read telegram_settings (RLS: admins only).
alter table public.telegram_settings
  add column sync_secret text not null
    default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'telegram-sync',
      '*/15 * * * *',
      $cron$select net.http_post(
        url := 'https://cieusvxrfpshlpjelvkt.supabase.co/functions/v1/telegram-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-sync-secret', (select sync_secret from public.telegram_settings where id = 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      )$cron$
    );
  end if;
end
$$;
