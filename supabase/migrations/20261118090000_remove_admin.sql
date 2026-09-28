-- Taking someone off the team, from the panel. Deleting their public.admins row is what revokes
-- access: every policy asks private.is_admin() / is_editor() / can_teach(), and all three read that
-- table. Their Auth account stays (only the service role could delete it) but it can no longer open
-- anything -- requireAdmin() sends it straight back to the login page. Their Telegram link goes too,
-- so a stale chat cannot receive codes for an account that is no longer staff.
--
-- Same guards as set_admin_role: not yourself (you would lock yourself out mid-click), not the owner,
-- and never the last admin.
create or replace function private.remove_admin(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_user = (select auth.uid()) then
    raise exception 'self' using errcode = 'P0001';
  end if;
  if private.is_owner(p_user) then
    raise exception 'owner' using errcode = 'P0001';
  end if;
  if (select a.role from public.admins a where a.user_id = p_user) = 'admin'
     and (select count(*) from public.admins a where a.role = 'admin') <= 1 then
    raise exception 'last admin' using errcode = 'P0001';
  end if;
  delete from private.admin_tg g where g.user_id = p_user;
  delete from public.admins a where a.user_id = p_user;
end;
$$;
revoke all on function private.remove_admin(uuid) from public, anon, authenticated;
grant execute on function private.remove_admin(uuid) to authenticated;

create or replace function public.remove_admin(p_user uuid) returns void
language sql security invoker set search_path = '' as $$ select private.remove_admin(p_user); $$;
revoke all on function public.remove_admin(uuid) from public, anon;
grant execute on function public.remove_admin(uuid) to authenticated;
