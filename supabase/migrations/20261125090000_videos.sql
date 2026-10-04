-- "Video" (owner's request): until now every video on the site was hidden inside something else -- an
-- album, a club, a news item -- so a parent looking for "the concert video" had nowhere to go. This is a
-- section of its own: each row is one video, with its own title, description and category.
--
-- A video is either a YouTube video (`kind = 'youtube'`, `path` = the 11-character id) or a file in the
-- media bucket (`kind = 'file'`, `path` = the object path). YouTube is the first choice: it is free, it
-- streams at whatever quality the phone's connection can carry, and the bucket caps a file at 50 MB.

create table public.videos (
  id bigint generated always as identity primary key,
  title_uz text not null,
  title_ru text,
  title_en text,
  description_uz text,
  description_ru text,
  description_en text,
  category text not null default 'boshqa'
    check (category in ('tadbir', 'dars', 'togarak', 'tanishtiruv', 'yutuq', 'boshqa')),
  kind text not null check (kind in ('youtube', 'file')),
  /** A YouTube video id, or a path inside the media bucket. */
  path text not null,
  /** Poster for an uploaded file (a YouTube video has its own thumbnail). */
  cover text,
  recorded_on date,
  /** Chosen school year; empty means "by recorded_on". */
  school_year integer check (school_year is null or (school_year between 2000 and 2100)),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index videos_published_idx on public.videos (is_published, sort_order, recorded_on desc, id desc);

create trigger videos_updated_at before update on public.videos
  for each row execute function public.set_updated_at();

alter table public.videos enable row level security;
create policy "read published videos" on public.videos
  for select to anon, authenticated using (is_published or (select private.is_admin()));
-- Like news and the gallery, a video is content an editor may add.
create policy "editors insert videos" on public.videos
  for insert to authenticated with check ((select private.is_editor()));
create policy "editors update videos" on public.videos
  for update to authenticated using ((select private.is_editor())) with check ((select private.is_editor()));
create policy "editors delete videos" on public.videos
  for delete to authenticated using ((select private.is_editor()));

create trigger videos_audit after insert or update or delete on public.videos
  for each row execute function private.log_change();
