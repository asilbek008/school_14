-- Ma'lumotnoma buyurtmasi (owner's pick #6) and following a request by its code (#7).
--
-- A parent orders a reference from the site instead of coming to the school for it, and can then check
-- whether it is ready. The same code follows an admission application, so both live on one status page.
--
-- Nothing personal is ever returned by the lookup: the code answers only "which kind, which state, when".

-- A code a parent can read out over the phone: no 0/O/1/I to confuse, 8 characters out of 32 (~10^12).
create or replace function private.new_code(p_prefix text) returns text
language sql volatile set search_path = '' as $$
  select p_prefix || '-' || string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, 8);
$$;
revoke all on function private.new_code(text) from public, anon, authenticated;

create table public.reference_requests (
  id bigint generated always as identity primary key,
  code text not null unique,
  -- oquvchi: "o‘qiyotgani haqida", arxiv: bitirgan yillar uchun, boshqa: erkin so‘rov
  kind text not null check (kind in ('oquvchi', 'arxiv', 'boshqa')),
  child_name text not null,
  grade smallint check (grade between 1 and 11),
  parent_name text not null,
  phone text not null,
  -- "qayerga kerak" — bog‘cha, mahalla, harbiy komissariat…
  purpose text,
  note text,
  status text not null default 'new' check (status in ('new', 'ready', 'given', 'declined')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ready_at timestamptz
);
create index reference_requests_created_idx on public.reference_requests (created_at desc);
create index reference_requests_status_idx on public.reference_requests (status);

alter table public.reference_requests enable row level security;

-- Like admission applications: a child's details are the school's to see, never the site's.
create policy "admins read references" on public.reference_requests for select to authenticated using (private.is_admin());
create policy "admins update references" on public.reference_requests for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admins delete references" on public.reference_requests for delete to authenticated using (private.is_admin());
-- No insert policy at all: the only way in is submit_reference() below, which checks the input first.

create trigger reference_requests_updated_at before update on public.reference_requests
  for each row execute function set_updated_at();
create trigger reference_requests_audit after insert or update or delete on public.reference_requests
  for each row execute function private.log_change();

create or replace function private.reference_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (
    select count(*) from public.reference_requests r
    where r.created_at > now() - interval '10 minutes' and r.phone = new.phone
  ) >= 3
  or (select count(*) from public.reference_requests r where r.created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger reference_requests_rate_limit before insert on public.reference_requests
  for each row execute function private.reference_rate_limit();

create or replace function private.notify_reference() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  s record;
  body text;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    return new;
  end if;
  select bot_token, bot_chat_id, notify_messages into s from public.telegram_settings where id = 1;
  if s is null or not s.notify_messages or s.bot_token is null or s.bot_chat_id is null then
    return new;
  end if;

  body := concat_ws(
    E'\n',
    '📄 Ma’lumotnoma buyurtmasi · ' || new.code,
    '',
    '👦 ' || new.child_name || case when new.grade is not null then ' (' || new.grade || '-sinf)' else '' end,
    '👤 ' || new.parent_name,
    '📞 ' || new.phone,
    case when new.purpose is not null then '📌 ' || new.purpose else null end,
    case when new.note is not null then E'\n' || left(new.note, 1000) else null end
  );
  perform net.http_post(
    url := 'https://api.telegram.org/bot' || s.bot_token || '/sendMessage',
    body := jsonb_build_object('chat_id', s.bot_chat_id, 'text', body, 'disable_web_page_preview', true),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
exception when others then
  return new;
end;
$$;
create trigger reference_requests_notify after insert on public.reference_requests
  for each row execute function private.notify_reference();

-- An admission application gets a code too, so the same page follows both.
alter table public.admission_applications add column code text unique;
update public.admission_applications set code = private.new_code('Q') where code is null;

create or replace function private.submit_reference(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_code text;
  v_kind text := coalesce(p ->> 'kind', '');
  v_grade smallint := nullif(p ->> 'grade', '')::smallint;
begin
  if v_kind not in ('oquvchi', 'arxiv', 'boshqa')
     or length(coalesce(p ->> 'child_name', '')) < 3
     or length(coalesce(p ->> 'parent_name', '')) < 3
     or length(coalesce(p ->> 'phone', '')) < 7 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  loop
    v_code := private.new_code('M');
    exit when not exists (select 1 from public.reference_requests r where r.code = v_code);
  end loop;

  insert into public.reference_requests (code, kind, child_name, grade, parent_name, phone, purpose, note)
  values (
    v_code, v_kind,
    left(p ->> 'child_name', 200), v_grade,
    left(p ->> 'parent_name', 200), left(p ->> 'phone', 50),
    nullif(left(p ->> 'purpose', 300), ''), nullif(left(p ->> 'note', 2000), '')
  );
  return jsonb_build_object('ok', true, 'code', v_code);
exception
  when sqlstate 'P0001' then return jsonb_build_object('ok', false, 'error', 'rate_limited');
  when others then return jsonb_build_object('ok', false, 'error', 'failed');
end;
$$;

-- The admission form goes through a function too now, so the parent leaves with a code in hand.
create or replace function private.submit_admission(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_code text;
  v_grade smallint := nullif(p ->> 'grade', '')::smallint;
begin
  if length(coalesce(p ->> 'child_name', '')) < 3
     or length(coalesce(p ->> 'parent_name', '')) < 3
     or length(coalesce(p ->> 'phone', '')) < 7
     or v_grade is null or v_grade < 1 or v_grade > 11
     or (p ->> 'child_birth_date') is null then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  loop
    v_code := private.new_code('Q');
    exit when not exists (select 1 from public.admission_applications a where a.code = v_code);
  end loop;

  insert into public.admission_applications
    (code, child_name, child_birth_date, grade, parent_name, phone, address, previous_school, note)
  values (
    v_code, left(p ->> 'child_name', 200), (p ->> 'child_birth_date')::date, v_grade,
    left(p ->> 'parent_name', 200), left(p ->> 'phone', 50),
    nullif(left(p ->> 'address', 500), ''), nullif(left(p ->> 'previous_school', 300), ''),
    nullif(left(p ->> 'note', 2000), '')
  );
  return jsonb_build_object('ok', true, 'code', v_code);
exception
  when sqlstate 'P0001' then return jsonb_build_object('ok', false, 'error', 'rate_limited');
  when others then return jsonb_build_object('ok', false, 'error', 'failed');
end;
$$;

-- What a code may reveal: which kind of request, what state it is in, and the dates. No name, no phone,
-- no internal note — so a code that falls into the wrong hands still gives nothing away about a child.
create or replace function private.request_status(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  r record;
begin
  if length(v_code) < 6 then
    return jsonb_build_object('ok', false);
  end if;

  select 'reference' as sort, x.kind, x.status, x.created_at, x.ready_at into r
  from public.reference_requests x where x.code = v_code;
  if found then
    return jsonb_build_object('ok', true, 'sort', r.sort, 'kind', r.kind, 'status', r.status,
                              'created_at', r.created_at, 'ready_at', r.ready_at);
  end if;

  select 'admission' as sort, a.grade::text as kind, a.status, a.created_at, null::timestamptz as ready_at into r
  from public.admission_applications a where a.code = v_code;
  if found then
    return jsonb_build_object('ok', true, 'sort', r.sort, 'kind', r.kind, 'status', r.status,
                              'created_at', r.created_at, 'ready_at', r.ready_at);
  end if;

  return jsonb_build_object('ok', false);
end;
$$;

revoke all on function private.submit_reference(jsonb), private.submit_admission(jsonb), private.request_status(text)
  from public, anon, authenticated;
grant execute on function private.submit_reference(jsonb), private.submit_admission(jsonb), private.request_status(text)
  to anon, authenticated;

create or replace function public.submit_reference(p jsonb) returns jsonb
language sql security invoker set search_path = '' as $$ select private.submit_reference(p); $$;
create or replace function public.submit_admission(p jsonb) returns jsonb
language sql security invoker set search_path = '' as $$ select private.submit_admission(p); $$;
create or replace function public.request_status(p_code text) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.request_status(p_code); $$;

revoke all on function public.submit_reference(jsonb), public.submit_admission(jsonb), public.request_status(text) from public;
grant execute on function public.submit_reference(jsonb), public.submit_admission(jsonb), public.request_status(text)
  to anon, authenticated;
