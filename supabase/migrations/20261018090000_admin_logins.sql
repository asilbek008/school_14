-- "Kirishlar jurnali": every sign-in to the admin panel, failed attempt and sign-out — who, when, from
-- which IP and place (Vercel's geo headers) and which device. The sign-in action writes the row; the
-- insert policy makes sure a successful sign-in can only be recorded by that admin's own session, so a
-- visitor can at most add a failed attempt (capped below). Admins read it; nobody can edit or delete it.

create table public.admin_logins (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  event text not null check (event in ('login', 'failed', 'logout')),
  user_id uuid,
  email text check (email is null or char_length(email) <= 320),
  reason text check (reason is null or char_length(reason) <= 60),
  ip text check (ip is null or char_length(ip) <= 64),
  city text check (city is null or char_length(city) <= 100),
  region text check (region is null or char_length(region) <= 100),
  country text check (country is null or char_length(country) <= 2),
  device text check (device is null or char_length(device) <= 120),
  user_agent text check (user_agent is null or char_length(user_agent) <= 500)
);

alter table public.admin_logins enable row level security;
create policy "record admin logins" on public.admin_logins
  for insert to anon, authenticated with check (
    (event = 'failed' and user_id is null)
    or (
      event in ('login', 'logout')
      and user_id = (select auth.uid())
      and email = (select auth.jwt() ->> 'email')
      and (select private.is_admin())
    )
  );
create policy "admins read admin logins" on public.admin_logins
  for select to authenticated using ((select private.is_admin()));

create index admin_logins_at_idx on public.admin_logins (at desc);

-- Whether a sign-in (and repeated wrong passwords) is reported to the site bot's chat.
alter table public.telegram_settings add column notify_logins boolean not null default true;

-- The time is the server's, not the caller's; failed attempts are capped so the log cannot be flooded;
-- entries older than a year are dropped.
create function private.admin_login_guard() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.at := now();
  if new.event = 'failed'
    and (select count(*) from public.admin_logins l where l.event = 'failed' and l.at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  delete from public.admin_logins l where l.at < now() - interval '1 year';
  return new;
end;
$$;
revoke all on function private.admin_login_guard() from public, anon, authenticated;

create trigger admin_logins_guard before insert on public.admin_logins
  for each row execute function private.admin_login_guard();

-- Telegram: each successful sign-in, and a warning on the 5th and 10th wrong password for one email
-- within 15 minutes.
create function private.notify_admin_login() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  s record;
  fails int;
  place text;
  body text;
begin
  if new.event = 'logout' or not exists (select 1 from pg_extension where extname = 'pg_net') then
    return new;
  end if;
  select bot_token, bot_chat_id, notify_logins into s from public.telegram_settings where id = 1;
  if s is null or not s.notify_logins or s.bot_token is null or s.bot_chat_id is null then
    return new;
  end if;
  place := nullif(concat_ws(', ', new.city, new.country), '');

  if new.event = 'failed' then
    select count(*) into fails from public.admin_logins l
    where l.event = 'failed' and l.email is not distinct from new.email and l.at > now() - interval '15 minutes';
    if fails not in (5, 10) then
      return new;
    end if;
    body := concat_ws(E'\n',
      '⚠️ Admin panelga ' || fails || ' marta noto‘g‘ri kirish urinishi (15 daqiqada)',
      '',
      '👤 ' || coalesce(new.email, '—'),
      case when place is not null then '📍 ' || place end,
      case when new.device is not null then '💻 ' || new.device end,
      case when new.ip is not null then '🌐 ' || new.ip end,
      '',
      'Siz bo‘lmasangiz, parolni almashtiring.');
  else
    body := concat_ws(E'\n',
      '🔐 Admin panelga kirildi',
      '',
      '👤 ' || new.email,
      '🕒 ' || to_char(new.at at time zone 'Asia/Tashkent', 'DD.MM.YYYY HH24:MI'),
      case when place is not null then '📍 ' || place end,
      case when new.device is not null then '💻 ' || new.device end,
      case when new.ip is not null then '🌐 ' || new.ip end);
  end if;

  perform net.http_post(
    url := 'https://api.telegram.org/bot' || s.bot_token || '/sendMessage',
    body := jsonb_build_object('chat_id', s.bot_chat_id, 'text', body, 'disable_web_page_preview', true),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
exception when others then
  return new;
end;
$$;
revoke all on function private.notify_admin_login() from public, anon, authenticated;

create trigger admin_logins_notify after insert on public.admin_logins
  for each row execute function private.notify_admin_login();
