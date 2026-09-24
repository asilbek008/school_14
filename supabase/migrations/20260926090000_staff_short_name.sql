-- The teacher's name as eMaktab writes it in timetables ("Familiya I.O."). The staff Excel import
-- matches people by it, and the timetable links a lesson's teacher to their profile through it.
alter table public.staff
  add column short_name text check (char_length(short_name) <= 80);
create unique index staff_short_name_key on public.staff (lower(short_name));
