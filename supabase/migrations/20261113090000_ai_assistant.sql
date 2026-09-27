-- The site's AI assistant (owner's request): answers questions about the school from the site's own content,
-- in the visitor's language. The API key is entered by the owner in the admin panel and never leaves the
-- database: the Edge Function (service role) reads it, the browser never sees it.

create table private.ai_settings (
  id integer primary key default 1 check (id = 1),
  provider text not null default 'anthropic' check (provider in ('anthropic')),
  api_key text,
  model text not null default 'claude-haiku-4-5-20251001',
  enabled boolean not null default false,
  /** Answers per visitor per hour, and for the whole site per hour. */
  per_visitor integer not null default 20,
  per_hour integer not null default 300,
  updated_at timestamptz not null default now()
);
insert into private.ai_settings (id) values (1);

-- What was asked, so the school can see what people look for (and turn the commonest into an FAQ entry).
-- No name, no IP: only the question, the language and how it went.
create table private.ai_questions (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  lang text,
  question text not null,
  ok boolean not null default true,
  visitor text
);
create index ai_questions_at_idx on private.ai_questions (at desc);

/** Is the assistant on? The only thing the site itself needs to know. */
create function private.ai_status()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select enabled and api_key is not null from private.ai_settings where id = 1), false);
$$;

/** The Edge Function's view (service role only): the key, the model and the limits. */
create function private.ai_config()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('key', api_key, 'model', model, 'enabled', enabled, 'per_visitor', per_visitor, 'per_hour', per_hour)
  from private.ai_settings where id = 1;
$$;

/** Counts a question and says whether it is within the limits (service role only). */
create function private.ai_guard(p_visitor text, p_lang text, p_question text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  s record;
begin
  delete from private.ai_questions where at < now() - interval '90 days';
  select per_visitor, per_hour into s from private.ai_settings where id = 1;
  if (select count(*) from private.ai_questions q where q.at > now() - interval '1 hour') >= coalesce(s.per_hour, 300) then
    return false;
  end if;
  if p_visitor is not null
     and (select count(*) from private.ai_questions q where q.visitor = p_visitor and q.at > now() - interval '1 hour') >= coalesce(s.per_visitor, 20) then
    return false;
  end if;
  insert into private.ai_questions (lang, question, visitor) values (p_lang, left(p_question, 500), left(p_visitor, 64));
  return true;
end;
$$;

/** The admin panel: the settings without the key itself, and the latest questions. */
create function private.ai_admin()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s record;
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into s from private.ai_settings where id = 1;
  return jsonb_build_object(
    'enabled', s.enabled,
    'model', s.model,
    'has_key', s.api_key is not null,
    'per_visitor', s.per_visitor,
    'per_hour', s.per_hour,
    'today', (select count(*) from private.ai_questions q where q.at > now() - interval '24 hours'),
    'total', (select count(*) from private.ai_questions),
    'recent', coalesce((select jsonb_agg(jsonb_build_object('at', q.at, 'lang', q.lang, 'question', q.question, 'ok', q.ok))
                        from (select * from private.ai_questions order by at desc limit 50) q), '[]'::jsonb)
  );
end;
$$;

/** Saves the key (only when a new one is given), the model and the switch. */
create function private.ai_save(p_key text, p_model text, p_enabled boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update private.ai_settings
     set api_key = case when p_key is null or p_key = '' then api_key else p_key end,
         model = coalesce(nullif(p_model, ''), model),
         enabled = coalesce(p_enabled, enabled),
         updated_at = now()
   where id = 1;
end;
$$;

/** Removes the key: the assistant goes quiet until a new one is entered. */
create function private.ai_forget()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update private.ai_settings set api_key = null, enabled = false, updated_at = now() where id = 1;
end;
$$;

create function public.ai_status() returns boolean
language sql security invoker set search_path = '' as $$ select private.ai_status(); $$;
create function public.ai_config() returns jsonb
language sql security invoker set search_path = '' as $$ select private.ai_config(); $$;
create function public.ai_guard(p_visitor text, p_lang text, p_question text) returns boolean
language sql security invoker set search_path = '' as $$ select private.ai_guard(p_visitor, p_lang, p_question); $$;
create function public.ai_admin() returns jsonb
language sql security invoker set search_path = '' as $$ select private.ai_admin(); $$;
create function public.ai_save(p_key text, p_model text, p_enabled boolean) returns void
language sql security invoker set search_path = '' as $$ select private.ai_save(p_key, p_model, p_enabled); $$;
create function public.ai_forget() returns void
language sql security invoker set search_path = '' as $$ select private.ai_forget(); $$;

revoke all on function
  private.ai_status(), private.ai_config(), private.ai_guard(text, text, text), private.ai_admin(),
  private.ai_save(text, text, boolean), private.ai_forget()
from public, anon, authenticated;
grant execute on function private.ai_status() to anon, authenticated;
grant execute on function private.ai_admin(), private.ai_save(text, text, boolean), private.ai_forget() to authenticated;
grant execute on function private.ai_config(), private.ai_guard(text, text, text) to service_role;

revoke all on function
  public.ai_status(), public.ai_config(), public.ai_guard(text, text, text), public.ai_admin(),
  public.ai_save(text, text, boolean), public.ai_forget()
from public, anon, authenticated;
grant execute on function public.ai_status() to anon, authenticated;
grant execute on function public.ai_admin(), public.ai_save(text, text, boolean), public.ai_forget() to authenticated;
grant execute on function public.ai_config(), public.ai_guard(text, text, text) to service_role;
