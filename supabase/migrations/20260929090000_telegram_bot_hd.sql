-- Full-quality Telegram photos. The public preview (t.me/s) only serves ~800px copies; a bot that is
-- an admin of the channel receives the originals (1280px, or 2560px when sent as HD).

-- Bot settings. The token never leaves the server: the admin page does not select it.
alter table public.telegram_settings
  add column bot_token text check (bot_token ~ '^\d+:[A-Za-z0-9_-]{30,}$'),
  add column bot_username text,
  add column bot_offset bigint not null default 0,
  -- A private chat with the bot (someone pressed Start): old posts are forwarded there once to read
  -- their original photos, then deleted.
  add column bot_chat_id bigint,
  add column bot_status text;

-- Best photo of each channel message, as the bot saw it (file_id of the largest size).
create table public.telegram_media (
  channel text not null,
  message_id integer not null,
  file_id text not null,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  primary key (channel, message_id)
);
alter table public.telegram_media enable row level security;
create policy "admins read telegram media" on public.telegram_media
  for select to authenticated using ((select private.is_admin()));

-- Which channel messages hold a post's photos (an album is one message per photo), and whether
-- the article already has the full-quality versions.
alter table public.telegram_posts
  add column photo_ids integer[],
  add column hd boolean not null default false;
