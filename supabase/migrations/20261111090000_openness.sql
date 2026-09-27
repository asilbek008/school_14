-- "Ochiqlik" (owner's request): the figures a school is expected to publish — budget, sponsorship, purchases
-- and reports. Only what the school itself confirms is entered; each row may carry an amount, a period, a
-- note and a link (to a document already in the site's documents section, or to an official site).

create table public.openness_items (
  id bigint generated always as identity primary key,
  category text not null default 'boshqa' check (category in ('byudjet', 'homiylik', 'xarid', 'hisobot', 'boshqa')),
  title_uz text not null,
  title_ru text,
  title_en text,
  note_uz text,
  note_ru text,
  note_en text,
  /** In so'm; empty when the row is a report rather than a figure. */
  amount numeric(14, 2) check (amount is null or amount >= 0),
  /** Free text: "2026-yil 1-chorak", "2026–2027 o‘quv yili". */
  period text,
  happened_on date,
  document_id bigint references public.documents (id) on delete set null,
  url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index openness_items_category_idx on public.openness_items (category, sort_order);

create trigger openness_items_updated_at before update on public.openness_items
  for each row execute function public.set_updated_at();

alter table public.openness_items enable row level security;
create policy "read published openness" on public.openness_items
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert openness" on public.openness_items
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update openness" on public.openness_items
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete openness" on public.openness_items
  for delete to authenticated using ((select private.is_admin()));

create trigger openness_items_audit after insert or update or delete on public.openness_items
  for each row execute function private.log_change();
