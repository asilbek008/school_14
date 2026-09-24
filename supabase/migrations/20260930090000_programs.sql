-- Regular school programs ("Doimiy tadbirlar"): activities that run all year in rounds or
-- sessions, such as the "Zakovat — O‘quvchilar ligasi" quiz league. Each has its own page, which
-- also lists the news whose title or text mentions its keyword (news imported from Telegram
-- land there without extra work).
create table public.programs (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_uz text not null,
  name_ru text,
  name_en text,
  summary_uz text not null default '', -- one or two lines for the list card
  summary_ru text,
  summary_en text,
  description_uz text not null default '',
  description_ru text,
  description_en text,
  schedule_uz text, -- free text, e.g. "Har oy, juma • 11:00"
  schedule_ru text,
  schedule_en text,
  place_uz text,
  place_ru text,
  place_en text,
  keyword text check (keyword is null or keyword ~ '^[[:alnum:] ‘’''-]{3,40}$'), -- news matching, case-insensitive
  cover text, -- storage path; falls back to the latest related news cover
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger programs_updated_at before update on public.programs
  for each row execute function public.set_updated_at();

alter table public.programs enable row level security;

create policy "read published programs" on public.programs
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert programs" on public.programs
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update programs" on public.programs
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete programs" on public.programs
  for delete to authenticated using ((select private.is_admin()));
