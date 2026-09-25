-- "Tashriflar": page views on the public site, for the admin panel. A visitor is anonymous: the browser
-- keeps a random id (localStorage) and a per-visit session id (sessionStorage); no IP, name or cookie is
-- stored — only the page, time, approximate place (Vercel's geo headers, city level), the device type and
-- the referring site. Browsers asking not to be tracked (DNT / GPC) are not counted.

create table public.site_visits (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  path text not null check (char_length(path) between 1 and 300),
  lang text check (lang in ('uz', 'ru', 'en')),
  visitor uuid not null,
  session uuid not null,
  referrer text check (referrer is null or char_length(referrer) <= 100),
  city text check (city is null or char_length(city) <= 100),
  region text check (region is null or char_length(region) <= 10),
  country text check (country is null or char_length(country) <= 2),
  device text check (device is null or char_length(device) <= 120),
  mobile boolean not null default false
);

alter table public.site_visits enable row level security;
create policy "record site visits" on public.site_visits
  for insert to anon, authenticated with check (true);
create policy "admins read site visits" on public.site_visits
  for select to authenticated using ((select private.is_admin()));

create index site_visits_at_idx on public.site_visits (at desc);
create index site_visits_session_idx on public.site_visits (session, at desc);

-- Server time only; a runaway tab (over 60 views a minute per visit) or a flood (over 3000 an hour) is
-- dropped quietly; views older than a year are removed.
create function private.site_visit_guard() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.at := now();
  if (select count(*) from public.site_visits v where v.session = new.session and v.at > now() - interval '1 minute') >= 60
    or (select count(*) from public.site_visits v where v.at > now() - interval '1 hour') >= 3000 then
    return null;
  end if;
  delete from public.site_visits v where v.at < now() - interval '1 year';
  return new;
end;
$$;
revoke all on function private.site_visit_guard() from public, anon, authenticated;

create trigger site_visits_guard before insert on public.site_visits
  for each row execute function private.site_visit_guard();

-- Totals for the admin page, counted in the database (the API returns at most 1000 rows). Runs with the
-- caller's rights, so only an admin gets anything back.
create function public.visit_stats(p_days integer default 30)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with period as (
    select v.*, (v.at at time zone 'Asia/Tashkent')::date as day
    from public.site_visits v
    where v.at >= ((now() at time zone 'Asia/Tashkent')::date - (greatest(p_days, 1) - 1)) at time zone 'Asia/Tashkent'
  ),
  firsts as (
    select v.visitor, min(v.at) as first_at from public.site_visits v group by v.visitor
  )
  select jsonb_build_object(
    'views', (select count(*) from period),
    'visitors', (select count(distinct visitor) from period),
    'sessions', (select count(distinct session) from period),
    'new_visitors', (select count(*) from firsts f where f.visitor in (select visitor from period)
                       and f.first_at >= (select min(at) from period)),
    'mobile_share', (select round(100.0 * count(*) filter (where mobile) / nullif(count(*), 0)) from period),
    'online', (select count(distinct v.session) from public.site_visits v where v.at > now() - interval '5 minutes'),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'views', coalesce(c.views, 0), 'visitors', coalesce(c.visitors, 0)) order by d.day), '[]')
      from generate_series((now() at time zone 'Asia/Tashkent')::date - (greatest(p_days, 1) - 1), (now() at time zone 'Asia/Tashkent')::date, interval '1 day') as d(day)
      left join (select p.day, count(*) as views, count(distinct p.visitor) as visitors from period p group by p.day) c on c.day = d.day::date
    ),
    'pages', (select coalesce(jsonb_agg(t), '[]') from (select path, count(*) as views from period group by path order by 2 desc limit 10) t),
    'places', (select coalesce(jsonb_agg(t), '[]') from (
      select city, region, country, count(*) as views, count(distinct visitor) as visitors
      from period group by city, region, country order by 5 desc, 4 desc limit 10) t),
    'devices', (select coalesce(jsonb_agg(t), '[]') from (select coalesce(device, '—') as device, count(distinct visitor) as visitors from period group by 1 order by 2 desc limit 8) t),
    'referrers', (select coalesce(jsonb_agg(t), '[]') from (
      select referrer, count(distinct session) as sessions from period where referrer is not null group by referrer order by 2 desc limit 8) t),
    'langs', (select coalesce(jsonb_agg(t), '[]') from (select lang, count(*) as views from period where lang is not null group by lang order by 2 desc) t)
  );
$$;
revoke all on function public.visit_stats(integer) from public, anon;
grant execute on function public.visit_stats(integer) to authenticated;
