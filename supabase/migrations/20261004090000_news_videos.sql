-- Videos in a news article: an uploaded file (media/news/<id>/) or a YouTube video id.
-- Visible when the article is (the news read policy decides that), like news_photos.
create table public.news_videos (
  id bigint generated always as identity primary key,
  news_id bigint not null references public.news (id) on delete cascade,
  kind text not null check (kind in ('video', 'youtube')),
  path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index news_videos_news_idx on public.news_videos (news_id, sort_order, id);

alter table public.news_videos enable row level security;

create policy "read videos of visible news" on public.news_videos
  for select to anon, authenticated using (
    exists (select 1 from public.news n where n.id = news_id)
  );
create policy "admins insert news videos" on public.news_videos
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update news videos" on public.news_videos
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete news videos" on public.news_videos
  for delete to authenticated using ((select private.is_admin()));
