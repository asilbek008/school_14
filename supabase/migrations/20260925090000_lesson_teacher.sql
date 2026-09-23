-- Teacher shown next to each lesson, as eMaktab exports it ("Surname I.O.").
-- Plain text rather than a link to staff: the timetable is imported before the staff list exists.
alter table public.lessons add column teacher text check (char_length(teacher) <= 80);
