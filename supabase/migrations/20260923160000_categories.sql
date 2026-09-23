-- Categories for news and events, plus all-day events (holidays have no time of day).

alter table public.news
  add column category text not null default 'yangilik'
    check (category in ('yangilik', 'elon', 'tadbir', 'yutuq'));

alter table public.events
  add column category text not null default 'maktab'
    check (category in ('bayram', 'maktab', 'olimpiada', 'sport')),
  -- All-day events are stored as 00:00–23:59 Tashkent time so the upcoming/past split still
  -- works during the day itself; the site shows only the date for them.
  add column all_day boolean not null default false;
