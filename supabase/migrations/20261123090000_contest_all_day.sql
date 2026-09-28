-- An outside contest usually announces a day, not a clock time ("12-noyabr"). Storing a made-up 00:00 and
-- printing it would be inventing a detail the announcement never gave, so mark those the way events already
-- do (see events.all_day): kept as Tashkent 00:00, shown as a date alone.
alter table public.contests add column all_day boolean not null default false;
