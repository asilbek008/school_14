-- 2026–2027 o‘quv yili taqvimi — egasi yuborgan rasmiy kalendardan (Maktabgacha va maktab ta’limi vazirligi, @infoeduUZ).
-- Davlat bayramlari bu yerda emas: ular `events` jadvalida («Bayram» turkumi) allaqachon bor.
-- Yozgi ta’til kalendarda «25-maydan 1-sentabrgacha»: 25-may — o‘qishning oxirgi kuni (4-chorak), shuning uchun 26-maydan.

insert into public.calendar_periods (kind, title_uz, title_ru, title_en, note_uz, note_ru, note_en, starts_on, ends_on) values
  ('chorak', '1-chorak', '1-я четверть', 'Term 1',
    'O‘quv yili 2-sentabrda boshlanadi.', 'Учебный год начинается 2 сентября.', 'The school year starts on 2 September.',
    '2026-09-02', '2026-11-03'),
  ('tatil', 'Kuzgi ta’til', 'Осенние каникулы', 'Autumn holiday', null, null, null, '2026-11-04', '2026-11-09'),
  ('chorak', '2-chorak', '2-я четверть', 'Term 2', null, null, null, '2026-11-10', '2026-12-27'),
  ('tatil', 'Qishki ta’til', 'Зимние каникулы', 'Winter holiday', null, null, null, '2026-12-28', '2027-01-10'),
  ('chorak', '3-chorak', '3-я четверть', 'Term 3', null, null, null, '2027-01-11', '2027-03-20'),
  ('tatil', 'Bahorgi ta’til', 'Весенние каникулы', 'Spring holiday', null, null, null, '2027-03-21', '2027-03-27'),
  ('chorak', '4-chorak', '4-я четверть', 'Term 4',
    'O‘qishning oxirgi kuni — 25-may.', 'Последний учебный день — 25 мая.', 'The last school day is 25 May.',
    '2027-03-28', '2027-05-25'),
  ('tatil', 'Yozgi ta’til', 'Летние каникулы', 'Summer holiday',
    'Yangi o‘quv yili 1-sentabrdan.', 'Новый учебный год — с 1 сентября.', 'The new school year begins on 1 September.',
    '2027-05-26', '2027-08-31');
