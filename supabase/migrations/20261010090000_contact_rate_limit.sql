-- Spam guard for the contact form (anyone may insert): at most 3 messages in 10 minutes from the same phone
-- or email, and 30 in 10 minutes in all. The check runs in the database, so it holds even for requests
-- that skip the site's form; the site shows "try again later" (error code P0001, message 'rate_limited').

create function private.contact_rate_limit() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.contact_messages m
    where m.created_at > now() - interval '10 minutes'
      and ((new.phone is not null and m.phone = new.phone) or (new.email is not null and lower(m.email) = lower(new.email)))
  ) >= 3
  or (select count(*) from public.contact_messages m where m.created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function private.contact_rate_limit() from public, anon, authenticated;

create trigger contact_messages_rate_limit before insert on public.contact_messages
  for each row execute function private.contact_rate_limit();

-- The recent-messages lookups above.
create index contact_messages_created_idx on public.contact_messages (created_at desc);
