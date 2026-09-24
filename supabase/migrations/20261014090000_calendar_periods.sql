-- "O‘quv yili taqvimi": the school year's quarters, holidays and exam weeks, entered by the admin once
-- the ministry's order is out (only confirmed dates). Public holidays are not repeated here — the
-- calendar page takes them from events (category 'bayram').

create table public.calendar_periods (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('chorak', 'tatil', 'imtihon', 'boshqa')),
  title_uz text not null,
  title_ru text,
  title_en text,
  note_uz text,
  note_ru text,
  note_en text,
  starts_on date not null,
  ends_on date not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_periods_range check (ends_on >= starts_on)
);

create trigger calendar_periods_updated_at before update on public.calendar_periods
  for each row execute function public.set_updated_at();

alter table public.calendar_periods enable row level security;
create policy "read published calendar periods" on public.calendar_periods
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert calendar periods" on public.calendar_periods
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update calendar periods" on public.calendar_periods
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete calendar periods" on public.calendar_periods
  for delete to authenticated using ((select private.is_admin()));

create index calendar_periods_starts_idx on public.calendar_periods (starts_on);
