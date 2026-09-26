-- The school year a news item, event or achievement belongs to, chosen by the admin (owner's request): e.g. an old
-- result added now can go into 2024–2025. Null = by its date (1 September – 31 August, Tashkent time).
alter table public.news add column school_year smallint check (school_year between 2000 and 2100);
alter table public.events add column school_year smallint check (school_year between 2000 and 2100);
alter table public.achievements add column school_year smallint check (school_year between 2000 and 2100);
