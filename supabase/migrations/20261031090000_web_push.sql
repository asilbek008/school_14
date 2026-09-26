-- Web push notifications for parents (owner's request): a visitor presses "Bildirishnoma olish" and the browser gives
-- a push subscription (an endpoint URL plus two keys — nothing about the person). When a news item is published, the
-- site sends it to every subscriber in the language they chose.
--
-- Sending: pg_cron checks every 5 minutes for news that is visible and not yet pushed; only then it calls the site's
-- /api/push with a secret header. The route asks the database for the pending news, the subscribers and the VAPID
-- keys (the database checks the secret), sends, and reports dead endpoints. The VAPID pair is made on the server when
-- an admin presses "Ishga tushirish" in /admin/push and is kept here, readable by no API role — nobody sees it.

create table public.push_subscriptions (
  id bigint generated always as identity primary key,
  endpoint text not null unique check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 8 and 100),
  lang text not null default 'uz' check (lang in ('uz', 'ru', 'en')),
  created_at timestamptz not null default now()
);

create index push_subscriptions_created_idx on public.push_subscriptions (created_at desc);

alter table public.push_subscriptions enable row level security;

-- Admins see them (the count in the panel); everyone else goes through the functions below.
create policy "admins read push subscriptions" on public.push_subscriptions
  for select to authenticated using ((select private.is_admin()));

alter table public.news add column pushed_at timestamptz;
-- What is already on the site is not news to anyone (without touching updated_at). The epoch marks "never sent".
alter table public.news disable trigger news_updated_at;
update public.news set pushed_at = 'epoch';
alter table public.news enable trigger news_updated_at;

create table private.push_settings (
  id smallint primary key default 1 check (id = 1),
  secret text not null,
  site_url text not null,
  vapid_public text,
  vapid_private text
);

insert into private.push_settings (secret, site_url)
values (replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'https://qiziriq14maktab.vercel.app');

revoke all on private.push_settings from public, anon, authenticated;

-- Subscribe (or refresh the keys/language of the same browser) and unsubscribe. Knowing the endpoint — a long random
-- URL only that browser has — is what lets one remove it.
create function private.push_subscribe(p_endpoint text, p_p256dh text, p_auth text, p_lang text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.push_subscriptions where created_at > now() - interval '10 minutes') >= 300 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.push_subscriptions (endpoint, p256dh, auth, lang)
  values (p_endpoint, p_p256dh, p_auth, coalesce(p_lang, 'uz'))
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang;
end;
$$;

create function private.push_unsubscribe(p_endpoint text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$$;

-- For /api/push: claims up to 3 pending news items (so two calls never send the same one twice) and returns them
-- with all subscribers. Pending = visible now, published in the last 3 days, not pushed yet.
create function private.push_pending(p_secret text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  items jsonb;
begin
  if p_secret is null or p_secret <> (select secret from private.push_settings where id = 1) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  with claimed as (
    update public.news n set pushed_at = now()
    where n.id in (
      select id from public.news
      where is_published and pushed_at is null
        and coalesce(published_at, created_at) <= now()
        and coalesce(published_at, created_at) > now() - interval '3 days'
      order by coalesce(published_at, created_at)
      limit 3
      for update skip locked
    )
    returning n.id, n.slug, n.title_uz, n.title_ru, n.title_en, n.body_uz, n.body_ru, n.body_en, n.cover_image
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'slug', slug, 'title_uz', title_uz, 'title_ru', title_ru, 'title_en', title_en,
    'body_uz', left(body_uz, 300), 'body_ru', left(body_ru, 300), 'body_en', left(body_en, 300), 'cover', cover_image
  )), '[]') into items from claimed;

  if jsonb_array_length(items) = 0 then
    return jsonb_build_object('news', items, 'subs', '[]'::jsonb);
  end if;
  return jsonb_build_object(
    'news', items,
    'vapid', (select jsonb_build_object('public', vapid_public, 'private', vapid_private) from private.push_settings where id = 1),
    'subs', (select coalesce(jsonb_agg(jsonb_build_object('endpoint', endpoint, 'p256dh', p256dh, 'auth', auth, 'lang', lang)), '[]')
             from public.push_subscriptions)
  );
end;
$$;

-- For /api/push: removes the endpoints the push services said are gone (the browser unsubscribed or was reset).
create function private.push_forget(p_secret text, p_endpoints text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_secret is null or p_secret <> (select secret from private.push_settings where id = 1) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from public.push_subscriptions where endpoint = any (p_endpoints);
end;
$$;

revoke all on function private.push_subscribe(text, text, text, text), private.push_unsubscribe(text),
  private.push_pending(text), private.push_forget(text, text[]) from public;
grant execute on function private.push_subscribe(text, text, text, text), private.push_unsubscribe(text),
  private.push_pending(text), private.push_forget(text, text[]) to anon, authenticated;

create function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text, p_lang text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.push_subscribe(p_endpoint, p_p256dh, p_auth, p_lang);
$$;

create function public.push_unsubscribe(p_endpoint text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.push_unsubscribe(p_endpoint);
$$;

create function public.push_pending(p_secret text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.push_pending(p_secret);
$$;

create function public.push_forget(p_secret text, p_endpoints text[])
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.push_forget(p_secret, p_endpoints);
$$;

revoke all on function public.push_subscribe(text, text, text, text), public.push_unsubscribe(text),
  public.push_pending(text), public.push_forget(text, text[]) from public;
grant execute on function public.push_subscribe(text, text, text, text), public.push_unsubscribe(text),
  public.push_pending(text), public.push_forget(text, text[]) to anon, authenticated;

-- The public half of the VAPID pair, for the "Bildirishnomani yoqish" button (null until an admin sets it up).
create function private.push_public_key()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select vapid_public from private.push_settings where id = 1;
$$;

-- "Ishga tushirish" in the admin panel stores the pair made on the server — once: a new pair would silently cut off
-- every subscriber.
create function private.push_setup(p_public text, p_private text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update private.push_settings set vapid_public = p_public, vapid_private = p_private
  where id = 1 and vapid_private is null;
end;
$$;

-- For the admin's test notification (sent by the server).
create function private.push_admin_keys()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return (select jsonb_build_object('public', vapid_public, 'private', vapid_private) from private.push_settings where id = 1);
end;
$$;

revoke all on function private.push_public_key(), private.push_setup(text, text), private.push_admin_keys() from public;
grant execute on function private.push_public_key() to anon, authenticated;
grant execute on function private.push_setup(text, text), private.push_admin_keys() to authenticated;

create function public.push_public_key()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select private.push_public_key();
$$;

create function public.push_setup(p_public text, p_private text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.push_setup(p_public, p_private);
$$;

create function public.push_admin_keys()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.push_admin_keys();
$$;

revoke all on function public.push_public_key(), public.push_setup(text, text), public.push_admin_keys() from public;
grant execute on function public.push_public_key() to anon, authenticated;
grant execute on function public.push_setup(text, text), public.push_admin_keys() to authenticated;

-- The 5-minute check: calls the site only when something is waiting.
create function private.push_kick()
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
  if not exists (
    select 1 from public.news
    where is_published and pushed_at is null
      and coalesce(published_at, created_at) <= now()
      and coalesce(published_at, created_at) > now() - interval '3 days'
  ) or not exists (select 1 from public.push_subscriptions) then
    return;
  end if;
  select secret, site_url, vapid_private into s from private.push_settings where id = 1;
  if s.vapid_private is null then
    return;
  end if;
  perform net.http_post(
    url := s.site_url || '/api/push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', s.secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;

revoke all on function private.push_kick() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('web-push', '*/5 * * * *', $cron$select private.push_kick()$cron$);
  end if;
end;
$$;
