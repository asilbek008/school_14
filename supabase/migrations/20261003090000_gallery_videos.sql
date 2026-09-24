-- Videos in gallery albums: an uploaded file (media/gallery/<album id>/) or a YouTube video id.
-- Kept apart from gallery_photos, which everything else reads as photos (lightbox, counts, the home page).
create table public.gallery_videos (
  id bigint generated always as identity primary key,
  album_id bigint not null references public.gallery_albums (id) on delete cascade,
  kind text not null check (kind in ('video', 'youtube')),
  path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index gallery_videos_album_idx on public.gallery_videos (album_id, sort_order, id);

alter table public.gallery_videos enable row level security;

-- Like the photos: visible when the album itself is visible to the reader.
create policy "read videos of visible albums" on public.gallery_videos
  for select to anon, authenticated using (
    exists (select 1 from public.gallery_albums a where a.id = album_id)
  );
create policy "admins insert gallery videos" on public.gallery_videos
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update gallery videos" on public.gallery_videos
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete gallery videos" on public.gallery_videos
  for delete to authenticated using ((select private.is_admin()));
