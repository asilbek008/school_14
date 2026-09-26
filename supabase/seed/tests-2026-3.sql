-- The question bank, part 3, and the first lessons of the learning path (scripts/seed_tests_3.py).
begin;
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('Ingliz tili | CEFR B1: grammatika, lug‘at va o‘qish', 'Milliy sertifikat va CEFR (B1) formatidagi mashq: zamonlar, shart gaplar, majhul nisbat, modal fe’llar, sifat darajalari, predloglar, o‘zlashtirma gap, lug‘at va qisqa matn.', 'ingliz', 'mavzu', null, 30, '14-maktab: fan dasturlari asosida sayt uchun tuzilgan original mashq savollari (2026, 3-qism). O‘qituvchilar tekshirib, to‘ldirib boradi.', 31, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, topic, difficulty, sort_order) values
  ((select id from t), 'She ___ in London since 2019.', array['lives', 'is living', 'lived', 'has lived'], 3, 'Since + boshlangan vaqt — Present Perfect.', 'Present Perfect', 2, 1),
  ((select id from t), 'I have never ___ sushi.', array['ate', 'eaten', 'eat', 'eating'], 1, 'have + V3 (eat – ate – eaten).', 'Present Perfect', 1, 2),
  ((select id from t), '___ you ever been to Samarkand?', array['Did', 'Were', 'Are', 'Have'], 3, 'Ever bilan tajriba haqida so‘roq — Have you ever…?', 'Present Perfect', 1, 3),
  ((select id from t), 'We ___ the film yet.', array['don''t see', 'haven''t seen', 'aren''t seeing', 'didn''t see'], 1, 'Yet inkor gapda Present Perfect bilan.', 'Present Perfect', 2, 4),
  ((select id from t), 'Yesterday I ___ my grandmother.', array['was visit', 'visit', 'visited', 'have visited'], 2, 'Yesterday — aniq o‘tgan vaqt, Past Simple.', 'Past Simple', 1, 5),
  ((select id from t), 'When I was a child, I ___ swim well.', array['shouldn''t', 'couldn''t', 'can''t', 'mustn''t'], 1, 'O‘tgan zamondagi qobiliyat — could / couldn''t.', 'Modal verbs', 2, 6),
  ((select id from t), 'He ___ TV when the phone rang.', array['watched', 'was watching', 'has watched', 'is watching'], 1, 'Davom etayotgan ish (Past Continuous) + qisqa voqea (Past Simple).', 'Past Continuous', 2, 7),
  ((select id from t), 'If it rains tomorrow, we ___ at home.', array['stay', 'will stay', 'stayed', 'would stay'], 1, '1-tur shart gap: If + Present Simple, will + V1.', 'Conditionals', 2, 8),
  ((select id from t), 'If I ___ rich, I would travel the world.', array['have been', 'will be', 'were', 'am'], 2, '2-tur shart gap: If + Past Simple (were), would + V1.', 'Conditionals', 2, 9),
  ((select id from t), 'If you heat ice, it ___.', array['will melted', 'melted', 'would melt', 'melts'], 3, '0-tur shart gap (umumiy haqiqat): ikkala qismda Present Simple.', 'Conditionals', 1, 10),
  ((select id from t), 'This bridge ___ in 1995.', array['is building', 'built', 'was built', 'has built'], 2, 'Majhul nisbat, o‘tgan zamon: was/were + V3.', 'Passive voice', 2, 11),
  ((select id from t), 'English ___ in many countries.', array['is spoken', 'spoke', 'is speaking', 'speaks'], 0, 'Majhul nisbat, hozirgi zamon: am/is/are + V3.', 'Passive voice', 1, 12),
  ((select id from t), 'The letters ___ tomorrow.', array['will be sent', 'sent', 'are sending', 'will send'], 0, 'Kelasi zamon majhul nisbati: will be + V3.', 'Passive voice', 2, 13),
  ((select id from t), 'You ___ wear a seatbelt in a car. It''s the law.', array['would', 'can', 'might', 'must'], 3, 'Qonun, qat’iy majburiyat — must.', 'Modal verbs', 1, 14),
  ((select id from t), 'You ___ bring food — there is a café here.', array['don''t have to', 'mustn''t', 'shouldn''t to', 'can''t'], 0, 'Don''t have to — shart emas; mustn''t — mumkin emas (taqiq).', 'Modal verbs', 3, 15),
  ((select id from t), 'This book is ___ than that one.', array['interestinger', 'more interestinger', 'more interesting', 'most interesting'], 2, 'Uzun sifatlar: more + sifat + than.', 'Adjectives', 1, 16),
  ((select id from t), 'Tashkent is the ___ city in Uzbekistan.', array['largest', 'larger', 'most large', 'large'], 0, 'Orttirma daraja: the + -est.', 'Adjectives', 1, 17),
  ((select id from t), 'She is not as tall ___ her brother.', array['as', 'than', 'like', 'so'], 0, 'Tenglik taqqoslash: (not) as … as.', 'Adjectives', 2, 18),
  ((select id from t), 'I''m interested ___ history.', array['in', 'at', 'for', 'on'], 0, 'interested in — turg‘un birikma.', 'Prepositions', 1, 19),
  ((select id from t), 'The meeting is ___ Monday ___ 9 o''clock.', array['on / in', 'at / on', 'in / at', 'on / at'], 3, 'Kun oldidan on, soat oldidan at.', 'Prepositions', 2, 20),
  ((select id from t), 'She said, "I am tired." → She said that she ___ tired.', array['has been', 'is', 'will be', 'was'], 3, 'O‘zlashtirma gapda zamon bir pog‘ona orqaga suriladi: am → was.', 'Reported speech', 2, 21),
  ((select id from t), 'He asked me where I ___.', array['lived', 'am living', 'did live', 'do live'], 0, 'O‘zlashtirma so‘roqda so‘z tartibi darak gapdagidek: where I lived.', 'Reported speech', 3, 22),
  ((select id from t), 'Choose the synonym of "huge".', array['narrow', 'weak', 'tiny', 'enormous'], 3, 'huge = enormous — juda katta.', 'Vocabulary', 1, 23),
  ((select id from t), 'Choose the opposite of "generous".', array['mean', 'kind', 'brave', 'polite'], 0, 'generous — saxiy; mean — xasis.', 'Vocabulary', 2, 24),
  ((select id from t), 'I''m looking forward to ___ you.', array['seeing', 'see', 'be seen', 'saw'], 0, 'look forward to + V-ing (to bu yerda predlog).', 'Gerund', 2, 25),
  ((select id from t), 'She suggested ___ a taxi.', array['took', 'taking', 'to take', 'take'], 1, 'suggest + V-ing.', 'Gerund', 3, 26),
  ((select id from t), 'The ___ of the film was surprising. (END)', array['endless', 'ending', 'endly', 'ended'], 1, 'Artikl va of oldida ot kerak: ending — tugashi, yakuni.', 'Word formation', 2, 27),
  ((select id from t), 'Read: "Aziz usually walks to school, but today it is raining, so his father is driving him." How does Aziz get to school today?', array['On foot', 'By bus', 'By car', 'By bike'], 2, 'Today … his father is driving him — bugun mashinada.', 'Reading', 1, 28),
  ((select id from t), 'Read: "The museum opens at 10 a.m. and closes at 6 p.m. On Mondays it is closed." When can you NOT visit the museum?', array['On Friday at 5 p.m.', 'On Sunday at noon', 'On Monday', 'On Tuesday at 11 a.m.'], 2, 'On Mondays it is closed — dushanba kuni yopiq.', 'Reading', 2, 29),
  ((select id from t), 'There isn''t ___ milk left.', array['a few', 'much', 'few', 'many'], 1, 'Sanalmaydigan ot (milk) bilan inkorda — much.', 'Quantifiers', 1, 30);
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('Matematika | Asosiy mavzular: kasr, foiz, tenglama, progressiya', '0 dan tayyorlanish uchun asosiy mavzular: kasrlar, foizlar, chiziqli va kvadrat tenglamalar, tengsizliklar, progressiyalar, kombinatorika, ehtimollik va Pifagor teoremasi.', 'matematika', 'mavzu', null, 40, '14-maktab: fan dasturlari asosida sayt uchun tuzilgan original mashq savollari (2026, 3-qism). O‘qituvchilar tekshirib, to‘ldirib boradi.', 32, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, topic, difficulty, sort_order) values
  ((select id from t), '1/2 + 1/3 = ?', array['2/5', '1/5', '5/6', '2/6'], 2, 'Umumiy maxraj 6: 3/6 + 2/6 = 5/6.', 'Kasrlar', 1, 1),
  ((select id from t), '3/4 · 2/9 = ?', array['1/6', '3/8', '2/3', '5/13'], 0, '(3 · 2)/(4 · 9) = 6/36 = 1/6.', 'Kasrlar', 2, 2),
  ((select id from t), '2/3 : 4/9 = ?', array['1/2', '2/3', '8/27', '3/2'], 3, 'Bo‘lish — teskarisiga ko‘paytirish: 2/3 · 9/4 = 18/12 = 3/2.', 'Kasrlar', 2, 3),
  ((select id from t), '0,75 ni oddiy kasr ko‘rinishida yozing.', array['7/50', '7/5', '3/4', '3/5'], 2, '0,75 = 75/100 = 3/4.', 'Kasrlar', 1, 4),
  ((select id from t), 'Qaysi kasr eng katta?', array['2/3', '3/4', '5/6', '7/12'], 2, 'Maxraj 12 ga keltiramiz: 10/12, 9/12, 8/12, 7/12.', 'Kasrlar', 2, 5),
  ((select id from t), '80 ning 15 % i nechaga teng?', array['8', '10', '15', '12'], 3, '80 · 0,15 = 12.', 'Foizlar', 1, 6),
  ((select id from t), 'Narx 200 so‘mdan 250 so‘mga oshdi. Necha foizga oshgan?', array['30 %', '50 %', '20 %', '25 %'], 3, 'Oshish 50 so‘m; 50/200 = 0,25 = 25 %.', 'Foizlar', 2, 7),
  ((select id from t), 'Tovar 20 % arzonlashib, 400 000 so‘m bo‘ldi. Dastlabki narxi qancha edi?', array['480 000 so‘m', '320 000 so‘m', '500 000 so‘m', '420 000 so‘m'], 2, 'Yangi narx dastlabkining 80 % i: 400 000 : 0,8 = 500 000.', 'Foizlar', 3, 8),
  ((select id from t), '30 soni 120 ning necha foizini tashkil qiladi?', array['4 %', '25 %', '30 %', '40 %'], 1, '30/120 = 0,25 = 25 %.', 'Foizlar', 1, 9),
  ((select id from t), 'Omonatga yiliga 10 % (murakkab foiz) qo‘shiladi. 1 000 000 so‘m 2 yildan keyin qancha bo‘ladi?', array['1 020 000 so‘m', '1 210 000 so‘m', '1 200 000 so‘m', '1 100 000 so‘m'], 1, '1 000 000 · 1,1 · 1,1 = 1 210 000.', 'Foizlar', 3, 10),
  ((select id from t), '3x − 7 = 11 tenglamani yeching.', array['4/3', '5', '6', '18'], 2, '3x = 18, x = 6.', 'Tenglamalar', 1, 11),
  ((select id from t), '2(x + 3) = 5x − 9 tenglamani yeching.', array['1', '5', '−5', '3'], 1, '2x + 6 = 5x − 9 → 15 = 3x → x = 5.', 'Tenglamalar', 2, 12),
  ((select id from t), 'x/4 + 2 = 5 tenglamani yeching.', array['8', '28', '3', '12'], 3, 'x/4 = 3, x = 12.', 'Tenglamalar', 1, 13),
  ((select id from t), '|x − 3| = 5 tenglamaning ildizlari?', array['faqat 8', '−8 va 2', '2 va −2', '8 va −2'], 3, 'x − 3 = 5 yoki x − 3 = −5.', 'Tenglamalar', 2, 14),
  ((select id from t), 'x² − 5x + 6 = 0 tenglamaning ildizlari?', array['1 va 6', '2 va 3', '−2 va −3', '−1 va 6'], 1, 'Yig‘indisi 5, ko‘paytmasi 6 — 2 va 3.', 'Kvadrat tenglamalar', 1, 15),
  ((select id from t), 'x² − 4x + 4 = 0 tenglamaning nechta turli ildizi bor?', array['Cheksiz ko‘p', '2 ta', 'Ildizi yo‘q', '1 ta'], 3, 'D = 16 − 16 = 0 — bitta ildiz (x = 2).', 'Kvadrat tenglamalar', 2, 16),
  ((select id from t), 'x² + x + 5 = 0 tenglama haqida to‘g‘ri fikr?', array['Haqiqiy ildizi yo‘q', '1 ta ildizi bor', '2 ta ildizi bor', 'Ildizlari 1 va 5'], 0, 'D = 1 − 20 < 0.', 'Kvadrat tenglamalar', 2, 17),
  ((select id from t), 'Arifmetik progressiyada a₁ = 3, d = 4. a₁₀ = ?', array['36', '40', '39', '43'], 2, 'aₙ = a₁ + (n − 1)d = 3 + 9 · 4 = 39.', 'Progressiyalar', 2, 18),
  ((select id from t), '2, 6, 18, … geometrik progressiyaning 5-hadi?', array['162', '486', '108', '54'], 0, 'q = 3: b₅ = 2 · 3⁴ = 162.', 'Progressiyalar', 2, 19),
  ((select id from t), '1 + 2 + 3 + … + 100 = ?', array['4950', '5050', '5000', '10100'], 1, '(1 + 100) · 100 / 2 = 5050.', 'Progressiyalar', 2, 20),
  ((select id from t), 'Arifmetik progressiyada a₁ = 5, a₅ = 17. Ayirmasi d = ?', array['12', '4', '2', '3'], 3, 'a₅ = a₁ + 4d → 17 = 5 + 4d → d = 3.', 'Progressiyalar', 2, 21),
  ((select id from t), '2x − 3 > 7 tengsizlikni yeching.', array['x > 2', 'x > 10', 'x > 5', 'x < 5'], 2, '2x > 10, x > 5.', 'Tengsizliklar', 1, 22),
  ((select id from t), 'x² < 9 tengsizlikni yeching.', array['x < −3 yoki x > 3', 'x < 3', '−3 < x < 3', 'x > 3'], 2, '|x| < 3.', 'Tengsizliklar', 2, 23),
  ((select id from t), '(x − 1)(x + 4) ≤ 0 tengsizlikni yeching.', array['x ≥ 1', 'x ≤ −4 yoki x ≥ 1', '−1 ≤ x ≤ 4', '−4 ≤ x ≤ 1'], 3, 'Ildizlar −4 va 1; ko‘paytma ular orasida manfiy.', 'Tengsizliklar', 3, 24),
  ((select id from t), '5 ta turli kitobni tokchaga necha xil usulda terish mumkin?', array['5', '120', '60', '25'], 1, '5! = 5 · 4 · 3 · 2 · 1 = 120.', 'Kombinatorika', 2, 25),
  ((select id from t), '6 kishidan 2 kishilik guruhni necha usulda tanlash mumkin?', array['30', '12', '36', '15'], 3, 'C(6, 2) = 6 · 5 / 2 = 15.', 'Kombinatorika', 2, 26),
  ((select id from t), 'Tanga 2 marta tashlanadi. Ikkala marta ham gerb tushish ehtimoli?', array['1/4', '1/3', '1/2', '3/4'], 0, '1/2 · 1/2 = 1/4.', 'Ehtimollik', 1, 27),
  ((select id from t), 'O‘yin soqqasi tashlanganda juft son tushish ehtimoli?', array['2/3', '1/3', '1/2', '1/6'], 2, 'Juft: 2, 4, 6 — 6 tadan 3 tasi.', 'Ehtimollik', 1, 28),
  ((select id from t), 'To‘g‘ri burchakli uchburchakning katetlari 5 va 12. Gipotenuzasi?', array['17', '11', '13', '15'], 2, '√(25 + 144) = √169 = 13.', 'Pifagor teoremasi', 1, 29),
  ((select id from t), 'Gipotenuza 10, bir kateti 6. Ikkinchi kateti?', array['16', '8', '4', '7'], 1, '√(100 − 36) = √64 = 8.', 'Pifagor teoremasi', 1, 30);
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('Ona tili | Milliy sertifikat formatida mashq', 'Milliy sertifikat formatidagi mashq: kelishiklar, so‘z turkumlari, leksikologiya, gap bo‘laklari va qo‘shma gaplar, fonetika va qo‘shimchalar.', 'ona_tili', 'mavzu', null, 25, '14-maktab: fan dasturlari asosida sayt uchun tuzilgan original mashq savollari (2026, 3-qism). O‘qituvchilar tekshirib, to‘ldirib boradi.', 33, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, topic, difficulty, sort_order) values
  ((select id from t), '«Kitobni» so‘zi qaysi kelishikda?', array['Chiqish kelishigi', 'Qaratqich kelishigi', 'Jo‘nalish kelishigi', 'Tushum kelishigi'], 3, '-ni — tushum kelishigi qo‘shimchasi (kimni? nimani?).', 'Kelishiklar', 1, 1),
  ((select id from t), '«Maktabdan» so‘zi qaysi kelishikda?', array['Bosh kelishik', 'Chiqish kelishigi', 'O‘rin-payt kelishigi', 'Jo‘nalish kelishigi'], 1, '-dan — chiqish kelishigi (kimdan? nimadan? qayerdan?).', 'Kelishiklar', 1, 2),
  ((select id from t), '«Uyga» so‘zi qaysi kelishikda?', array['Jo‘nalish kelishigi', 'Qaratqich kelishigi', 'O‘rin-payt kelishigi', 'Tushum kelishigi'], 0, '-ga — jo‘nalish kelishigi (kimga? nimaga? qayerga?).', 'Kelishiklar', 1, 3),
  ((select id from t), 'O‘zbek tilida nechta kelishik bor?', array['6', '8', '5', '7'], 0, 'Bosh, qaratqich, tushum, jo‘nalish, o‘rin-payt, chiqish.', 'Kelishiklar', 1, 4),
  ((select id from t), '«Chiroyli» so‘zi qaysi so‘z turkumiga kiradi?', array['Ravish', 'Sifat', 'Ot', 'Fe’l'], 1, 'Belgini bildiradi, qanday? so‘rog‘iga javob beradi.', 'So‘z turkumlari', 1, 5),
  ((select id from t), '«U tez yugurdi» gapida «tez» qaysi so‘z turkumi?', array['Ravish', 'Olmosh', 'Sifat', 'Ot'], 0, 'Harakatning belgisini bildiradi (qanday yugurdi?) — ravish.', 'So‘z turkumlari', 2, 6),
  ((select id from t), '«Men, sen, u» qanday olmoshlar?', array['Ko‘rsatish olmoshlari', 'Belgilash olmoshlari', 'Kishilik olmoshlari', 'So‘roq olmoshlari'], 2, 'Shaxsni bildiradi.', 'So‘z turkumlari', 1, 7),
  ((select id from t), '«Beshinchi» qaysi son turi?', array['Taqsim son', 'Tartib son', 'Sanoq son', 'Jamlovchi son'], 1, '-inchi qo‘shimchasi tartib sonni yasaydi.', 'So‘z turkumlari', 2, 8),
  ((select id from t), '«Ikkovi» qaysi son turi?', array['Kasr son', 'Tartib son', 'Jamlovchi son', 'Taqsim son'], 2, '-ov (-ovi) — jamlovchi son qo‘shimchasi.', 'So‘z turkumlari', 2, 9),
  ((select id from t), 'Sinonimlar juftini toping.', array['katta – kichik', 'kun – tun', 'yuz – bet', 'oq – qora'], 2, 'Sinonimlar — ma’nosi yaqin so‘zlar.', 'Leksikologiya', 1, 10),
  ((select id from t), 'Antonimlar juftini toping.', array['dono – aqlli', 'chiroyli – go‘zal', 'tez – chaqqon', 'issiq – sovuq'], 3, 'Antonimlar — ma’nosi qarama-qarshi so‘zlar.', 'Leksikologiya', 1, 11),
  ((select id from t), 'Bir xil aytilib, ma’nosi boshqa-boshqa bo‘lgan so‘zlar (masalan, «ot» — hayvon va «ot» — ism) qanday ataladi?', array['Sinonimlar', 'Omonimlar', 'Paronimlar', 'Antonimlar'], 1, 'Shakli bir xil, ma’nosi har xil — omonim.', 'Leksikologiya', 2, 12),
  ((select id from t), 'Gapning bosh bo‘laklarini ko‘rsating.', array['Aniqlovchi va to‘ldiruvchi', 'Ega va kesim', 'Ega va to‘ldiruvchi', 'Kesim va hol'], 1, 'Gapning asosini ega va kesim tashkil qiladi.', 'Sintaksis', 1, 13),
  ((select id from t), 'Qaysi gap so‘roq gap?', array['Qanday go‘zal kun!', 'Bugun havo issiq.', 'Darsga kech qolma!', 'Sen qachon kelasan?'], 3, 'So‘roq gap so‘roqni ifodalaydi, oxirida so‘roq belgisi.', 'Sintaksis', 1, 14),
  ((select id from t), '«Qor yog‘di va hamma yoq oppoq bo‘ldi» — qanday gap?', array['Bog‘lovchisiz qo‘shma gap', 'Bog‘langan qo‘shma gap', 'Ergash gapli qo‘shma gap', 'Sodda gap'], 1, 'Ikki sodda gap teng bog‘lovchi «va» bilan bog‘langan.', 'Sintaksis', 2, 15),
  ((select id from t), 'O‘zbek adabiy tilida nechta unli tovush bor?', array['5', '8', '6', '10'], 2, 'a, o, u, e, i, o‘.', 'Fonetika', 1, 16),
  ((select id from t), '«Kitobxon» so‘zidagi «-xon» qanday qo‘shimcha?', array['Egalik qo‘shimchasi', 'So‘z yasovchi', 'Shakl yasovchi', 'Kelishik qo‘shimchasi'], 1, 'Yangi ma’noli so‘z (kitob o‘quvchi) yasaydi.', 'Morfologiya', 2, 17),
  ((select id from t), '«Uyimiz» so‘zidagi «-imiz» qanday qo‘shimcha?', array['So‘z yasovchi qo‘shimcha', 'Kelishik qo‘shimchasi', 'I shaxs ko‘plikdagi egalik qo‘shimchasi', 'Ko‘plik qo‘shimchasi'], 2, 'Kimning uyi? — bizning.', 'Morfologiya', 2, 18),
  ((select id from t), '«va, lekin, ammo» qaysi yordamchi so‘zlar?', array['Yuklamalar', 'Ko‘makchilar', 'Bog‘lovchilar', 'Undovlar'], 2, 'So‘z va gaplarni bog‘laydi.', 'Yordamchi so‘zlar', 1, 19),
  ((select id from t), '«uchun, bilan, kabi» qaysi yordamchi so‘zlar?', array['Yuklamalar', 'Bog‘lovchilar', 'Modal so‘zlar', 'Ko‘makchilar'], 3, 'Ot bilan kelib, munosabat bildiradi.', 'Yordamchi so‘zlar', 2, 20);
insert into public.study_notes (subject, topic, body_uz) values
  ('matematika', 'Kasrlar', 'Kasr — butunning qismi: a/b da b (maxraj) butun necha qismga bo‘linganini, a (surat) nechta qism olinganini ko‘rsatadi.

Qo‘shish va ayirish: avval maxrajlarni tenglashtiring. 1/2 + 1/3 = 3/6 + 2/6 = 5/6.
Ko‘paytirish: surat suratga, maxraj maxrajga. Bo‘lish: ikkinchi kasrni to‘ntirib ko‘paytiring: 2/3 : 4/9 = 2/3 · 9/4 = 3/2.

Diqqat: maxrajlarni qo‘shib yubormang — 1/2 + 1/3 ≠ 2/5.'),
  ('matematika', 'Foizlar', '1 % — sonning yuzdan biri. p % ni topish: son · p/100. Masalan, 80 ning 15 % i = 80 · 0,15 = 12.

Necha foiz: qism / butun · 100. 30 soni 120 ning 30/120 · 100 = 25 % i.
Foizga o‘zgarish: yangi narx = eski · (1 ± p/100). 20 % arzonlashsa — 0,8 ga ko‘paytiriladi; dastlabki narx = yangi : 0,8.

Diqqat: ketma-ket foizlar qo‘shilmaydi — 10 % va yana 10 % oshish 21 % beradi (1,1 · 1,1 = 1,21).'),
  ('matematika', 'Tenglamalar', 'Chiziqli tenglama ax + b = c: noma’lumli hadlarni bir tomonga, sonlarni ikkinchi tomonga o‘tkazing (o‘tganda ishora o‘zgaradi), so‘ng koeffitsiyentga bo‘ling.

Misol: 2(x + 3) = 5x − 9 → 2x + 6 = 5x − 9 → 15 = 3x → x = 5.
Modulli tenglama |x − a| = b (b > 0): x − a = b yoki x − a = −b — ikki ildiz.

Diqqat: qavsni ochganda har bir hadni ko‘paytiring; javobni tenglamaga qo‘yib tekshiring.'),
  ('matematika', 'Kvadrat tenglamalar', 'ax² + bx + c = 0 uchun diskriminant D = b² − 4ac.
D > 0 — ikki ildiz: x = (−b ± √D) / 2a; D = 0 — bitta ildiz; D < 0 — haqiqiy ildiz yo‘q.

Misol: x² − 5x + 6 = 0: D = 25 − 24 = 1, x = (5 ± 1)/2 → 2 va 3.

Diqqat: −b ni unutmang va 2a ga butun suratni bo‘ling.'),
  ('matematika', 'Viyet teoremasi', 'x² + px + q = 0 keltirilgan tenglama ildizlari uchun: x₁ + x₂ = −p, x₁ · x₂ = q.
Umumiy holda ax² + bx + c = 0: x₁ + x₂ = −b/a, x₁ · x₂ = c/a.

Misol: x² − 7x + 10 = 0 → yig‘indi 7, ko‘paytma 10 → ildizlar 2 va 5.

Diqqat: yig‘indida ishora teskari (−p).'),
  ('matematika', 'Progressiyalar', 'Arifmetik progressiya: har had oldingisidan d ga farq qiladi. aₙ = a₁ + (n − 1)d, yig‘indi Sₙ = (a₁ + aₙ) · n / 2.
Geometrik progressiya: har had oldingisidan q marta katta. bₙ = b₁ · qⁿ⁻¹.

Misol: 1 + 2 + … + 100 = (1 + 100) · 100 / 2 = 5050.

Diqqat: n-hadda (n − 1) ishlatiladi, n emas.'),
  ('matematika', 'Tengsizliklar', 'Tengsizlik tenglama kabi yechiladi, bitta farq bilan: ikkala tomonni manfiy songa ko‘paytirsangiz yoki bo‘lsangiz, belgi teskari bo‘ladi (−3x < 12 → x > −4).

Kvadrat tengsizlik: ildizlarni toping, son o‘qida belgilang. (x − 1)(x + 4) ≤ 0 → −4 ≤ x ≤ 1 (ko‘paytma ildizlar orasida manfiy).

Diqqat: ≤ va ≥ da chegaraviy nuqtalar javobga kiradi.'),
  ('matematika', 'Pifagor teoremasi', 'To‘g‘ri burchakli uchburchakda gipotenuza kvadrati katetlar kvadratlari yig‘indisiga teng: c² = a² + b².

Misol: katetlar 5 va 12 → c = √(25 + 144) = 13. Kateti noma’lum bo‘lsa: b = √(c² − a²).
Mashhur uchliklar: 3–4–5, 5–12–13, 6–8–10.

Diqqat: gipotenuza — eng uzun tomon, to‘g‘ri burchak qarshisida.'),
  ('matematika', 'Ehtimollik', 'Hodisa ehtimoli = qulay natijalar soni / barcha teng imkonli natijalar soni. U 0 dan 1 gacha.

Misol: soqqada juft son (2, 4, 6) — 3/6 = 1/2. Mustaqil hodisalar birga ro‘y berishi — ehtimollar ko‘paytiriladi: ikki tanga ham gerb — 1/2 · 1/2 = 1/4.

Diqqat: barcha natijalarni to‘g‘ri sanang — ikki tangada 4 ta natija bor (GG, GR, RG, RR).'),
  ('matematika', 'Kombinatorika', 'n ta turli narsani qatorga terish usullari — n! (n faktorial): 5! = 120.
n tadan k tasini tartibsiz tanlash — C(n, k) = n! / (k! (n − k)!): C(6, 2) = 15.
Ko‘paytirish qoidasi: birinchi tanlov m usulda, ikkinchisi k usulda bo‘lsa — jami m · k.

Diqqat: tartib muhimmi (navbat, o‘rin) yoki yo‘qmi (guruh) — shunga qarab formula tanlang.'),
  ('matematika', 'Daraja va ildiz', 'aⁿ — a ning n marta o‘ziga ko‘paytmasi. Qoidalar: aᵐ · aⁿ = aᵐ⁺ⁿ, aᵐ : aⁿ = aᵐ⁻ⁿ, (aᵐ)ⁿ = aᵐⁿ, a⁰ = 1, a⁻ⁿ = 1/aⁿ.
√a — kvadrati a bo‘lgan manfiy bo‘lmagan son: √49 = 7, √a · √b = √(ab).

Diqqat: (a + b)² ≠ a² + b²; to‘g‘risi a² + 2ab + b².'),
  ('matematika', 'Logarifm', 'logₐb = c degani aᶜ = b (a > 0, a ≠ 1, b > 0). log₂8 = 3, chunki 2³ = 8.
Qoidalar: logₐ(xy) = logₐx + logₐy, logₐ(x/y) = logₐx − logₐy, logₐxⁿ = n · logₐx, logₐa = 1, logₐ1 = 0.

Diqqat: log(x + y) ni bo‘lib bo‘lmaydi; manfiy son va noldan logarifm yo‘q.'),
  ('ingliz', 'Present Perfect', 'Tuzilishi: have/has + V3 (eat – ate – eaten). O‘tmishda bo‘lgan, natijasi hozir muhim ish yoki hozirgacha davom etgan holat.

Kalit so‘zlar: ever, never, already, yet, just, since (boshlangan vaqt), for (davomiylik).
I have lived here since 2019. Have you ever been to Samarkand? We haven''t seen it yet.

Diqqat: aniq o‘tgan vaqt (yesterday, in 2020, last week) bo‘lsa — Past Simple.'),
  ('ingliz', 'Past Simple', 'Tugagan ish, aniq o‘tgan vaqt bilan: yesterday, last week, in 2015, ago.
To‘g‘ri fe’llar -ed oladi (visit → visited), noto‘g‘rilari yodlanadi (go → went, see → saw).
Inkor va so‘roq: did + V1: I didn''t go. Did you see it?

Diqqat: did dan keyin fe’l asosiy shaklda: Did he went ❌ → Did he go ✓.'),
  ('ingliz', 'Conditionals', '0-tur (umumiy haqiqat): If + Present, Present — If you heat ice, it melts.
1-tur (real kelajak): If + Present, will + V1 — If it rains, we will stay home.
2-tur (xayoliy hozir): If + Past, would + V1 — If I were rich, I would travel.

Diqqat: if qismida will ishlatilmaydi: If it will rain ❌.'),
  ('ingliz', 'Passive voice', 'Majhul nisbat: ish kim tomonidan emas, nimaga qilingani muhim. Tuzilishi: to be (zamonga mos) + V3.
Present: English is spoken. Past: The bridge was built in 1995. Future: The letters will be sent.
Bajaruvchi by bilan: The book was written by Qodiriy.

Diqqat: to be zamonni, V3 ma’noni beradi — is build ❌, is built ✓.'),
  ('ingliz', 'Modal verbs', 'can — qobiliyat/imkon, could — o‘tmishdagi qobiliyat yoki muloyim so‘rov, must — qat’iy majburiyat, mustn''t — taqiq, don''t have to — shart emas, should — maslahat, might/may — ehtimol.
Modal fe’ldan keyin to siz asosiy fe’l: You must wear a seatbelt.

Diqqat: mustn''t (mumkin emas) va don''t have to (shart emas) — ma’nosi boshqa.'),
  ('ingliz', 'Adjectives', 'Qisqa sifatlar: -er / the -est (tall – taller – the tallest). Uzun sifatlar: more / the most (interesting – more interesting – the most interesting).
Noto‘g‘rilari: good – better – the best, bad – worse – the worst.
Tenglik: as … as — She is as tall as her brother.

Diqqat: more bilan -er birga ishlatilmaydi: more taller ❌.'),
  ('ingliz', 'Prepositions', 'Vaqt: at — soat (at 9 o''clock), on — kun va sana (on Monday, on 5 May), in — oy, yil, fasl (in May, in 2026).
Joy: in — ichida, on — ustida, at — nuqtada (at school).
Turg‘un birikmalar yodlanadi: interested in, good at, afraid of, depend on.

Diqqat: in the morning, lekin at night.'),
  ('ingliz', 'Reported speech', 'O‘zlashtirma gapda zamon bir pog‘ona orqaga suriladi: am/is → was, do → did, will → would, have done → had done.
She said, "I am tired." → She said that she was tired.
So‘roqda so‘z tartibi darak gapdagidek: He asked where I lived (where did I live ❌).

Diqqat: olmoshlarni ham o‘zgartiring: I → he/she, my → his/her.'),
  ('ingliz', 'Gerund', 'Gerund — fe’lning -ing shakli, ot o‘rnida keladi. Ba’zi fe’llardan keyin faqat -ing: enjoy, suggest, avoid, finish, mind — She suggested taking a taxi.
Predlogdan keyin ham -ing: interested in reading, look forward to seeing.

Diqqat: look forward to da to — predlog, shuning uchun to see ❌, to seeing ✓.'),
  ('ingliz', 'Quantifiers', 'Sanaladigan otlar (books, apples): many, a few, few. Sanalmaydigan otlar (milk, water, time): much, a little, little.
Ikkalasiga: a lot of, some (darak), any (inkor va so‘roq).
There isn''t much milk. There are a few apples.

Diqqat: a few — «bir nechta» (ijobiy), few — «juda oz» (salbiy).'),
  ('ona_tili', 'Kelishiklar', 'O‘zbek tilida 6 kelishik bor: bosh (kim? nima?), qaratqich -ning (kimning?), tushum -ni (kimni? nimani?), jo‘nalish -ga (kimga? qayerga?), o‘rin-payt -da (kimda? qayerda?), chiqish -dan (kimdan? qayerdan?).

Misol: maktab-dan (chiqish), uy-ga (jo‘nalish), kitob-ni (tushum).

Diqqat: qaratqich (-ning) va tushum (-ni) ni adashtirmang: «kitobning varag‘i» — qaratqich, «kitobni o‘qidim» — tushum.'),
  ('ona_tili', 'So‘z turkumlari', 'Mustaqil so‘z turkumlari: ot (kim? nima?), sifat (qanday? qanaqa?), son (nechta? nechanchi?), olmosh, fe’l (nima qildi?), ravish (qanday qilib? qachon?).
Yordamchi so‘zlar: ko‘makchi, bog‘lovchi, yuklama. Alohida guruh: modal, undov, taqlid so‘zlar.

Misol: «tez» — «tez mashina» da sifat, «tez yugurdi» da ravish.

Diqqat: so‘z turkumini gapdagi vazifasi va so‘rog‘iga qarab aniqlang.'),
  ('ona_tili', 'Leksikologiya', 'Sinonimlar — ma’nosi yaqin so‘zlar (yuz – bet – chehra). Antonimlar — qarama-qarshi ma’noli so‘zlar (issiq – sovuq). Omonimlar — shakli bir xil, ma’nosi boshqa so‘zlar (ot — hayvon; ot — ism).

Paronimlar — talaffuzi yaqin, ma’nosi boshqa so‘zlar (asr – asir).

Diqqat: bitta so‘zning ko‘p ma’noliligi (ko‘z — a’zo, uzukning ko‘zi) omonimiya emas.'),
  ('ona_tili', 'Sintaksis', 'Gapning bosh bo‘laklari — ega (kim? nima?) va kesim (nima qildi? qanday?). Ikkinchi darajali bo‘laklar — to‘ldiruvchi, aniqlovchi, hol.
Maqsadga ko‘ra gaplar: darak, so‘roq, buyruq, his-hayajon.
Qo‘shma gaplar: bog‘langan (va, lekin, ammo bilan), ergash gapli (bosh va ergash gap), bog‘lovchisiz.

Diqqat: «va» bilan bog‘langan ikki sodda gap — bog‘langan qo‘shma gap.'),
  ('ona_tili', 'Yordamchi so‘zlar', 'Ko‘makchilar ot bilan kelib munosabat bildiradi: uchun, bilan, kabi, sari, bo‘ylab.
Bog‘lovchilar so‘z va gaplarni bog‘laydi: va, ham, lekin, ammo, biroq, yoki.
Yuklamalar qo‘shimcha ma’no beradi: -mi, -chi, faqat, hatto, axir.

Diqqat: «bilan» ko‘makchi ham, bog‘lovchi ham bo‘lishi mumkin: «qalam bilan yozdi» (ko‘makchi), «Anvar bilan Salim» (bog‘lovchi).')
on conflict (subject, topic) do update set body_uz = excluded.body_uz, updated_at = now();
commit;
