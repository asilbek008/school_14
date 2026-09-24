-- Online admission applications. A parent leaves the child's details on the site; the school calls back.
-- This is a child's personal data, so it is never shown on the public site: anyone may insert, only
-- admins may read. The site asks for no document numbers — those are handed over at the school.

create table public.admission_applications (
  id bigint generated always as identity primary key,
  child_name text not null check (char_length(child_name) between 3 and 200),
  child_birth_date date not null check (child_birth_date > '2000-01-01' and child_birth_date < now()),
  grade smallint not null check (grade between 1 and 11),
  parent_name text not null check (char_length(parent_name) between 3 and 200),
  phone text not null check (char_length(phone) between 7 and 50),
  address text check (address is null or char_length(address) <= 500),
  previous_school text check (previous_school is null or char_length(previous_school) <= 300),
  note text check (note is null or char_length(note) <= 2000),
  -- Where the school got to with it: new → contacted (called back) → accepted or declined.
  status text not null default 'new' check (status in ('new', 'contacted', 'accepted', 'declined')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admission_applications_updated_at before update on public.admission_applications
  for each row execute function public.set_updated_at();

alter table public.admission_applications enable row level security;
create policy "anyone applies" on public.admission_applications
  for insert to anon, authenticated with check (true);
create policy "admins read applications" on public.admission_applications
  for select to authenticated using ((select private.is_admin()));
create policy "admins update applications" on public.admission_applications
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete applications" on public.admission_applications
  for delete to authenticated using ((select private.is_admin()));

create index admission_applications_created_idx on public.admission_applications (created_at desc);

-- Spam guard: 2 applications in 10 minutes from one phone, 20 in all (a family with several children still fits).
create function private.admission_rate_limit() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.admission_applications a
    where a.created_at > now() - interval '10 minutes' and a.phone = new.phone
  ) >= 2
  or (select count(*) from public.admission_applications a where a.created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function private.admission_rate_limit() from public, anon, authenticated;

create trigger admission_applications_rate_limit before insert on public.admission_applications
  for each row execute function private.admission_rate_limit();

-- Telegram notice, like the contact form's.
create function private.notify_admission() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
    '🎒 Yangi qabul arizasi · ' || new.grade || '-sinf',
    '',
    '👦 ' || new.child_name || ' (' || to_char(new.child_birth_date, 'DD.MM.YYYY') || ')',
    '👤 ' || new.parent_name,
    '📞 ' || new.phone,
    case when new.address is not null then '📍 ' || new.address else null end,
    case when new.previous_school is not null then '🏫 ' || new.previous_school else null end,
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
revoke all on function private.notify_admission() from public, anon, authenticated;

create trigger admission_applications_notify after insert on public.admission_applications
  for each row execute function private.notify_admission();
