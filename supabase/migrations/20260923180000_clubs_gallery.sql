-- Clubs (after-school activities) and a photo gallery (albums of photos).
-- Same security shape as the other content tables: public reads published rows, admins write,
-- one policy per table and action.

create table public.clubs (
  id bigint generated always as identity primary key,
  name_uz text not null,
  name_ru text,
  name_en text,
  description_uz text not null default '',
  description_ru text,
  description_en text,
  schedule_uz text, -- free text, e.g. "Seshanba, Juma • 15:00"
  schedule_ru text,
  schedule_en text,
  place_uz text,
  place_ru text,
  place_en text,
  grade_from smallint check (grade_from between 1 and 11),
  grade_to smallint check (grade_to between 1 and 11),
  leader text,
  photo text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (grade_from is null or grade_to is null or grade_from <= grade_to)
);

create table public.gallery_albums (
  id bigint generated always as identity primary key,
  title_uz text not null,
  title_ru text,
  title_en text,
  description_uz text not null default '',
  description_ru text,
  description_en text,
  event_date date,
  cover_photo text, -- storage path; falls back to the first photo when null
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_photos (
  id bigint generated always as identity primary key,
  album_id bigint not null references public.gallery_albums (id) on delete cascade,
  path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index gallery_photos_album_idx on public.gallery_photos (album_id, sort_order, id);

create trigger clubs_updated_at before update on public.clubs
  for each row execute function public.set_updated_at();
create trigger gallery_albums_updated_at before update on public.gallery_albums
  for each row execute function public.set_updated_at();

alter table public.clubs enable row level security;
alter table public.gallery_albums enable row level security;
alter table public.gallery_photos enable row level security;

create policy "read published clubs" on public.clubs
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert clubs" on public.clubs
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update clubs" on public.clubs
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete clubs" on public.clubs
  for delete to authenticated using ((select private.is_admin()));

create policy "read published albums" on public.gallery_albums
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert albums" on public.gallery_albums
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update albums" on public.gallery_albums
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete albums" on public.gallery_albums
  for delete to authenticated using ((select private.is_admin()));

-- Photos are visible when their album is (the album's own policy decides that).
create policy "read photos of visible albums" on public.gallery_photos
  for select to anon, authenticated using (
    exists (select 1 from public.gallery_albums a where a.id = album_id)
  );
create policy "admins insert photos" on public.gallery_photos
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update photos" on public.gallery_photos
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete photos" on public.gallery_photos
  for delete to authenticated using ((select private.is_admin()));
