-- Scheduled news: a published item dated in the future stays off the site until that moment. The pages
-- are rebuilt every 5 minutes, so it appears within minutes of its time with no job to run. Photos and
-- videos follow, as their read policies check that the news row is visible.

drop policy "read published news" on public.news;
create policy "read published news" on public.news
  for select to anon, authenticated using (
    (is_published and (published_at is null or published_at <= now())) or (select private.is_admin())
  );
