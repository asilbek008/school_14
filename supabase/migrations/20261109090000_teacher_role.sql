-- A third role, "teacher" (owner's request): a subject teacher who may write only the learning part of the
-- site — tests, questions, the question bank and its short lessons — and nothing else. Admin and editor
-- are unchanged; RLS decides, the menu only follows.

alter table public.admins drop constraint if exists admins_role_check;
alter table public.admins add constraint admins_role_check check (role in ('admin', 'editor', 'teacher'));

create function private.can_teach()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.staff_role() in ('admin', 'editor', 'teacher'), false);
$$;

revoke execute on function private.can_teach() from public;
grant execute on function private.can_teach() to anon, authenticated;

-- Tests, questions, short lessons and the answer statistics: editors' checks become "can teach" checks.
alter policy "read published tests" on public.tests
  using (is_published or (select private.can_teach()));
alter policy "admins insert tests" on public.tests
  with check ((select private.can_teach()));
alter policy "admins update tests" on public.tests
  using ((select private.can_teach())) with check ((select private.can_teach()));
alter policy "admins delete tests" on public.tests
  using ((select private.can_teach()));

alter policy "admins insert questions" on public.test_questions
  with check ((select private.can_teach()));
alter policy "admins update questions" on public.test_questions
  using ((select private.can_teach())) with check ((select private.can_teach()));
alter policy "admins delete questions" on public.test_questions
  using ((select private.can_teach()));

alter policy "read published notes" on public.study_notes
  using (is_published or (select private.can_teach()));
alter policy "editors insert notes" on public.study_notes
  with check ((select private.can_teach()));
alter policy "editors update notes" on public.study_notes
  using ((select private.can_teach())) with check ((select private.can_teach()));
alter policy "editors delete notes" on public.study_notes
  using ((select private.can_teach()));

alter policy "editors read question stats" on public.question_stats
  using ((select private.can_teach()));

-- Question pictures go to the same bucket, so uploading is opened to teachers as well.
alter policy "admins upload media" on storage.objects
  with check (bucket_id = 'media' and (select private.can_teach()));
alter policy "admins update media" on storage.objects
  using (bucket_id = 'media' and (select private.can_teach()));
alter policy "admins delete media" on storage.objects
  using (bucket_id = 'media' and (select private.can_teach()));

-- "Jamoa" may now also hand out the teacher role.
create or replace function private.set_admin_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'editor', 'teacher') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  if p_user = (select auth.uid()) then
    raise exception 'own role' using errcode = 'P0001';
  end if;
  update public.admins set role = p_role where user_id = p_user;
end;
$$;

revoke all on function private.set_admin_role(uuid, text) from public, anon;
grant execute on function private.set_admin_role(uuid, text) to authenticated;
