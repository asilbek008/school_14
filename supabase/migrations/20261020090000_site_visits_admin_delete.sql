-- The admin's own browsing is not part of the visitor statistics: when a browser opens the admin panel,
-- its earlier page views are removed (by its anonymous visitor id) and it stops counting.
create policy "admins delete site visits" on public.site_visits
  for delete to authenticated using ((select private.is_admin()));
