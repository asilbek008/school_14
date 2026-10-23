-- Ertalabki darslar eslatmasi (egasining tanlovi): bot endi faqat so‘ralganda emas, har kuni ertalab
-- soat 07:00 da ota-onaga farzandi sinfining bugungi darslarini o‘zi yuboradi.
--
-- Ota-ona o‘zi yoqadi (standart holda o‘chiq): sinf tanlangandan keyin bot bir marta so‘raydi, «Obuna»
-- sahifasida ham tugmasi bor. Yakshanba, ta’til kunlari va jadvali bo‘sh sinflarga yuborilmaydi.

alter table public.parent_bot_chats
  add column morning boolean not null default false,
  -- Oxirgi yuborilgan kun: bir kunda ikki marta yuborilmaydi va yarim qolgan jo‘natish davom ettiriladi.
  add column morning_sent_on date;

create index parent_bot_chats_morning_idx on public.parent_bot_chats (chat_id) where morning;

-- Har kuni 07:00–07:50 orasida har 10 daqiqada: kutayotgan chat bo‘lsa, Edge Function chaqiriladi.
-- Bir necha marta chaqirilishi ataylab — 150 soniyada ulgurmagan jo‘natish keyingisida davom etadi,
-- `morning_sent_on` esa takrorlanishga yo‘l qo‘ymaydi.
create function private.parent_bot_morning_kick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s record;
  d date := (now() at time zone 'Asia/Tashkent')::date;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    return;
  end if;
  if extract(isodow from d) = 7 then
    return;
  end if;
  if exists (
    select 1 from public.calendar_periods
    where kind = 'tatil' and is_published and d between starts_on and ends_on
  ) then
    return;
  end if;
  select parent_bot_token, parent_bot_secret into s from public.telegram_settings where id = 1;
  if s.parent_bot_token is null or s.parent_bot_secret is null then
    return;
  end if;
  if not exists (
    select 1 from public.parent_bot_chats
    where morning and class_id is not null and (morning_sent_on is null or morning_sent_on < d)
  ) then
    return;
  end if;
  perform net.http_post(
    url := 'https://cieusvxrfpshlpjelvkt.supabase.co/functions/v1/parent-bot',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-bot-secret', s.parent_bot_secret),
    body := '{"morning": true}'::jsonb,
    timeout_milliseconds := 150000
  );
end;
$$;

revoke all on function private.parent_bot_morning_kick() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- 02:00 UTC = 07:00 Toshkent, dushanbadan shanbagacha.
    perform cron.schedule('parent-bot-morning', '*/10 2 * * 1-6', $cron$select private.parent_bot_morning_kick()$cron$);
  end if;
end;
$$;
