-- Videos from the Telegram channel, and an honest record of each imported photo's size.
--
-- Telegram's public preview page serves a video's file only while it is small; a longer one answers
-- "Media is too big" and no bot can fetch it either (the Bot API caps getFile at 20 MB). So a video
-- arrives one of two ways: small enough to copy into our bucket (`kind = 'file'`), or as a link to the
-- post itself (`kind = 'telegram'`, `path = '<channel>/<message id>'`), shown with the thumbnail we
-- copied and a button that opens Telegram. Nothing is invented and nothing is mirrored that we cannot
-- legally or physically hold.

alter table public.videos
  drop constraint videos_kind_check,
  add constraint videos_kind_check check (kind in ('youtube', 'file', 'telegram'));

alter table public.videos
  /** The original post / page this video came from (shown as "Manba"). */
  add column source_url text,
  add column duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 86400),
  /** The article this video belongs to, when it came from a post that also became news. */
  add column news_id bigint references public.news (id) on delete set null;

create index videos_news_idx on public.videos (news_id) where news_id is not null;

-- One row per channel video, whichever way it arrived: a second sync of the same post must not add it
-- again. The post URL is the identity both kinds carry (an admin-added video leaves it empty), and the
-- path stays unique among linked videos too, since that is what the site builds the Telegram link from.
create unique index videos_source_url_idx on public.videos (source_url) where source_url is not null;
create unique index videos_telegram_path_idx on public.videos (path) where kind = 'telegram';

alter table public.telegram_posts
  add column video_id bigint references public.videos (id) on delete set null,
  /** Long side, in pixels, of the smallest photo copied for this post -- what the site really has.
      The public preview grid gives ~800px copies, and that is its ceiling; only the channel's bot can
      hand over the original, and only when it is an admin of the channel. */
  add column photo_px integer,
  /** Have this post's videos been looked for yet? Posts imported before videos were supported are
      false, so one run at a time goes back and fetches theirs. */
  add column videos_done boolean not null default false,
  /** How often the photos were re-fetched from the channel page, so a post whose copies cannot be
      improved is not asked forever. */
  add column photo_tries smallint not null default 0;
