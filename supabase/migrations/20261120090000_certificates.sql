-- Sertifikatni tekshirish (owner's pick #9). A practice-test certificate is drawn in the browser and nothing
-- is stored -- which also means nobody can tell a real one from a picture edited in a phone. Registering is
-- therefore opt-in: only when the pupil ticks the box does the name land here, in exchange for a QR and a code
-- anyone can check. Unticked, the certificate is made exactly as before and this table never hears about it.
create table public.certificates (
  id bigint generated always as identity primary key,
  code text not null unique,
  name text not null,
  test_title text not null,
  percent smallint not null check (percent between 0 and 100),
  correct smallint not null check (correct >= 0),
  total smallint not null check (total > 0),
  issued_on date not null,
  created_at timestamptz not null default now()
);
create index certificates_created_idx on public.certificates (created_at desc);

alter table public.certificates enable row level security;

-- Reading the row wholesale is the school's; everyone else goes through verify_certificate() by code.
create policy "admins read certificates" on public.certificates for select to authenticated using (private.is_admin());
create policy "admins delete certificates" on public.certificates for delete to authenticated using (private.is_admin());

create or replace function private.register_certificate(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_code text;
  v_name text := btrim(coalesce(p ->> 'name', ''));
  v_title text := btrim(coalesce(p ->> 'test_title', ''));
  v_percent smallint := nullif(p ->> 'percent', '')::smallint;
  v_correct smallint := nullif(p ->> 'correct', '')::smallint;
  v_total smallint := nullif(p ->> 'total', '')::smallint;
  v_day date := nullif(p ->> 'issued_on', '')::date;
begin
  if length(v_name) < 3 or length(v_name) > 60 or length(v_title) < 1
     or v_percent is null or v_percent < 0 or v_percent > 100
     or v_correct is null or v_total is null or v_total < 1 or v_correct > v_total
     or v_day is null then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  -- Downloading the same certificate twice should not mint a second code.
  select c.code into v_code from public.certificates c
  where c.name = v_name and c.test_title = left(v_title, 200) and c.percent = v_percent and c.issued_on = v_day
  limit 1;
  if v_code is not null then
    return jsonb_build_object('ok', true, 'code', v_code, 'again', true);
  end if;

  if (select count(*) from public.certificates c where c.created_at > now() - interval '10 minutes') >= 60 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  loop
    v_code := private.new_code('S');
    exit when not exists (select 1 from public.certificates c where c.code = v_code);
  end loop;

  insert into public.certificates (code, name, test_title, percent, correct, total, issued_on)
  values (v_code, v_name, left(v_title, 200), v_percent, v_correct, v_total, v_day);
  return jsonb_build_object('ok', true, 'code', v_code);
exception when others then
  return jsonb_build_object('ok', false, 'error', 'failed');
end;
$$;

-- Verification returns the name on purpose: confirming it is the whole point of checking a certificate.
-- Only a code that was actually issued opens anything, and the codes are not enumerable.
create or replace function private.verify_certificate(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_code text := upper(btrim(coalesce(p_code, '')));
  c record;
begin
  if length(v_code) < 6 then
    return jsonb_build_object('ok', false);
  end if;
  select * into c from public.certificates x where x.code = v_code;
  if not found then
    return jsonb_build_object('ok', false);
  end if;
  return jsonb_build_object('ok', true, 'name', c.name, 'test', c.test_title, 'percent', c.percent,
                            'correct', c.correct, 'total', c.total, 'issued_on', c.issued_on, 'code', c.code);
end;
$$;

revoke all on function private.register_certificate(jsonb), private.verify_certificate(text) from public, anon, authenticated;
grant execute on function private.register_certificate(jsonb), private.verify_certificate(text) to anon, authenticated;

create or replace function public.register_certificate(p jsonb) returns jsonb
language sql security invoker set search_path = '' as $$ select private.register_certificate(p); $$;
create or replace function public.verify_certificate(p_code text) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.verify_certificate(p_code); $$;

revoke all on function public.register_certificate(jsonb), public.verify_certificate(text) from public;
grant execute on function public.register_certificate(jsonb), public.verify_certificate(text) to anon, authenticated;
