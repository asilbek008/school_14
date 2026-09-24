-- pg_net was created in `public` (Supabase advisor: extension_in_public). It is not relocatable,
-- so recreate it in `extensions`; its functions stay in the `net` schema the cron job calls.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_net') then
    drop extension pg_net;
    create extension pg_net with schema extensions;
  end if;
end
$$;
