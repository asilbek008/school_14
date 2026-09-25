-- "Yutuqlar devori": olympiad, sports and contest results. A result names the class or team; pupils'
-- names are shown only with their parents' consent, and the table refuses names without the consent
-- box ticked (owner's rule: no pupil's personal data on the public site without it).

create table public.achievements (
  id bigint generated always as identity primary key,
  title_uz text not null,
  title_ru text,
  title_en text,
  field text not null default 'olimpiada' check (field in ('olimpiada', 'sport', 'tanlov', 'boshqa')),
  level text not null default 'tuman' check (level in ('maktab', 'tuman', 'viloyat', 'respublika', 'xalqaro')),
  -- 1, 2 or 3; empty for a certificate or honourable mention (described in result_*).
  place smallint check (place between 1 and 3),
  result_uz text,
  result_ru text,
  result_en text,
  -- Who won: a class ("9-A") or a team name.
  winner text,
  names text,
  names_consent boolean not null default false,
  teacher_id bigint references public.staff (id) on delete set null,
  achieved_on date not null,
  photo text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint achievements_names_consent check (names is null or names_consent)
);

create trigger achievements_updated_at before update on public.achievements
  for each row execute function public.set_updated_at();

alter table public.achievements enable row level security;
create policy "read published achievements" on public.achievements
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert achievements" on public.achievements
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update achievements" on public.achievements
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete achievements" on public.achievements
  for delete to authenticated using ((select private.is_admin()));

create index achievements_achieved_idx on public.achievements (achieved_on desc);
create index achievements_teacher_idx on public.achievements (teacher_id);
