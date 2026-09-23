-- Supabase advisors follow-up:
-- 1. is_admin() is SECURITY DEFINER; in `public` it was callable as /rest/v1/rpc/is_admin.
--    Move it to a `private` schema that PostgREST does not expose. The app checks admin
--    status by reading its own row in public.admins instead.
-- 2. "for all" admin policies overlapped the public SELECT policies (two permissive policies
--    per SELECT). Split them into insert/update/delete so each action has one policy.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function private.is_admin() from public;
-- anon needs it too: read policies call it, and it returns false without a session.
grant execute on function private.is_admin() to anon, authenticated;

-- news, events, staff: one SELECT policy (published or admin) + admin-only writes.
drop policy "public reads published news" on public.news;
drop policy "admins manage news" on public.news;
create policy "read published news" on public.news
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert news" on public.news
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update news" on public.news
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete news" on public.news
  for delete to authenticated using ((select private.is_admin()));

drop policy "public reads published events" on public.events;
drop policy "admins manage events" on public.events;
create policy "read published events" on public.events
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert events" on public.events
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update events" on public.events
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete events" on public.events
  for delete to authenticated using ((select private.is_admin()));

drop policy "public reads published staff" on public.staff;
drop policy "admins manage staff" on public.staff;
create policy "read published staff" on public.staff
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert staff" on public.staff
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update staff" on public.staff
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete staff" on public.staff
  for delete to authenticated using ((select private.is_admin()));

-- pages: everyone reads; only admins write.
drop policy "admins manage pages" on public.pages;
create policy "admins insert pages" on public.pages
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update pages" on public.pages
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete pages" on public.pages
  for delete to authenticated using ((select private.is_admin()));

-- contact_messages: same shape as before, pointing at private.is_admin().
drop policy "admins read contact messages" on public.contact_messages;
drop policy "admins update contact messages" on public.contact_messages;
drop policy "admins delete contact messages" on public.contact_messages;
create policy "admins read contact messages" on public.contact_messages
  for select to authenticated using ((select private.is_admin()));
create policy "admins update contact messages" on public.contact_messages
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete contact messages" on public.contact_messages
  for delete to authenticated using ((select private.is_admin()));

-- storage "media" bucket.
drop policy "admins upload media" on storage.objects;
drop policy "admins update media" on storage.objects;
drop policy "admins delete media" on storage.objects;
create policy "admins upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select private.is_admin()));
create policy "admins update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (select private.is_admin()));
create policy "admins delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select private.is_admin()));

drop function public.is_admin();
