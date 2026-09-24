-- School years ("2025–2026 o‘quv yili"): the header's year switcher lists them, and each has a page with
-- its numbers, a summary written by the admin, and the news, events and albums dated in that year
-- (1 September – 31 August). Only confirmed figures go here, so every number may stay empty.

create table public.school_years (
  start_year smallint primary key check (start_year between 2000 and 2100),
  summary_uz text not null default '',
  summary_ru text,
  summary_en text,
  students integer check (students >= 0),
  staff integer check (staff >= 0),
  classes integer check (classes >= 0),
  graduates integer check (graduates >= 0),
  is_published boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger school_years_updated_at before update on public.school_years
  for each row execute function public.set_updated_at();

alter table public.school_years enable row level security;
create policy "read published school years" on public.school_years
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert school years" on public.school_years
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update school years" on public.school_years
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete school years" on public.school_years
  for delete to authenticated using ((select private.is_admin()));

-- The two years before the site (owner's request); their text and numbers are filled in the admin panel.
insert into public.school_years (start_year) values (2024), (2025), (2026);
