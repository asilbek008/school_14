-- Initial content for the 2026–2027 school year (applied once to the production project).
-- National holidays are published. School-internal events have unconfirmed dates, so they
-- are inserted as drafts (is_published = false) for the school to check and publish.

-- All-day rows: 00:00–23:59 Tashkent time.
with h(d, cat, pub, t_uz, t_ru, t_en, d_uz, d_ru, d_en) as (values
  ('2026-09-01', 'bayram', true, 'Mustaqillik kuni', 'День независимости', 'Independence Day',
   'O‘zbekiston Respublikasi Mustaqillik kuni — umumxalq bayrami.', 'День независимости Республики Узбекистан — всенародный праздник.', 'Independence Day of the Republic of Uzbekistan, a national holiday.'),
  ('2026-10-01', 'bayram', true, 'O‘qituvchi va murabbiylar kuni', 'День учителя и наставника', 'Teachers’ and Mentors’ Day',
   'Ustozlarni kasb bayrami bilan tabriklaymiz.', 'Поздравляем учителей с профессиональным праздником.', 'We congratulate our teachers on their professional holiday.'),
  ('2026-10-21', 'bayram', true, 'O‘zbek tili bayrami kuni', 'День узбекского языка', 'Uzbek Language Day',
   'Ona tilimizga bag‘ishlangan bayram.', 'Праздник, посвящённый узбекскому языку.', 'A day dedicated to the Uzbek language.'),
  ('2026-12-08', 'bayram', true, 'Konstitutsiya kuni', 'День Конституции', 'Constitution Day',
   'O‘zbekiston Respublikasi Konstitutsiyasi qabul qilingan kun.', 'День принятия Конституции Республики Узбекистан.', 'The day the Constitution of the Republic of Uzbekistan was adopted.'),
  ('2027-01-01', 'bayram', true, 'Yangi yil', 'Новый год', 'New Year’s Day',
   'Yangi yil bayrami.', 'Праздник Нового года.', 'New Year holiday.'),
  ('2027-01-14', 'bayram', true, 'Vatan himoyachilari kuni', 'День защитников Родины', 'Defenders of the Motherland Day',
   'Vatan himoyachilariga bag‘ishlangan kun.', 'День, посвящённый защитникам Родины.', 'A day honouring the defenders of the Motherland.'),
  ('2027-02-09', 'bayram', true, 'Alisher Navoiy tavallud kuni', 'День рождения Алишера Навои', 'Birthday of Alisher Navoi',
   'Buyuk shoir va mutafakkir Alisher Navoiy tavallud topgan kun.', 'День рождения великого поэта и мыслителя Алишера Навои.', 'Birthday of the great poet and thinker Alisher Navoi.'),
  ('2027-03-08', 'bayram', true, 'Xalqaro xotin-qizlar kuni', 'Международный женский день', 'International Women’s Day',
   'Onalar, ustozlar va qizlarni tabriklaymiz.', 'Поздравляем мам, учителей и девочек.', 'We congratulate mothers, teachers and girls.'),
  ('2027-03-21', 'bayram', true, 'Navro‘z bayrami', 'Навруз', 'Navruz',
   'Navro‘z umumxalq bayrami.', 'Всенародный праздник Навруз.', 'The national holiday of Navruz.'),
  ('2027-05-09', 'bayram', true, 'Xotira va qadrlash kuni', 'День памяти и почестей', 'Day of Remembrance and Honour',
   'Xotira va qadrlash kuni.', 'День памяти и почестей.', 'Day of Remembrance and Honour.'),
  ('2027-06-01', 'bayram', true, 'Xalqaro bolalarni himoya qilish kuni', 'Международный день защиты детей', 'International Children’s Day',
   'Bolalar bayrami.', 'Праздник для детей.', 'A holiday for children.'),
  -- Drafts: dates from the design mockup, not yet confirmed by the school.
  ('2026-09-02', 'maktab', false, 'Bilimlar kuni — Birinchi qo‘ng‘iroq', 'День знаний — Первый звонок', 'Knowledge Day — First Bell',
   '2026–2027 o‘quv yilining boshlanishi.', 'Начало 2026–2027 учебного года.', 'The start of the 2026–2027 school year.'),
  ('2026-10-10', 'maktab', false, 'Umumiy ota-onalar yig‘ilishi', 'Общее родительское собрание', 'General parents’ meeting',
   'O‘quv yili boshidagi tashkiliy masalalar. Vaqtini sinf rahbarlari e’lon qiladi.', 'Организационные вопросы начала учебного года. Время сообщат классные руководители.', 'Organisational matters for the new school year. Homeroom teachers will announce the time.'),
  ('2026-10-24', 'sport', false, 'Maktab sport musobaqasi', 'Школьные спортивные соревнования', 'School sports competition',
   'Sinflararo futbol, voleybol va yengil atletika bo‘yicha musobaqa.', 'Межклассные соревнования по футболу, волейболу и лёгкой атлетике.', 'Inter-class football, volleyball and athletics competition.'),
  ('2026-11-10', 'olimpiada', false, 'Fan olimpiadasi — maktab bosqichi', 'Предметная олимпиада — школьный этап', 'Subject olympiad — school stage',
   'G‘oliblar tuman bosqichiga yo‘llanadi.', 'Победители проходят на районный этап.', 'Winners go on to the district stage.'),
  ('2026-12-26', 'maktab', false, 'Yangi yil tantanalari', 'Новогодние праздники', 'New Year celebrations',
   'Boshlang‘ich va yuqori sinflar uchun bayram dasturi.', 'Праздничная программа для начальных и старших классов.', 'Holiday programme for primary and senior grades.'),
  ('2027-05-25', 'maktab', false, 'So‘nggi qo‘ng‘iroq', 'Последний звонок', 'Last Bell',
   'O‘quv yilining yakuni va bitiruvchilar tantanasi.', 'Завершение учебного года и праздник выпускников.', 'End of the school year and graduation ceremony.')
)
insert into public.events
  (title_uz, title_ru, title_en, description_uz, description_ru, description_en,
   category, all_day, is_published, starts_at, ends_at)
select t_uz, t_ru, t_en, d_uz, d_ru, d_en, cat, true, pub,
       (d::timestamp) at time zone 'Asia/Tashkent',
       (d::timestamp + interval '23 hours 59 minutes') at time zone 'Asia/Tashkent'
from h;

-- News. The teachers' day notice announces a school event, so it starts as a draft too.
insert into public.news
  (slug, category, is_published, published_at, title_uz, title_ru, title_en, body_uz, body_ru, body_en)
values
  ('rasmiy-sayt-ishga-tushdi', 'yangilik', true, '2026-09-23 09:00+05',
   'Maktabimizning rasmiy sayti ishga tushdi', 'Официальный сайт нашей школы запущен', 'Our school’s official website is live',
   E'Hurmatli ota-onalar va o‘quvchilar! 14-sonli umumta’lim maktabining rasmiy sayti ishga tushirildi.\n\nSaytda quyidagilarni topasiz:\n• qo‘ng‘iroqlar jadvali va smenalar\n• maktab yangiliklari, e’lonlari va tadbirlari\n• o‘qituvchilar ro‘yxati\n• ota-onalar uchun savol-javoblar\n\nSayt o‘zbek, rus va ingliz tillarida, telefon va kompyuterda birdek qulay ishlaydi. Savol va takliflaringizni “Aloqa” sahifasi orqali yuboring.',
   E'Уважаемые родители и ученики! Запущен официальный сайт общеобразовательной школы №14.\n\nНа сайте вы найдёте:\n• расписание звонков и смены\n• новости, объявления и мероприятия школы\n• список учителей\n• ответы на вопросы родителей\n\nСайт работает на узбекском, русском и английском языках и одинаково удобен на телефоне и компьютере. Вопросы и предложения отправляйте через страницу «Контакты».',
   E'Dear parents and students! The official website of General Secondary School No. 14 is now live.\n\nOn the website you will find:\n• the bell schedule and shifts\n• school news, announcements and events\n• the list of teachers\n• answers to parents’ questions\n\nThe site is available in Uzbek, Russian and English and works equally well on phones and computers. Send questions and suggestions through the Contact page.'),
  ('oqituvchilar-kuni-2026', 'tadbir', false, '2026-09-22 09:00+05',
   '1-oktabr — O‘qituvchi va murabbiylar kuni', '1 октября — День учителя и наставника', '1 October — Teachers’ and Mentors’ Day',
   E'1-oktabr — O‘qituvchi va murabbiylar kuni. Shu munosabat bilan maktabimizda bayram tadbiri o‘tkaziladi.\n\nTadbir dasturi va vaqti sinf rahbarlari orqali e’lon qilinadi.',
   E'1 октября — День учителя и наставника. По этому случаю в нашей школе пройдёт праздничное мероприятие.\n\nПрограмму и время сообщат классные руководители.',
   E'1 October is Teachers’ and Mentors’ Day. Our school will hold a celebration for the occasion.\n\nHomeroom teachers will announce the programme and time.'),
  ('emaktab-elektron-kundalik', 'elon', true, '2026-09-15 09:00+05',
   'Baholar va uy vazifalarini eMaktab.uz orqali kuzating', 'Следите за оценками и домашними заданиями в eMaktab.uz', 'Follow grades and homework on eMaktab.uz',
   E'Hurmatli ota-onalar! Farzandingizning o‘qishini kuzatish uchun eMaktab.uz elektron kundaligidan foydalaning.\n\nElektron kundalikda:\n• joriy baholar\n• davomat\n• uy vazifalari\n\nKirish ma’lumotlari bo‘yicha farzandingizning sinf rahbariga murojaat qiling.',
   E'Уважаемые родители! Следите за учёбой ребёнка в электронном дневнике eMaktab.uz.\n\nВ электронном дневнике:\n• текущие оценки\n• посещаемость\n• домашние задания\n\nЗа данными для входа обратитесь к классному руководителю.',
   E'Dear parents! Use the eMaktab.uz electronic diary to follow your child’s studies.\n\nIn the electronic diary:\n• current grades\n• attendance\n• homework\n\nAsk your child’s homeroom teacher for login details.'),
  ('ikki-smenali-dars-tartibi', 'elon', true, '2026-09-05 09:00+05',
   'Ikki smenali dars tartibi: qaysi sinf qachon o‘qiydi', 'Две смены: какой класс когда учится', 'Two shifts: which grades study when',
   E'2026–2027 o‘quv yilida maktabimizda darslar ikki smenada olib boriladi.\n\n1-smena (08:00 dan):\n• 1, 2, 5, 9, 10 va 11-sinflar\n\n2-smena (13:00 dan):\n• 3, 4, 6, 7 va 8-sinflar\n\nHar bir dars 45 daqiqa davom etadi, darslar orasida 5 daqiqalik tanaffus bor. Dars vaqtlarini “Qo‘ng‘iroqlar jadvali” sahifasida ko‘rishingiz mumkin.',
   E'В 2026–2027 учебном году занятия в нашей школе проходят в две смены.\n\n1-я смена (с 08:00):\n• 1, 2, 5, 9, 10 и 11 классы\n\n2-я смена (с 13:00):\n• 3, 4, 6, 7 и 8 классы\n\nУрок длится 45 минут, между уроками перемена 5 минут. Время уроков — на странице «Расписание звонков».',
   E'In the 2026–2027 school year, classes run in two shifts.\n\nShift 1 (from 08:00):\n• grades 1, 2, 5, 9, 10 and 11\n\nShift 2 (from 13:00):\n• grades 3, 4, 6, 7 and 8\n\nEach lesson lasts 45 minutes with a 5-minute break between lessons. Lesson times are on the Bell schedule page.'),
  ('2026-2027-oquv-yili-boshlandi', 'yangilik', true, '2026-09-02 09:00+05',
   '2026–2027 o‘quv yili boshlandi', 'Начался 2026–2027 учебный год', 'The 2026–2027 school year has begun',
   E'2-sentabr — Bilimlar kuni bilan maktabimizda yangi o‘quv yili boshlandi.\n\nBu o‘quv yilida:\n• 1001 nafar o‘quvchi\n• 45 ta sinf-komplekt (1–11-sinflar)\n• 72 nafar pedagog va xodim\n\nBarcha o‘quvchilarga yangi o‘quv yilida muvaffaqiyatlar tilaymiz!',
   E'2 сентября, в День знаний, в нашей школе начался новый учебный год.\n\nВ этом учебном году:\n• 1001 ученик\n• 45 классов-комплектов (1–11 классы)\n• 72 педагога и сотрудника\n\nЖелаем всем ученикам успехов в новом учебном году!',
   E'On 2 September, Knowledge Day, the new school year began at our school.\n\nThis school year:\n• 1001 students\n• 45 classes (grades 1–11)\n• 72 teachers and staff\n\nWe wish all our students a successful school year!');
