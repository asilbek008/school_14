-- Remember every imported Telegram post in its own table instead of a column on news/events:
-- a row the admin deletes on the site must not come back on the next sync, and post numbers
-- are only unique within one channel.
alter table public.news drop column telegram_post_id;
alter table public.events drop column telegram_post_id;

create table public.telegram_posts (
  channel text not null,
  post_id integer not null,
  news_id bigint references public.news (id) on delete set null,
  event_id bigint references public.events (id) on delete set null,
  -- Why nothing was created (no text, #saytga_emas, older than import_since, …).
  skipped text,
  imported_at timestamptz not null default now(),
  primary key (channel, post_id)
);
create index telegram_posts_news_idx on public.telegram_posts (news_id);
create index telegram_posts_event_idx on public.telegram_posts (event_id);

-- Written only by the Edge Function (service role); admins can read it.
alter table public.telegram_posts enable row level security;
create policy "admins read telegram posts" on public.telegram_posts
  for select to authenticated using ((select private.is_admin()));
