-- Photo gallery of a news article (the cover stays in news.cover_image). Photos are visible when
-- their article is (the news read policy decides that), like gallery_photos and albums.
create table public.news_photos (
  id bigint generated always as identity primary key,
  news_id bigint not null references public.news (id) on delete cascade,
  path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index news_photos_news_idx on public.news_photos (news_id, sort_order, id);

alter table public.news_photos enable row level security;

create policy "read photos of visible news" on public.news_photos
  for select to anon, authenticated using (
    exists (select 1 from public.news n where n.id = news_id)
  );
create policy "admins insert news photos" on public.news_photos
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update news photos" on public.news_photos
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete news photos" on public.news_photos
  for delete to authenticated using ((select private.is_admin()));
