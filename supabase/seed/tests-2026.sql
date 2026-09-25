-- Practice tests written for the site (scripts/seed_tests.py). Applied once; re-running adds duplicates.
-- Source is stored in tests.source and shown under each test.
begin;
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('Matematika | 1-sinf: sonlar, qo‘shish va ayirish', '«Matematika | 1-sinf» darsligi mavzulari: 20 gacha sonlar, qo‘shish va ayirish, geometrik shakllar.', 'matematika', 'mavzu', 1, 15, '14-maktab: darslik mavzulari va DTM fan dasturlari asosida sayt uchun tuzilgan mashq savollari (2026). O‘qituvchilar tekshirib, to‘ldirib boradi.', 10, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, sort_order) values
  ((select id from t), '3 + 4 = ?', array['6', '5', '8', '7'], 3, '3 ga 4 ni qo‘shsak, 7 bo‘ladi.', 1),
  ((select id from t), '9 − 5 = ?', array['4', '3', '14', '5'], 0, '9 dan 5 ni ayirsak, 4 qoladi.', 2),
  ((select id from t), 'Qaysi son 7 dan katta?', array['5', '8', '7', '6'], 1, null, 3),
  ((select id from t), '10 dan oldin keladigan son qaysi?', array['9', '8', '11', '1'], 0, null, 4),
  ((select id from t), '6 + 6 = ?', array['13', '12', '11', '10'], 1, null, 5),
  ((select id from t), 'Uchburchakning nechta burchagi bor?', array['5 ta', '2 ta', '3 ta', '4 ta'], 2, 'Nomi ham shuni aytadi: uch burchak.', 6),
  ((select id from t), 'Kvadratning nechta tomoni bor?', array['4 ta', '6 ta', '3 ta', '5 ta'], 0, 'Kvadratning 4 ta tomoni bor va ular teng.', 7),
  ((select id from t), '15 − 5 = ?', array['20', '15', '10', '5'], 2, null, 8),
  ((select id from t), 'Qaysi tenglik to‘g‘ri?', array['5 + 3 = 53', '5 + 3 = 9', '5 + 3 = 8', '5 + 3 = 7'], 2, null, 9),
  ((select id from t), '2, 4, 6, … Keyingi son qaysi?', array['9', '7', '10', '8'], 3, 'Sonlar 2 tadan ortib boryapti: 6 + 2 = 8.', 10),
  ((select id from t), '8 + 0 = ?', array['80', '0', '9', '8'], 3, 'Songa 0 qo‘shilsa, son o‘zgarmaydi.', 11),
  ((select id from t), 'Bir haftada necha kun bor?', array['7', '6', '10', '5'], 0, null, 12),
  ((select id from t), '12 soni nechta o‘nlik va nechta birlikdan iborat?', array['2 o‘nlik va 1 birlik', '1 o‘nlik va 2 birlik', '12 o‘nlik', '1 o‘nlik va 0 birlik'], 1, null, 13),
  ((select id from t), 'Qaysi son eng kichik?', array['20', '14', '11', '9'], 3, null, 14),
  ((select id from t), 'Alida 5 ta olma bor edi. U 2 tasini yedi. Nechta olma qoldi?', array['2 ta', '5 ta', '3 ta', '7 ta'], 2, '5 − 2 = 3.', 15),
  ((select id from t), '7 + 3 = 10 bo‘lsa, 10 − 3 = ?', array['7', '10', '13', '3'], 0, 'Qo‘shish va ayirish bir-biriga teskari amallar.', 16),
  ((select id from t), 'Doiraning nechta burchagi bor?', array['Burchagi yo‘q', '2 ta', '4 ta', '1 ta'], 0, null, 17),
  ((select id from t), 'Qaysi qatorda sonlar kichigidan kattasiga qarab yozilgan?', array['12, 8, 5, 3', '3, 8, 5, 12', '3, 5, 8, 12', '5, 3, 8, 12'], 2, null, 18);
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('Musiqa | 1-sinf: notalar va cholg‘ular', '«Musiqa | 1-sinf» darsligi mavzulari: notalar, o‘zbek xalq cholg‘ulari, Davlat madhiyasi.', 'boshqa', 'mavzu', 1, 10, '14-maktab: darslik mavzulari va DTM fan dasturlari asosida sayt uchun tuzilgan mashq savollari (2026). O‘qituvchilar tekshirib, to‘ldirib boradi.', 20, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, sort_order) values
  ((select id from t), 'Nechta asosiy nota bor?', array['8 ta', '6 ta', '5 ta', '7 ta'], 3, 'Do, re, mi, fa, sol, lya, si — 7 ta nota.', 1),
  ((select id from t), '«Do, re, mi …» — keyingi nota qaysi?', array['Sol', 'Lya', 'Si', 'Fa'], 3, null, 2),
  ((select id from t), 'Doira qanday cholg‘u?', array['Torli cholg‘u', 'Puflama cholg‘u', 'Urma cholg‘u', 'Klavishli cholg‘u'], 2, null, 3),
  ((select id from t), 'Dutorning nechta tori bor?', array['3 ta', '2 ta', '1 ta', '4 ta'], 1, '«Du» — ikki, «tor» — tor: ikki torli cholg‘u.', 4),
  ((select id from t), 'Karnay qanday cholg‘u?', array['Puflama cholg‘u', 'Urma cholg‘u', 'Torli cholg‘u', 'Klavishli cholg‘u'], 0, null, 5),
  ((select id from t), 'Qaysi biri torli cholg‘u?', array['Rubob', 'Nog‘ora', 'Doira', 'Karnay'], 0, null, 6),
  ((select id from t), 'Fortepiano qanday cholg‘u?', array['Puflama cholg‘u', 'Klavishli cholg‘u', 'Urma cholg‘u', 'Xalq cholg‘usi — doira'], 1, null, 7),
  ((select id from t), 'O‘zbekiston Respublikasi Davlat madhiyasi musiqasini kim yaratgan?', array['Mutal Burhonov', 'Abdulla Oripov', 'Yunus Rajabiy', 'Muxtor Ashrafiy'], 0, null, 8),
  ((select id from t), 'Davlat madhiyasi so‘zlarining muallifi kim?', array['Abdulla Oripov', 'G‘afur G‘ulom', 'Hamid Olimjon', 'Erkin Vohidov'], 0, null, 9),
  ((select id from t), 'Davlat madhiyasi yangraganda nima qilish kerak?', array['O‘tirgan joyida gaplashish', 'Qo‘shiqqa raqs tushish', 'Xonadan chiqib ketish', 'O‘rnidan turib, hurmat bilan tinglash'], 3, null, 10);
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('DTM mashq: Matematika (1-to‘plam)', 'DTM formatidagi mashq savollari: algebra, geometriya, progressiyalar.', 'matematika', 'dtm', null, null, '14-maktab: darslik mavzulari va DTM fan dasturlari asosida sayt uchun tuzilgan mashq savollari (2026). O‘qituvchilar tekshirib, to‘ldirib boradi.', 30, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, sort_order) values
  ((select id from t), '2⁵ ning qiymati nechaga teng?', array['32', '16', '25', '64'], 0, '2·2·2·2·2 = 32.', 1),
  ((select id from t), '√144 = ?', array['14', '11', '12', '72'], 2, null, 2),
  ((select id from t), '80 ning 15 foizi nechaga teng?', array['15', '10', '12', '8'], 2, '80 · 0,15 = 12.', 3),
  ((select id from t), '3x − 7 = 11 tenglamaning ildizi?', array['6', '7', '4', '5'], 0, '3x = 18, x = 6.', 4),
  ((select id from t), 'x² − 5x + 6 = 0 tenglamaning ildizlari?', array['−1 va 6', '2 va 3', '−2 va −3', '1 va 6'], 1, 'Viyet teoremasi: yig‘indi 5, ko‘paytma 6.', 5),
  ((select id from t), 'log₂ 8 = ?', array['8', '2', '4', '3'], 3, '2³ = 8.', 6),
  ((select id from t), 'Arifmetik progressiyada a₁ = 3, d = 4. a₁₀ ni toping.', array['36', '40', '39', '43'], 2, 'a₁₀ = a₁ + 9d = 3 + 36 = 39.', 7),
  ((select id from t), 'Geometrik progressiyada b₁ = 2, q = 3. b₄ ni toping.', array['18', '162', '24', '54'], 3, 'b₄ = b₁·q³ = 2·27 = 54.', 8),
  ((select id from t), 'sin 30° = ?', array['√3/2', '1', '1/2', '√2/2'], 2, null, 9),
  ((select id from t), 'Uchburchak ichki burchaklarining yig‘indisi nechaga teng?', array['180°', '90°', '360°', '270°'], 0, null, 10),
  ((select id from t), 'To‘g‘ri burchakli uchburchakning katetlari 6 va 8 ga teng. Gipotenuzasini toping.', array['12', '48', '10', '14'], 2, 'Pifagor teoremasi: √(36 + 64) = 10.', 11),
  ((select id from t), 'Radiusi 5 ga teng doiraning yuzi?', array['50π', '5π', '25π', '10π'], 2, 'S = πr² = 25π.', 12),
  ((select id from t), '(a + b)² ifoda nimaga teng?', array['a² + 2ab + b²', 'a² − 2ab + b²', '2a + 2b', 'a² + b²'], 0, null, 13),
  ((select id from t), '7! / 5! = ?', array['49', '2', '42', '35'], 2, '7!/5! = 7·6 = 42.', 14),
  ((select id from t), '|−7| + |3| = ?', array['10', '−10', '4', '−4'], 0, null, 15),
  ((select id from t), 'f(x) = 2x + 1 bo‘lsa, f(3) = ?', array['6', '9', '5', '7'], 3, null, 16),
  ((select id from t), '0,25 ni oddiy kasr ko‘rinishida yozing.', array['1/4', '2/5', '1/25', '1/2'], 0, null, 17),
  ((select id from t), 'Kvadratning perimetri 20 sm. Uning yuzi qancha?', array['16 sm²', '20 sm²', '25 sm²', '100 sm²'], 2, 'Tomoni 20 : 4 = 5 sm, yuzi 5² = 25 sm².', 18),
  ((select id from t), '3/4 + 1/8 = ?', array['5/8', '7/8', '4/12', '1/2'], 1, '6/8 + 1/8 = 7/8.', 19),
  ((select id from t), 'y = x³ funksiyaning hosilasi?', array['3x²', 'x⁴/4', '3x', 'x²'], 0, null, 20),
  ((select id from t), 'Qirrasi 3 sm bo‘lgan kubning hajmi?', array['18 sm³', '27 sm³', '9 sm³', '54 sm³'], 1, null, 21),
  ((select id from t), '48 va 36 sonlarining EKUBi?', array['6', '144', '12', '4'], 2, null, 22);
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('DTM mashq: Fizika (1-to‘plam)', 'DTM formatidagi mashq savollari: mexanika, elektr, issiqlik, optika.', 'fizika', 'dtm', null, null, '14-maktab: darslik mavzulari va DTM fan dasturlari asosida sayt uchun tuzilgan mashq savollari (2026). O‘qituvchilar tekshirib, to‘ldirib boradi.', 40, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, sort_order) values
  ((select id from t), 'Xalqaro birliklar tizimida (SI) tezlik birligi?', array['N', 'm/s²', 'm/s', 'km/soat'], 2, null, 1),
  ((select id from t), 'Kuch birligi qaysi?', array['Nyuton', 'Vatt', 'Paskal', 'Joul'], 0, null, 2),
  ((select id from t), 'Massasi 2 kg bo‘lgan jism 3 m/s² tezlanish bilan harakatlanmoqda. Unga ta’sir etuvchi kuch?', array['1,5 N', '5 N', '6 N', '9 N'], 2, 'F = m·a = 2·3 = 6 N.', 3),
  ((select id from t), 'Erkin tushish tezlanishi taxminan nechaga teng?', array['98 m/s²', '1 m/s²', '0,98 m/s²', '9,8 m/s²'], 3, null, 4),
  ((select id from t), 'Ish birligi qaysi?', array['Joul', 'Nyuton', 'Kulon', 'Vatt'], 0, null, 5),
  ((select id from t), 'Quvvat formulasi qaysi?', array['P = m · a', 'P = F · t', 'P = A / t', 'P = U / I'], 2, null, 6),
  ((select id from t), 'Zanjir qismi uchun Om qonuni?', array['U = I / R', 'I = R / U', 'I = U / R', 'I = U · R'], 2, null, 7),
  ((select id from t), 'Kuchlanish 12 V, qarshilik 4 Om. Tok kuchi?', array['16 A', '0,33 A', '3 A', '48 A'], 2, 'I = U / R = 12 / 4 = 3 A.', 8),
  ((select id from t), 'Yorug‘likning vakuumdagi tezligi taxminan?', array['3·10⁸ m/s', '3·10⁶ m/s', '340 m/s', '3·10⁵ m/s'], 0, null, 9),
  ((select id from t), 'Tovushning havodagi tezligi taxminan?', array['34 m/s', '3·10⁸ m/s', '1500 m/s', '340 m/s'], 3, null, 10),
  ((select id from t), 'Massasi 2 kg, tezligi 3 m/s bo‘lgan jismning kinetik energiyasi?', array['9 J', '18 J', '6 J', '3 J'], 0, 'E = mv²/2 = 2·9/2 = 9 J.', 11),
  ((select id from t), 'Massasi 1 kg jism 10 m balandlikda turibdi (g = 10 m/s²). Potensial energiyasi?', array['50 J', '10 J', '100 J', '1000 J'], 2, 'E = mgh = 1·10·10 = 100 J.', 12),
  ((select id from t), 'Bosim birligi qaysi?', array['Nyuton', 'Vatt', 'Joul', 'Paskal'], 3, null, 13),
  ((select id from t), 'Normal atmosfera bosimida suv necha gradusda qaynaydi?', array['0 °C', '273 °C', '90 °C', '100 °C'], 3, null, 14),
  ((select id from t), 'Absolyut nol harorati taxminan?', array['0 °C', '−373 °C', '−100 °C', '−273 °C'], 3, null, 15),
  ((select id from t), 'Elektr zaryadi birligi?', array['Volt', 'Amper', 'Om', 'Kulon'], 3, null, 16),
  ((select id from t), 'Jism 20 m/s tezlik bilan 5 s tekis harakatlandi. Bosib o‘tgan yo‘li?', array['25 m', '4 m', '15 m', '100 m'], 3, 's = v·t = 100 m.', 17),
  ((select id from t), 'Zichlik formulasi?', array['ρ = V / m', 'ρ = F / S', 'ρ = m / V', 'ρ = m · V'], 2, null, 18),
  ((select id from t), 'Nyutonning uchinchi qonuni nima deydi?', array['Jism tinch holatini yoki to‘g‘ri chiziqli tekis harakatini saqlaydi', 'Ta’sir kuchi aks ta’sir kuchiga teng va qarama-qarshi yo‘nalgan', 'F = m · a', 'Energiya yo‘qolmaydi va yo‘qdan paydo bo‘lmaydi'], 1, null, 19),
  ((select id from t), 'Linzaning optik kuchi birligi?', array['Metr', 'Lyuks', 'Dioptriya', 'Kandela'], 2, null, 20),
  ((select id from t), 'Chastota birligi?', array['Tesla', 'Gers', 'Veber', 'Vatt'], 1, null, 21);
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('DTM mashq: Kimyo (1-to‘plam)', 'DTM formatidagi mashq savollari: elementlar, formulalar, mol, reaksiyalar.', 'kimyo', 'dtm', null, null, '14-maktab: darslik mavzulari va DTM fan dasturlari asosida sayt uchun tuzilgan mashq savollari (2026). O‘qituvchilar tekshirib, to‘ldirib boradi.', 50, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, sort_order) values
  ((select id from t), 'Suvning kimyoviy formulasi?', array['OH', 'H₂O', 'HO', 'H₂O₂'], 1, null, 1),
  ((select id from t), 'Osh tuzining formulasi?', array['KCl', 'Na₂CO₃', 'NaCl', 'NaOH'], 2, null, 2),
  ((select id from t), 'Kislorodning kimyoviy belgisi?', array['O', 'K', 'Ok', 'Os'], 0, null, 3),
  ((select id from t), 'Temirning kimyoviy belgisi?', array['Fe', 'F', 'Te', 'Ti'], 0, null, 4),
  ((select id from t), 'Natriyning tartib raqami?', array['23', '10', '12', '11'], 3, null, 5),
  ((select id from t), 'Uglerodning tartib raqami?', array['6', '12', '8', '14'], 0, null, 6),
  ((select id from t), 'Suvning (H₂O) molyar massasi?', array['18 g/mol', '10 g/mol', '20 g/mol', '16 g/mol'], 0, '2·1 + 16 = 18.', 7),
  ((select id from t), 'Karbonat angidridning (CO₂) molyar massasi?', array['28 g/mol', '22 g/mol', '32 g/mol', '44 g/mol'], 3, '12 + 2·16 = 44.', 8),
  ((select id from t), 'pH = 7 bo‘lgan eritma muhiti?', array['Neytral', 'Ishqoriy', 'Kislotali', 'Kuchli kislotali'], 0, null, 9),
  ((select id from t), 'Normal sharoitda 1 mol gaz qancha hajmni egallaydi?', array['22,4 l', '1 l', '11,2 l', '44,8 l'], 0, null, 10),
  ((select id from t), 'Avogadro soni taxminan?', array['1,6·10⁻¹⁹', '9,8', '6,02·10²³', '3·10⁸'], 2, null, 11),
  ((select id from t), 'Qaysi element inert (nodir) gaz?', array['Kislorod', 'Azot', 'Neon', 'Xlor'], 2, null, 12),
  ((select id from t), 'Metanning formulasi?', array['C₂H₆', 'CO', 'C₂H₂', 'CH₄'], 3, null, 13),
  ((select id from t), 'Sulfat kislotaning formulasi?', array['HNO₃', 'H₂SO₄', 'H₂CO₃', 'HCl'], 1, null, 14),
  ((select id from t), 'Kimyoviy elementlar davriy jadvalini kim yaratgan?', array['A. Lavuaze', 'J. Dalton', 'D. I. Mendeleyev', 'M. V. Lomonosov'], 2, null, 15),
  ((select id from t), 'Kislorod atomida nechta elektron bor?', array['6', '16', '2', '8'], 3, 'Tartib raqami 8 — elektronlari ham 8 ta.', 16),
  ((select id from t), 'NaOH qaysi moddalar sinfiga kiradi?', array['Asos (ishqor)', 'Oksid', 'Kislota', 'Tuz'], 0, null, 17),
  ((select id from t), 'Havo tarkibida qaysi gaz eng ko‘p?', array['Argon', 'Azot', 'Karbonat angidrid', 'Kislorod'], 1, 'Azot havoning taxminan 78 foizini tashkil qiladi.', 18),
  ((select id from t), 'Olmos va grafit qaysi elementning allotropik shakllari?', array['Kremniy', 'Fosfor', 'Oltingugurt', 'Uglerod'], 3, null, 19),
  ((select id from t), '2H₂ + O₂ → 2H₂O reaksiyasi qaysi turga kiradi?', array['O‘rin olish', 'Birikish', 'Parchalanish', 'Almashinish'], 1, null, 20),
  ((select id from t), 'Kaliyning kimyoviy belgisi?', array['P', 'Ka', 'K', 'Ca'], 2, null, 21);
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('DTM mashq: Biologiya (1-to‘plam)', 'DTM formatidagi mashq savollari: hujayra, genetika, odam, hayvonlar.', 'biologiya', 'dtm', null, null, '14-maktab: darslik mavzulari va DTM fan dasturlari asosida sayt uchun tuzilgan mashq savollari (2026). O‘qituvchilar tekshirib, to‘ldirib boradi.', 60, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, sort_order) values
  ((select id from t), 'Hujayraning «energiya stansiyasi» qaysi organoid?', array['Yadro', 'Ribosoma', 'Mitoxondriya', 'Lizosoma'], 2, null, 1),
  ((select id from t), 'Fotosintez hujayraning qaysi qismida boradi?', array['Xloroplast', 'Vakuola', 'Mitoxondriya', 'Ribosoma'], 0, null, 2),
  ((select id from t), 'Odamning somatik hujayralarida nechta xromosoma bor?', array['44', '23', '48', '46'], 3, null, 3),
  ((select id from t), 'RNKda timin o‘rniga qaysi azotli asos bo‘ladi?', array['Urasil', 'Guanin', 'Sitozin', 'Adenin'], 0, null, 4),
  ((select id from t), 'Odam yuragi necha kamerali?', array['3', '4', '5', '2'], 1, null, 5),
  ((select id from t), 'AB0 tizimida nechta qon guruhi bor?', array['8', '2', '4', '3'], 2, null, 6),
  ((select id from t), 'Oqsil sintezi hujayraning qaysi qismida boradi?', array['Ribosoma', 'Yadrocha', 'Golji majmuasi', 'Lizosoma'], 0, null, 7),
  ((select id from t), 'Irsiyat qonunlarini kim kashf etgan?', array['Lui Paster', 'Gregor Mendel', 'Charlz Darvin', 'Ivan Pavlov'], 1, null, 8),
  ((select id from t), 'Tabiiy tanlanish nazariyasini kim yaratgan?', array['Karl Linney', 'Jan Batist Lamark', 'Charlz Darvin', 'Gregor Mendel'], 2, null, 9),
  ((select id from t), 'Odam organizmidagi eng yirik bez?', array['Oshqozon osti bezi', 'Qalqonsimon bez', 'Buyrak usti bezi', 'Jigar'], 3, null, 10),
  ((select id from t), 'Eritrotsitlarning asosiy vazifasi?', array['Kislorod tashish', 'Gormon ishlab chiqarish', 'Organizmni mikroblardan himoya qilish', 'Qon ivishi'], 0, null, 11),
  ((select id from t), 'Qon ivishida qaysi qon hujayralari qatnashadi?', array['Limfotsitlar', 'Eritrotsitlar', 'Trombotsitlar', 'Leykotsitlar'], 2, null, 12),
  ((select id from t), 'Insulin gormonini qaysi bez ishlab chiqaradi?', array['Oshqozon osti bezi', 'Gipofiz', 'Buyrak usti bezi', 'Qalqonsimon bez'], 0, null, 13),
  ((select id from t), 'Hasharotlarning nechta oyog‘i bor?', array['6', '8', '10', '4'], 0, null, 14),
  ((select id from t), 'O‘rgimchakning nechta oyog‘i bor?', array['6', '10', '4', '8'], 3, null, 15),
  ((select id from t), 'Qaysi hayvon sutemizuvchi?', array['Pingvin', 'Kit', 'Akula', 'Timsoh'], 1, null, 16),
  ((select id from t), 'Mitoz natijasida bitta hujayradan nechta hujayra hosil bo‘ladi?', array['4 ta gaploid hujayra', '1 ta hujayra', '2 ta bir xil hujayra', '2 ta har xil gaploid hujayra'], 2, null, 17),
  ((select id from t), 'Jinsiy hujayralarda (gametalarda) xromosomalar to‘plami qanday?', array['Diploid (2n)', 'Tetraploid (4n)', 'Triploid (3n)', 'Gaploid (n)'], 3, null, 18),
  ((select id from t), 'Viruslar haqidagi to‘g‘ri fikr?', array['Hujayraviy tuzilishga ega emas', 'Yadroli hujayralardan iborat', 'Bakteriyalarning bir turi', 'Fotosintez qiladi'], 0, null, 19),
  ((select id from t), 'Katta yoshli odam skeletida taxminan nechta suyak bor?', array['300', '256', '180', '206'], 3, null, 20);
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('DTM mashq: Ingliz tili (1-to‘plam)', 'DTM formatidagi mashq savollari: grammatika va so‘z boyligi.', 'ingliz', 'dtm', null, null, '14-maktab: darslik mavzulari va DTM fan dasturlari asosida sayt uchun tuzilgan mashq savollari (2026). O‘qituvchilar tekshirib, to‘ldirib boradi.', 70, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, sort_order) values
  ((select id from t), 'She ___ a student.', array['are', 'is', 'am', 'be'], 1, null, 1),
  ((select id from t), 'They ___ football every Sunday.', array['is play', 'playing', 'play', 'plays'], 2, null, 2),
  ((select id from t), 'Choose the past form of «go».', array['goed', 'gone', 'went', 'going'], 2, null, 3),
  ((select id from t), 'Choose the plural of «child».', array['children', 'childes', 'child', 'childs'], 0, null, 4),
  ((select id from t), 'I have lived here ___ 2015.', array['for', 'from', 'at', 'since'], 3, '«Since» + a point in time; «for» + a period.', 5),
  ((select id from t), 'Choose the opposite of «big».', array['wide', 'long', 'small', 'tall'], 2, null, 6),
  ((select id from t), 'Look! He ___ TV now.', array['is watching', 'watched', 'watch', 'watches'], 0, '«Now» → Present Continuous.', 7),
  ((select id from t), '«Kitob» in English is …', array['bag', 'book', 'pen', 'desk'], 1, null, 8),
  ((select id from t), 'Choose the comparative of «good».', array['more good', 'gooder', 'better', 'best'], 2, null, 9),
  ((select id from t), 'There ___ many apples on the table.', array['be', 'is', 'are', 'am'], 2, null, 10),
  ((select id from t), 'If it rains, we ___ at home.', array['stayed', 'will stay', 'would stayed', 'staying'], 1, 'First conditional: if + Present Simple, will + verb.', 11),
  ((select id from t), '___ you speak English?', array['Is', 'Does', 'Can', 'Are'], 2, null, 12),
  ((select id from t), 'Choose the superlative of «beautiful».', array['beautifuller', 'more beautiful', 'the most beautiful', 'the beautifulest'], 2, null, 13),
  ((select id from t), 'She has ___ apple.', array['a', 'much', 'an', 'two'], 2, '«Apple» begins with a vowel sound → «an».', 14),
  ((select id from t), 'Choose the past participle of «write».', array['writed', 'writing', 'wrote', 'written'], 3, null, 15),
  ((select id from t), '«How old are you?» — the best answer:', array['I am from Uzbekistan.', 'I am fifteen.', 'I am fine.', 'I am a pupil.'], 1, null, 16),
  ((select id from t), 'The letter ___ yesterday.', array['is writing', 'has write', 'was written', 'wrote'], 2, 'Passive voice, Past Simple: was/were + V3.', 17),
  ((select id from t), 'I was born ___ May.', array['by', 'in', 'on', 'at'], 1, 'Months take «in».', 18),
  ((select id from t), 'Every day he ___ to school by bus.', array['going', 'go', 'goes', 'gone'], 2, null, 19),
  ((select id from t), 'Choose the synonym of «happy».', array['sad', 'glad', 'tired', 'angry'], 1, null, 20);
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('DTM mashq: Ona tili va adabiyot (1-to‘plam)', 'DTM formatidagi mashq savollari: so‘z turkumlari, gap bo‘laklari, adabiyot.', 'ona_tili', 'dtm', null, null, '14-maktab: darslik mavzulari va DTM fan dasturlari asosida sayt uchun tuzilgan mashq savollari (2026). O‘qituvchilar tekshirib, to‘ldirib boradi.', 80, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, sort_order) values
  ((select id from t), 'Ot so‘z turkumi qaysi so‘roqlarga javob beradi?', array['qanday? qanaqa?', 'qancha? nechta?', 'kim? nima? qayer?', 'nima qildi?'], 2, null, 1),
  ((select id from t), 'Sifat qaysi so‘roqlarga javob beradi?', array['nima qildi?', 'qachon? qayerda?', 'kim? nima?', 'qanday? qanaqa? qaysi?'], 3, null, 2),
  ((select id from t), 'Fe’l qaysi so‘roqlarga javob beradi?', array['kim? nima?', 'qanday? qanaqa?', 'nechta? qancha?', 'nima qildi? nima qilyapti?'], 3, null, 3),
  ((select id from t), '«Kitob» so‘zi qaysi so‘z turkumiga kiradi?', array['Ot', 'Fe’l', 'Ravish', 'Sifat'], 0, null, 4),
  ((select id from t), '«Chiroyli» so‘zi qaysi so‘z turkumiga kiradi?', array['Ot', 'Fe’l', 'Son', 'Sifat'], 3, null, 5),
  ((select id from t), '«Yugurdi» so‘zi qaysi so‘z turkumiga kiradi?', array['Sifat', 'Ot', 'Ravish', 'Fe’l'], 3, null, 6),
  ((select id from t), 'O‘zbek tilida nechta unli tovush bor?', array['8 ta', '10 ta', '5 ta', '6 ta'], 3, 'a, e, i, o, u, o‘.', 7),
  ((select id from t), '«Uch», «o‘n» so‘zlari qaysi so‘z turkumiga kiradi?', array['Olmosh', 'Son', 'Ravish', 'Sifat'], 1, null, 8),
  ((select id from t), '«Men, sen, u» so‘zlari qaysi so‘z turkumiga kiradi?', array['Son', 'Fe’l', 'Olmosh', 'Ot'], 2, null, 9),
  ((select id from t), 'Gapning bosh bo‘laklari?', array['Hol va kesim', 'Ega va aniqlovchi', 'Ega va kesim', 'To‘ldiruvchi va aniqlovchi'], 2, null, 10),
  ((select id from t), '«Tez yurdi» birikmasida «tez» qaysi so‘z turkumi?', array['Ravish', 'Fe’l', 'Sifat', 'Ot'], 0, null, 11),
  ((select id from t), 'Ko‘plik qo‘shimchasi qaysi?', array['-ni', '-lar', '-da', '-ning'], 1, null, 12),
  ((select id from t), 'Qaratqich kelishigi qo‘shimchasi qaysi?', array['-ga', '-ni', '-ning', '-dan'], 2, null, 13),
  ((select id from t), '«O‘tkan kunlar» romanining muallifi?', array['Abdulla Qodiriy', 'G‘afur G‘ulom', 'Oybek', 'Cho‘lpon'], 0, null, 14),
  ((select id from t), '«Xamsa» asarining muallifi?', array['Alisher Navoiy', 'Ogahiy', 'Lutfiy', 'Zahiriddin Muhammad Bobur'], 0, null, 15),
  ((select id from t), '«Boburnoma» asarining muallifi?', array['Zokirjon Furqat', 'Boborahim Mashrab', 'Alisher Navoiy', 'Zahiriddin Muhammad Bobur'], 3, null, 16),
  ((select id from t), '«Kecha va kunduz» romanining muallifi?', array['Hamza Hakimzoda Niyoziy', 'Oybek', 'Abdulla Qodiriy', 'Cho‘lpon'], 3, null, 17);
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('DTM mashq: O‘zbekiston tarixi (1-to‘plam)', 'DTM formatidagi mashq savollari: qadimgi davr, Temuriylar, mustaqillik yillari.', 'tarix', 'dtm', null, null, '14-maktab: darslik mavzulari va DTM fan dasturlari asosida sayt uchun tuzilgan mashq savollari (2026). O‘qituvchilar tekshirib, to‘ldirib boradi.', 90, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, sort_order) values
  ((select id from t), 'O‘zbekiston Respublikasi Oliy Kengashi davlat mustaqilligini qachon e’lon qildi?', array['1991-yil 31-avgust', '1992-yil 8-dekabr', '1991-yil 25-dekabr', '1990-yil 20-iyun'], 0, null, 1),
  ((select id from t), 'O‘zbekiston Respublikasining birinchi Konstitutsiyasi qachon qabul qilingan?', array['1991-yil 31-avgust', '1992-yil 8-dekabr', '1992-yil 2-mart', '1994-yil 1-iyul'], 1, null, 2),
  ((select id from t), 'Amir Temur qaysi yili tug‘ilgan?', array['1405-yil', '1320-yil', '1370-yil', '1336-yil'], 3, null, 3),
  ((select id from t), 'Amir Temur davlatining poytaxti?', array['Shahrisabz', 'Hirot', 'Samarqand', 'Buxoro'], 2, null, 4),
  ((select id from t), 'Mirzo Ulug‘bek rasadxonasi qaysi shaharda qurilgan?', array['Samarqand', 'Xiva', 'Buxoro', 'Toshkent'], 0, null, 5),
  ((select id from t), 'Zahiriddin Muhammad Bobur Hindistonda qaysi sulolaga asos solgan?', array['Boburiylar', 'Temuriylar', 'Shayboniylar', 'Ashtarxoniylar'], 0, null, 6),
  ((select id from t), 'Algebra faniga asos solgan olim?', array['Abu Ali ibn Sino', 'Abu Rayhon Beruniy', 'Muhammad al-Xorazmiy', 'Ahmad al-Farg‘oniy'], 2, null, 7),
  ((select id from t), '«Tib qonunlari» asarining muallifi?', array['Mirzo Ulug‘bek', 'Abu Ali ibn Sino', 'Abu Rayhon Beruniy', 'Muhammad al-Xorazmiy'], 1, null, 8),
  ((select id from t), 'O‘zbekiston milliy valyutasi — so‘m to‘liq muomalaga qachon kiritilgan?', array['1991-yil 31-avgust', '2000-yil 1-yanvar', '1994-yil 1-iyul', '1992-yil 8-dekabr'], 2, null, 9),
  ((select id from t), 'O‘zbekiston Birlashgan Millatlar Tashkilotiga qachon a’zo bo‘ldi?', array['1992-yil 2-mart', '1995-yil 1-iyun', '1991-yil 1-sentabr', '1993-yil 8-dekabr'], 0, null, 10),
  ((select id from t), 'Amir Temur maqbarasi qanday nomlanadi?', array['Go‘ri Amir', 'Bibixonim', 'Registon', 'Shohi Zinda'], 0, null, 11),
  ((select id from t), 'Jaloliddin Manguberdi qaysi bosqinchilarga qarshi kurashgan?', array['Mo‘g‘ullar', 'Arablar', 'Yunon-makedonlar', 'Ruslar'], 0, null, 12),
  ((select id from t), 'Aleksandr Makedonskiyga qarshi kurash olib borgan So‘g‘d qahramoni?', array['Spitamen', 'To‘maris', 'Shiroq', 'Muqanna'], 0, null, 13),
  ((select id from t), 'Buyuk Ipak yo‘li qaysi hududlarni bog‘lagan?', array['Arabistonni Amerika bilan', 'Rossiyani Yaponiya bilan', 'Xitoyni O‘rta yer dengizi mamlakatlari bilan', 'Hindistonni Afrika bilan'], 2, null, 14);
with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)
  values ('DTM mashq: Geografiya (1-to‘plam)', 'DTM formatidagi mashq savollari: O‘zbekiston va dunyo geografiyasi.', 'geografiya', 'dtm', null, null, '14-maktab: darslik mavzulari va DTM fan dasturlari asosida sayt uchun tuzilgan mashq savollari (2026). O‘qituvchilar tekshirib, to‘ldirib boradi.', 100, true) returning id)
insert into public.test_questions (test_id, question, options, correct, explanation, sort_order) values
  ((select id from t), 'O‘zbekiston tarkibida Qoraqalpog‘iston Respublikasidan tashqari nechta viloyat bor?', array['11 ta', '13 ta', '12 ta', '14 ta'], 2, null, 1),
  ((select id from t), 'Surxondaryo viloyatining markazi?', array['Qarshi', 'Termiz', 'Denov', 'Sherobod'], 1, null, 2),
  ((select id from t), 'O‘zbekistonning eng baland nuqtasi?', array['Adelung cho‘qqisi', 'Hazrat Sulton cho‘qqisi', 'Bobotog‘', 'Katta Chimyon'], 1, 'Hisor tizmasida, 4643 m.', 3),
  ((select id from t), 'O‘zbekiston nechta davlat bilan chegaradosh?', array['6 ta', '4 ta', '3 ta', '5 ta'], 3, 'Qozog‘iston, Qirg‘iziston, Tojikiston, Afg‘oniston, Turkmaniston.', 4),
  ((select id from t), 'Orol dengiziga qaysi daryolar quyiladi?', array['Surxondaryo va Sherobod', 'Amudaryo va Sirdaryo', 'Chirchiq va Ohangaron', 'Zarafshon va Qashqadaryo'], 1, null, 5),
  ((select id from t), 'Qizilqum cho‘li qaysi daryolar oralig‘ida joylashgan?', array['Surxondaryo va Kofirnihon', 'Amudaryo va Sirdaryo', 'Norin va Qoradaryo', 'Zarafshon va Chirchiq'], 1, null, 6),
  ((select id from t), 'Yer yuzidagi eng katta okean?', array['Hind okeani', 'Tinch okeani', 'Shimoliy Muz okeani', 'Atlantika okeani'], 1, null, 7),
  ((select id from t), 'Eng katta materik?', array['Antarktida', 'Shimoliy Amerika', 'Afrika', 'Yevrosiyo'], 3, null, 8),
  ((select id from t), 'Ekvatorning uzunligi taxminan?', array['20 000 km', '12 000 km', '6 400 km', '40 000 km'], 3, null, 9),
  ((select id from t), 'O‘zbekiston iqlimi qanday?', array['Mo‘tadil dengiz', 'Tropik nam', 'Subarktik', 'Keskin kontinental'], 3, null, 10),
  ((select id from t), 'Yer o‘z o‘qi atrofida qancha vaqtda bir marta aylanadi?', array['12 soatda', '365 kunda', '30 kunda', 'Taxminan 24 soatda'], 3, null, 11),
  ((select id from t), 'O‘zbekistonning poytaxti?', array['Buxoro', 'Namangan', 'Toshkent', 'Samarqand'], 2, null, 12);
commit;
