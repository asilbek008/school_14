-- Initial schema for the School No. 14 website.
-- Translatable text is stored per locale: *_uz (required), *_ru, *_en (optional, fall back to uz).

-- ---------------------------------------------------------------------------
-- Admins: users listed here may write content. Add rows manually after the
-- staff member signs up (Auth → Users), e.g.
--   insert into public.admins (user_id) values ('<auth user uuid>');
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_admin() from public;
-- anon needs it too: read policies call it, and it returns false without a session.
grant execute on function public.is_admin() to anon, authenticated;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Content tables
-- ---------------------------------------------------------------------------
create table public.news (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title_uz text not null,
  title_ru text,
  title_en text,
  body_uz text not null default '',
  body_ru text,
  body_en text,
  cover_image text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index news_published_idx on public.news (published_at desc) where is_published;

create table public.events (
  id bigint generated always as identity primary key,
  title_uz text not null,
  title_ru text,
  title_en text,
  description_uz text not null default '',
  description_ru text,
  description_en text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index events_starts_at_idx on public.events (starts_at) where is_published;

create table public.staff (
  id bigint generated always as identity primary key,
  full_name text not null,
  position_uz text not null,
  position_ru text,
  position_en text,
  subject_uz text,
  subject_ru text,
  subject_en text,
  photo text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pages (
  slug text primary key, -- e.g. 'about', 'admissions'
  title_uz text not null,
  title_ru text,
  title_en text,
  body_uz text not null default '',
  body_ru text,
  body_en text,
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 200),
  email text check (email is null or char_length(email) <= 320),
  phone text check (phone is null or char_length(phone) <= 50),
  message text not null check (char_length(message) between 1 and 5000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create trigger news_updated_at before update on public.news
  for each row execute function public.set_updated_at();
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger staff_updated_at before update on public.staff
  for each row execute function public.set_updated_at();
create trigger pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Anonymous visitors: read published content, submit contact messages.
-- Admins: full access.
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.news enable row level security;
alter table public.events enable row level security;
alter table public.staff enable row level security;
alter table public.pages enable row level security;
alter table public.contact_messages enable row level security;

create policy "admins read own row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "public reads published news" on public.news
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "admins manage news" on public.news
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "public reads published events" on public.events
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "admins manage events" on public.events
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "public reads published staff" on public.staff
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "admins manage staff" on public.staff
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "public reads pages" on public.pages
  for select to anon, authenticated using (true);
create policy "admins manage pages" on public.pages
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "anyone submits contact message" on public.contact_messages
  for insert to anon, authenticated with check (not is_read);
create policy "admins read contact messages" on public.contact_messages
  for select to authenticated using ((select public.is_admin()));
create policy "admins update contact messages" on public.contact_messages
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete contact messages" on public.contact_messages
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Storage: public "media" bucket for photos; only admins upload/change.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "admins upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select public.is_admin()));
create policy "admins update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (select public.is_admin()));
create policy "admins delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select public.is_admin()));

-- Placeholder rows for editable pages; real text comes later from the school.
insert into public.pages (slug, title_uz, title_ru, title_en) values
  ('about', 'Maktab haqida', 'О школе', 'About the school'),
  ('admissions', 'Qabul', 'Приём', 'Admissions');
