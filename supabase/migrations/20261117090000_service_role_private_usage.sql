-- Why the bot links kept saying "Havola eskirgan", in both bots at once.
--
-- The public wrappers are `security invoker` on purpose: the caller's own rights decide, and the
-- private function behind them does the privileged work. Those wrappers were granted to service_role
-- (the key Supabase injects into the Edge Functions) and the private functions were granted to it
-- too -- but `private` itself was never granted `usage` to service_role, only to anon and
-- authenticated. So every call an Edge Function made through such a wrapper died on
-- "permission denied for schema private" before it reached the function, the bot saw an error
-- instead of a result, and told the user the link had expired. Creating the link works from the
-- browser (anon has usage), claiming it from the bot never could.
--
-- The same silent failure hits admin_tg_claim (admin 2FA link), cabinet_claim (pupil cabinet),
-- ai_config + ai_guard (the AI assistant) and staff_invite_lookup + staff_invite_complete
-- (the new invite link).
--
-- Usage alone grants nothing: no table in `private` is granted to service_role, so this only lets it
-- run the six functions it was explicitly given `execute` on.
grant usage on schema private to service_role;

-- The school's own account must never lose the panel. The first admin row is the owner: their role
-- cannot be changed and their second step cannot be reset by anyone else, and the last admin cannot
-- be demoted, so there is always someone who can let the others back in.
create or replace function private.is_owner(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user is not null and p_user = (
    select a.user_id from public.admins a order by a.created_at, a.user_id limit 1
  );
$$;
revoke all on function private.is_owner(uuid) from public, anon, authenticated;

create or replace function private.set_admin_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = '' as $$
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
  if private.is_owner(p_user) then
    raise exception 'owner' using errcode = 'P0001';
  end if;
  -- Never leave the school without a full admin.
  if p_role <> 'admin'
     and (select a.role from public.admins a where a.user_id = p_user) = 'admin'
     and (select count(*) from public.admins a where a.role = 'admin') <= 1 then
    raise exception 'last admin' using errcode = 'P0001';
  end if;
  update public.admins set role = p_role where user_id = p_user;
end;
$$;

create or replace function private.reset_mfa(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if private.is_owner(p_user) and p_user <> (select auth.uid()) then
    raise exception 'owner' using errcode = 'P0001';
  end if;
  delete from auth.mfa_factors f where f.user_id = p_user;
end;
$$;

create or replace function private.admin_tg_reset(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if private.is_owner(p_user) and p_user <> (select auth.uid()) then
    raise exception 'owner' using errcode = 'P0001';
  end if;
  delete from private.admin_tg g where g.user_id = p_user;
end;
$$;

-- The team list says who the owner is, so the panel can show it and hide the buttons that would fail.
drop function if exists private.admin_team();
create function private.admin_team()
returns table (user_id uuid, email text, role text, mfa boolean, tg boolean, owner boolean, last_sign_in_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select a.user_id, u.email::text, a.role,
      exists (select 1 from auth.mfa_factors f where f.user_id = a.user_id and f.status = 'verified'),
      exists (select 1 from private.admin_tg g where g.user_id = a.user_id and g.enabled),
      private.is_owner(a.user_id),
      u.last_sign_in_at
    from public.admins a join auth.users u on u.id = a.user_id
    order by a.role, u.email;
end;
$$;
revoke all on function private.admin_team() from public, anon, authenticated;
grant execute on function private.admin_team() to authenticated;

drop function if exists public.admin_team();
create function public.admin_team()
returns table (user_id uuid, email text, role text, mfa boolean, tg boolean, owner boolean, last_sign_in_at timestamptz)
language sql security invoker set search_path = '' as $$ select * from private.admin_team(); $$;
revoke all on function public.admin_team() from public, anon;
grant execute on function public.admin_team() to authenticated;
