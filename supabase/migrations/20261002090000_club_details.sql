-- Clubs, admin improvements (owner's request):
-- * the leader can be picked from the staff list (leader_id; the free-text `leader` stays for someone
--   who is not on staff), so the site links to their profile;
-- * the time is entered as weekdays + start/end time instead of free text (schedule_* stays as an
--   optional note, e.g. "after lessons");
-- * photos and videos per club (club_media): uploaded photos, uploaded video files and YouTube links.
alter table public.clubs
  add column leader_id bigint references public.staff (id) on delete set null,
  add column days smallint[] not null default '{}' check (days <@ array[1, 2, 3, 4, 5, 6]::smallint[]),
  add column start_time time,
  add column end_time time,
  add constraint clubs_time_order check (end_time is null or start_time is null or end_time > start_time);
create index clubs_leader_idx on public.clubs (leader_id);

create table public.club_media (
  id bigint generated always as identity primary key,
  club_id bigint not null references public.clubs (id) on delete cascade,
  -- photo / video: a path in the media bucket; youtube: the video id.
  kind text not null check (kind in ('photo', 'video', 'youtube')),
  path text not null check (char_length(path) between 1 and 300),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index club_media_club_idx on public.club_media (club_id, sort_order, id);

alter table public.club_media enable row level security;

-- Visible when the club is (the clubs read policy decides that), like news_photos.
create policy "read media of visible clubs" on public.club_media
  for select to anon, authenticated using (
    exists (select 1 from public.clubs c where c.id = club_id)
  );
create policy "admins insert club media" on public.club_media
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update club media" on public.club_media
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete club media" on public.club_media
  for delete to authenticated using ((select private.is_admin()));

-- Video files go to the same media bucket: allow MP4/WebM/QuickTime and raise the size limit to
-- 50 MB (photos are still shrunk in the browser before upload, so they stay small).
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
where id = 'media';
