-- Which league round ("tur") a program photo or video belongs to; null = the program in general. The program page
-- groups photos by round (with the photos of related news that name a round).
alter table public.program_media add column round smallint check (round between 1 and 30);
