-- Applied once to production. The first regular program, from the school's own Telegram posts
-- (news 39 and 41, September 2026).
insert into public.programs (slug, name_uz, name_ru, name_en, summary_uz, summary_ru, summary_en,
  description_uz, description_ru, description_en, place_uz, place_ru, place_en, keyword, sort_order)
values (
  'zakovat',
  'Zakovat — O‘quvchilar ligasi',
  'Заковат — Лига учеников',
  'Zakovat — Students’ League',
  '“Zakovat” intellektual klubi doirasidagi o‘quvchilar ligasi: jamoalar bilim, mantiq va tezkor fikrlashda bellashadi.',
  'Лига учеников интеллектуального клуба «Заковат»: команды соревнуются в знаниях, логике и быстроте мышления.',
  'The student league of the “Zakovat” quiz club: teams compete in knowledge, logic and quick thinking.',
  'Maktabimizda “Zakovat” intellektual klubi doirasida “O‘quvchilar ligasi” tashkil etilgan. Liga o‘quvchilarning intellektual salohiyatini oshirish, mantiqiy va tanqidiy fikrlash qobiliyatlarini rivojlantirishga qaratilgan.

Turnir respublika miqyosida o‘tkaziladi. O‘quvchilar jamoa bo‘lib bilim, mantiqiy fikrlash, tezkor qaror qabul qilish va jamoaviy ishlash qobiliyatlarini sinovdan o‘tkazadilar.

Maktabimizdan “BENOM”, “PARLAMENT”, “TITUL”, “VORTEKS” va “DIAMONDS” jamoalari qatnashmoqda.',
  'В нашей школе в рамках интеллектуального клуба «Заковат» создана «Лига учеников». Лига помогает ученикам развивать интеллект, логическое и критическое мышление.

Турнир проводится в масштабах республики. Ученики в командах проверяют знания, логику, быстроту решений и умение работать вместе.

От нашей школы участвуют команды «BENOM», «PARLAMENT», «TITUL», «VORTEKS» и «DIAMONDS».',
  'Our school runs the “Students’ League” of the “Zakovat” quiz club. The league helps students grow their knowledge and their logical and critical thinking.

The tournament is held across the country. Students play in teams, testing their knowledge, logic, quick decisions and teamwork.

Our school is represented by the teams “BENOM”, “PARLAMENT”, “TITUL”, “VORTEKS” and “DIAMONDS”.',
  'Geografiya xonasi', 'Кабинет географии', 'Geography room',
  'zakovat', 10
);
