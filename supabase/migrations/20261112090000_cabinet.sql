-- "Shaxsiy kabinet" (owner's request): a pupil's own test results and learning-path progress, kept on the
-- server so they follow them from phone to computer. No registration and no personal data: the parents'
-- bot binds a chat to a key, the browser keeps the key, and the row holds only what the browser already
-- kept in localStorage (results and topic counters). Everything lives in `private`; the browser reaches it
-- through the functions below, never through the table.

create table private.cabinets (
  id bigint generated always as identity primary key,
  /** The secret the browser keeps; whoever has it sees only this cabinet. */
  key text not null unique,
  chat_id bigint not null unique,
  class_id bigint references public.school_classes (id) on delete set null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One-time tokens for t.me/<bot>?start=cab_<token>.
create table private.cabinet_links (
  token text primary key,
  key text,
  created_at timestamptz not null default now()
);

/** A browser asks for a link token; the bot turns it into a cabinet. */
create function private.cabinet_link()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  delete from private.cabinet_links where created_at < now() - interval '15 minutes';
  if (select count(*) from private.cabinet_links where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  v_token := replace(gen_random_uuid()::text, '-', '');
  insert into private.cabinet_links (token) values (v_token);
  return v_token;
end;
$$;

/** The bot's side (service role only): binds the chat, making a cabinet if this chat has none. */
create function private.cabinet_claim(p_token text, p_chat_id bigint)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_key text;
begin
  if not exists (select 1 from private.cabinet_links where token = p_token and created_at > now() - interval '15 minutes') then
    return jsonb_build_object('ok', false);
  end if;
  select c.key into v_key from private.cabinets c where c.chat_id = p_chat_id;
  if v_key is null then
    v_key := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    insert into private.cabinets (key, chat_id) values (v_key, p_chat_id);
  end if;
  update private.cabinet_links set key = v_key where token = p_token;
  return jsonb_build_object('ok', true);
end;
$$;

/** The browser polls with its token until the bot has bound it, then keeps the key. */
create function private.cabinet_check(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  l record;
begin
  select * into l from private.cabinet_links where token = p_token and created_at > now() - interval '15 minutes';
  if l is null or l.key is null then
    return jsonb_build_object('waiting', true);
  end if;
  -- One use: the token is spent as soon as the key leaves.
  delete from private.cabinet_links where token = p_token;
  return jsonb_build_object('key', l.key, 'data', (select c.data from private.cabinets c where c.key = l.key));
end;
$$;

/** Reads a cabinet by its key. */
create function private.cabinet_load(p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c record;
begin
  select * into c from private.cabinets where key = p_key;
  if c is null then
    return jsonb_build_object('error', 'not_found');
  end if;
  return jsonb_build_object('data', c.data, 'updated_at', c.updated_at, 'class_id', c.class_id);
end;
$$;

/** Writes the browser's own progress back (at most 64 KB, so nothing else can be parked here). */
create function private.cabinet_save(p_key text, p_data jsonb, p_class integer default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' or length(p_data::text) > 65536 then
    return jsonb_build_object('error', 'too_big');
  end if;
  update private.cabinets
     set data = p_data,
         class_id = coalesce(p_class, class_id),
         updated_at = now()
   where key = p_key;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

/** Forgets everything: the pupil unlinks the cabinet from the site. */
create function private.cabinet_forget(p_key text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from private.cabinets where key = p_key;
$$;

create function public.cabinet_link() returns text
language sql security invoker set search_path = '' as $$ select private.cabinet_link(); $$;
create function public.cabinet_check(p_token text) returns jsonb
language sql security invoker set search_path = '' as $$ select private.cabinet_check(p_token); $$;
create function public.cabinet_load(p_key text) returns jsonb
language sql security invoker set search_path = '' as $$ select private.cabinet_load(p_key); $$;
create function public.cabinet_save(p_key text, p_data jsonb, p_class integer default null) returns jsonb
language sql security invoker set search_path = '' as $$ select private.cabinet_save(p_key, p_data, p_class); $$;
create function public.cabinet_forget(p_key text) returns void
language sql security invoker set search_path = '' as $$ select private.cabinet_forget(p_key); $$;
create function public.cabinet_claim(p_token text, p_chat_id bigint) returns jsonb
language sql security invoker set search_path = '' as $$ select private.cabinet_claim(p_token, p_chat_id); $$;

revoke all on function
  private.cabinet_link(), private.cabinet_check(text), private.cabinet_load(text),
  private.cabinet_save(text, jsonb, integer), private.cabinet_forget(text), private.cabinet_claim(text, bigint)
from public, anon, authenticated;
grant execute on function
  private.cabinet_link(), private.cabinet_check(text), private.cabinet_load(text),
  private.cabinet_save(text, jsonb, integer), private.cabinet_forget(text)
to anon, authenticated;
grant execute on function private.cabinet_claim(text, bigint) to service_role;

revoke all on function
  public.cabinet_link(), public.cabinet_check(text), public.cabinet_load(text),
  public.cabinet_save(text, jsonb, integer), public.cabinet_forget(text), public.cabinet_claim(text, bigint)
from public, anon, authenticated;
grant execute on function
  public.cabinet_link(), public.cabinet_check(text), public.cabinet_load(text),
  public.cabinet_save(text, jsonb, integer), public.cabinet_forget(text)
to anon, authenticated;
grant execute on function public.cabinet_claim(text, bigint) to service_role;
