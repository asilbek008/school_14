"""Generates supabase/seed/tests-2026-3.sql — the question bank, part 3, and the first lessons of the learning path
(owner's request, 2026-09: "0 dan" tayyorlov, Milliy sertifikat / CEFR formati).
Everything is original, written for the site from the subject programmes; facts and arithmetic checked; nothing copied
from test books or other platforms. Each question lists the right answer first; options are shuffled (seeded).
Run: python3 scripts/seed_tests_3.py > supabase/seed/tests-2026-3.sql   (applied once; re-running duplicates the tests,
the lessons are upserted)
"""
import random
import sys

SOURCE = "14-maktab: fan dasturlari asosida sayt uchun tuzilgan original mashq savollari (2026, 3-qism). O‘qituvchilar tekshirib, to‘ldirib boradi."
E, M, H = 1, 2, 3
TESTS = []


def test(title, subject, minutes, desc, items):
    TESTS.append((title, subject, minutes, desc, items))


test("Ingliz tili | CEFR B1: grammatika, lug‘at va o‘qish", "ingliz", 30,
 "Milliy sertifikat va CEFR (B1) formatidagi mashq: zamonlar, shart gaplar, majhul nisbat, modal fe’llar, sifat darajalari, predloglar, o‘zlashtirma gap, lug‘at va qisqa matn.", [
 ("She ___ in London since 2019.", ["has lived", "lived", "is living", "lives"], "Since + boshlangan vaqt — Present Perfect.", "Present Perfect", M),
 ("I have never ___ sushi.", ["eaten", "ate", "eat", "eating"], "have + V3 (eat – ate – eaten).", "Present Perfect", E),
 ("___ you ever been to Samarkand?", ["Have", "Did", "Are", "Were"], "Ever bilan tajriba haqida so‘roq — Have you ever…?", "Present Perfect", E),
 ("We ___ the film yet.", ["haven't seen", "didn't see", "don't see", "aren't seeing"], "Yet inkor gapda Present Perfect bilan.", "Present Perfect", M),
 ("Yesterday I ___ my grandmother.", ["visited", "have visited", "visit", "was visit"], "Yesterday — aniq o‘tgan vaqt, Past Simple.", "Past Simple", E),
 ("When I was a child, I ___ swim well.", ["couldn't", "can't", "mustn't", "shouldn't"], "O‘tgan zamondagi qobiliyat — could / couldn't.", "Modal verbs", M),
 ("He ___ TV when the phone rang.", ["was watching", "watched", "is watching", "has watched"], "Davom etayotgan ish (Past Continuous) + qisqa voqea (Past Simple).", "Past Continuous", M),
 ("If it rains tomorrow, we ___ at home.", ["will stay", "would stay", "stayed", "stay"], "1-tur shart gap: If + Present Simple, will + V1.", "Conditionals", M),
 ("If I ___ rich, I would travel the world.", ["were", "am", "will be", "have been"], "2-tur shart gap: If + Past Simple (were), would + V1.", "Conditionals", M),
 ("If you heat ice, it ___.", ["melts", "melted", "would melt", "will melted"], "0-tur shart gap (umumiy haqiqat): ikkala qismda Present Simple.", "Conditionals", E),
 ("This bridge ___ in 1995.", ["was built", "built", "is building", "has built"], "Majhul nisbat, o‘tgan zamon: was/were + V3.", "Passive voice", M),
 ("English ___ in many countries.", ["is spoken", "speaks", "is speaking", "spoke"], "Majhul nisbat, hozirgi zamon: am/is/are + V3.", "Passive voice", E),
 ("The letters ___ tomorrow.", ["will be sent", "will send", "are sending", "sent"], "Kelasi zamon majhul nisbati: will be + V3.", "Passive voice", M),
 ("You ___ wear a seatbelt in a car. It's the law.", ["must", "might", "can", "would"], "Qonun, qat’iy majburiyat — must.", "Modal verbs", E),
 ("You ___ bring food — there is a café here.", ["don't have to", "mustn't", "can't", "shouldn't to"], "Don't have to — shart emas; mustn't — mumkin emas (taqiq).", "Modal verbs", H),
 ("This book is ___ than that one.", ["more interesting", "interestinger", "most interesting", "more interestinger"], "Uzun sifatlar: more + sifat + than.", "Adjectives", E),
 ("Tashkent is the ___ city in Uzbekistan.", ["largest", "larger", "most large", "large"], "Orttirma daraja: the + -est.", "Adjectives", E),
 ("She is not as tall ___ her brother.", ["as", "than", "like", "so"], "Tenglik taqqoslash: (not) as … as.", "Adjectives", M),
 ("I'm interested ___ history.", ["in", "on", "at", "for"], "interested in — turg‘un birikma.", "Prepositions", E),
 ("The meeting is ___ Monday ___ 9 o'clock.", ["on / at", "in / at", "at / on", "on / in"], "Kun oldidan on, soat oldidan at.", "Prepositions", M),
 ("She said, \"I am tired.\" → She said that she ___ tired.", ["was", "is", "has been", "will be"], "O‘zlashtirma gapda zamon bir pog‘ona orqaga suriladi: am → was.", "Reported speech", M),
 ("He asked me where I ___.", ["lived", "did live", "do live", "am living"], "O‘zlashtirma so‘roqda so‘z tartibi darak gapdagidek: where I lived.", "Reported speech", H),
 ("Choose the synonym of \"huge\".", ["enormous", "tiny", "narrow", "weak"], "huge = enormous — juda katta.", "Vocabulary", E),
 ("Choose the opposite of \"generous\".", ["mean", "kind", "polite", "brave"], "generous — saxiy; mean — xasis.", "Vocabulary", M),
 ("I'm looking forward to ___ you.", ["seeing", "see", "saw", "be seen"], "look forward to + V-ing (to bu yerda predlog).", "Gerund", M),
 ("She suggested ___ a taxi.", ["taking", "to take", "take", "took"], "suggest + V-ing.", "Gerund", H),
 ("The ___ of the film was surprising. (END)", ["ending", "endless", "ended", "endly"], "Artikl va of oldida ot kerak: ending — tugashi, yakuni.", "Word formation", M),
 ("Read: \"Aziz usually walks to school, but today it is raining, so his father is driving him.\" How does Aziz get to school today?", ["By car", "On foot", "By bus", "By bike"], "Today … his father is driving him — bugun mashinada.", "Reading", E),
 ("Read: \"The museum opens at 10 a.m. and closes at 6 p.m. On Mondays it is closed.\" When can you NOT visit the museum?", ["On Monday", "On Tuesday at 11 a.m.", "On Friday at 5 p.m.", "On Sunday at noon"], "On Mondays it is closed — dushanba kuni yopiq.", "Reading", M),
 ("There isn't ___ milk left.", ["much", "many", "a few", "few"], "Sanalmaydigan ot (milk) bilan inkorda — much.", "Quantifiers", E),
])

test("Matematika | Asosiy mavzular: kasr, foiz, tenglama, progressiya", "matematika", 40,
 "0 dan tayyorlanish uchun asosiy mavzular: kasrlar, foizlar, chiziqli va kvadrat tenglamalar, tengsizliklar, progressiyalar, kombinatorika, ehtimollik va Pifagor teoremasi.", [
 ("1/2 + 1/3 = ?", ["5/6", "2/5", "1/5", "2/6"], "Umumiy maxraj 6: 3/6 + 2/6 = 5/6.", "Kasrlar", E),
 ("3/4 · 2/9 = ?", ["1/6", "5/13", "2/3", "3/8"], "(3 · 2)/(4 · 9) = 6/36 = 1/6.", "Kasrlar", M),
 ("2/3 : 4/9 = ?", ["3/2", "8/27", "2/3", "1/2"], "Bo‘lish — teskarisiga ko‘paytirish: 2/3 · 9/4 = 18/12 = 3/2.", "Kasrlar", M),
 ("0,75 ni oddiy kasr ko‘rinishida yozing.", ["3/4", "7/5", "3/5", "7/50"], "0,75 = 75/100 = 3/4.", "Kasrlar", E),
 ("Qaysi kasr eng katta?", ["5/6", "3/4", "2/3", "7/12"], "Maxraj 12 ga keltiramiz: 10/12, 9/12, 8/12, 7/12.", "Kasrlar", M),
 ("80 ning 15 % i nechaga teng?", ["12", "15", "8", "10"], "80 · 0,15 = 12.", "Foizlar", E),
 ("Narx 200 so‘mdan 250 so‘mga oshdi. Necha foizga oshgan?", ["25 %", "50 %", "20 %", "30 %"], "Oshish 50 so‘m; 50/200 = 0,25 = 25 %.", "Foizlar", M),
 ("Tovar 20 % arzonlashib, 400 000 so‘m bo‘ldi. Dastlabki narxi qancha edi?", ["500 000 so‘m", "480 000 so‘m", "420 000 so‘m", "320 000 so‘m"], "Yangi narx dastlabkining 80 % i: 400 000 : 0,8 = 500 000.", "Foizlar", H),
 ("30 soni 120 ning necha foizini tashkil qiladi?", ["25 %", "30 %", "40 %", "4 %"], "30/120 = 0,25 = 25 %.", "Foizlar", E),
 ("Omonatga yiliga 10 % (murakkab foiz) qo‘shiladi. 1 000 000 so‘m 2 yildan keyin qancha bo‘ladi?", ["1 210 000 so‘m", "1 200 000 so‘m", "1 100 000 so‘m", "1 020 000 so‘m"], "1 000 000 · 1,1 · 1,1 = 1 210 000.", "Foizlar", H),
 ("3x − 7 = 11 tenglamani yeching.", ["6", "4/3", "18", "5"], "3x = 18, x = 6.", "Tenglamalar", E),
 ("2(x + 3) = 5x − 9 tenglamani yeching.", ["5", "3", "−5", "1"], "2x + 6 = 5x − 9 → 15 = 3x → x = 5.", "Tenglamalar", M),
 ("x/4 + 2 = 5 tenglamani yeching.", ["12", "28", "3", "8"], "x/4 = 3, x = 12.", "Tenglamalar", E),
 ("|x − 3| = 5 tenglamaning ildizlari?", ["8 va −2", "faqat 8", "2 va −2", "−8 va 2"], "x − 3 = 5 yoki x − 3 = −5.", "Tenglamalar", M),
 ("x² − 5x + 6 = 0 tenglamaning ildizlari?", ["2 va 3", "−2 va −3", "1 va 6", "−1 va 6"], "Yig‘indisi 5, ko‘paytmasi 6 — 2 va 3.", "Kvadrat tenglamalar", E),
 ("x² − 4x + 4 = 0 tenglamaning nechta turli ildizi bor?", ["1 ta", "2 ta", "Ildizi yo‘q", "Cheksiz ko‘p"], "D = 16 − 16 = 0 — bitta ildiz (x = 2).", "Kvadrat tenglamalar", M),
 ("x² + x + 5 = 0 tenglama haqida to‘g‘ri fikr?", ["Haqiqiy ildizi yo‘q", "1 ta ildizi bor", "2 ta ildizi bor", "Ildizlari 1 va 5"], "D = 1 − 20 < 0.", "Kvadrat tenglamalar", M),
 ("Arifmetik progressiyada a₁ = 3, d = 4. a₁₀ = ?", ["39", "43", "40", "36"], "aₙ = a₁ + (n − 1)d = 3 + 9 · 4 = 39.", "Progressiyalar", M),
 ("2, 6, 18, … geometrik progressiyaning 5-hadi?", ["162", "54", "486", "108"], "q = 3: b₅ = 2 · 3⁴ = 162.", "Progressiyalar", M),
 ("1 + 2 + 3 + … + 100 = ?", ["5050", "5000", "10100", "4950"], "(1 + 100) · 100 / 2 = 5050.", "Progressiyalar", M),
 ("Arifmetik progressiyada a₁ = 5, a₅ = 17. Ayirmasi d = ?", ["3", "4", "12", "2"], "a₅ = a₁ + 4d → 17 = 5 + 4d → d = 3.", "Progressiyalar", M),
 ("2x − 3 > 7 tengsizlikni yeching.", ["x > 5", "x > 2", "x < 5", "x > 10"], "2x > 10, x > 5.", "Tengsizliklar", E),
 ("x² < 9 tengsizlikni yeching.", ["−3 < x < 3", "x < 3", "x > 3", "x < −3 yoki x > 3"], "|x| < 3.", "Tengsizliklar", M),
 ("(x − 1)(x + 4) ≤ 0 tengsizlikni yeching.", ["−4 ≤ x ≤ 1", "x ≤ −4 yoki x ≥ 1", "−1 ≤ x ≤ 4", "x ≥ 1"], "Ildizlar −4 va 1; ko‘paytma ular orasida manfiy.", "Tengsizliklar", H),
 ("5 ta turli kitobni tokchaga necha xil usulda terish mumkin?", ["120", "25", "60", "5"], "5! = 5 · 4 · 3 · 2 · 1 = 120.", "Kombinatorika", M),
 ("6 kishidan 2 kishilik guruhni necha usulda tanlash mumkin?", ["15", "30", "12", "36"], "C(6, 2) = 6 · 5 / 2 = 15.", "Kombinatorika", M),
 ("Tanga 2 marta tashlanadi. Ikkala marta ham gerb tushish ehtimoli?", ["1/4", "1/2", "1/3", "3/4"], "1/2 · 1/2 = 1/4.", "Ehtimollik", E),
 ("O‘yin soqqasi tashlanganda juft son tushish ehtimoli?", ["1/2", "1/3", "1/6", "2/3"], "Juft: 2, 4, 6 — 6 tadan 3 tasi.", "Ehtimollik", E),
 ("To‘g‘ri burchakli uchburchakning katetlari 5 va 12. Gipotenuzasi?", ["13", "17", "15", "11"], "√(25 + 144) = √169 = 13.", "Pifagor teoremasi", E),
 ("Gipotenuza 10, bir kateti 6. Ikkinchi kateti?", ["8", "4", "16", "7"], "√(100 − 36) = √64 = 8.", "Pifagor teoremasi", E),
])

test("Ona tili | Milliy sertifikat formatida mashq", "ona_tili", 25,
 "Milliy sertifikat formatidagi mashq: kelishiklar, so‘z turkumlari, leksikologiya, gap bo‘laklari va qo‘shma gaplar, fonetika va qo‘shimchalar.", [
 ("«Kitobni» so‘zi qaysi kelishikda?", ["Tushum kelishigi", "Qaratqich kelishigi", "Jo‘nalish kelishigi", "Chiqish kelishigi"], "-ni — tushum kelishigi qo‘shimchasi (kimni? nimani?).", "Kelishiklar", E),
 ("«Maktabdan» so‘zi qaysi kelishikda?", ["Chiqish kelishigi", "O‘rin-payt kelishigi", "Jo‘nalish kelishigi", "Bosh kelishik"], "-dan — chiqish kelishigi (kimdan? nimadan? qayerdan?).", "Kelishiklar", E),
 ("«Uyga» so‘zi qaysi kelishikda?", ["Jo‘nalish kelishigi", "O‘rin-payt kelishigi", "Tushum kelishigi", "Qaratqich kelishigi"], "-ga — jo‘nalish kelishigi (kimga? nimaga? qayerga?).", "Kelishiklar", E),
 ("O‘zbek tilida nechta kelishik bor?", ["6", "5", "7", "8"], "Bosh, qaratqich, tushum, jo‘nalish, o‘rin-payt, chiqish.", "Kelishiklar", E),
 ("«Chiroyli» so‘zi qaysi so‘z turkumiga kiradi?", ["Sifat", "Ot", "Ravish", "Fe’l"], "Belgini bildiradi, qanday? so‘rog‘iga javob beradi.", "So‘z turkumlari", E),
 ("«U tez yugurdi» gapida «tez» qaysi so‘z turkumi?", ["Ravish", "Sifat", "Ot", "Olmosh"], "Harakatning belgisini bildiradi (qanday yugurdi?) — ravish.", "So‘z turkumlari", M),
 ("«Men, sen, u» qanday olmoshlar?", ["Kishilik olmoshlari", "Ko‘rsatish olmoshlari", "So‘roq olmoshlari", "Belgilash olmoshlari"], "Shaxsni bildiradi.", "So‘z turkumlari", E),
 ("«Beshinchi» qaysi son turi?", ["Tartib son", "Sanoq son", "Jamlovchi son", "Taqsim son"], "-inchi qo‘shimchasi tartib sonni yasaydi.", "So‘z turkumlari", M),
 ("«Ikkovi» qaysi son turi?", ["Jamlovchi son", "Tartib son", "Kasr son", "Taqsim son"], "-ov (-ovi) — jamlovchi son qo‘shimchasi.", "So‘z turkumlari", M),
 ("Sinonimlar juftini toping.", ["yuz – bet", "katta – kichik", "oq – qora", "kun – tun"], "Sinonimlar — ma’nosi yaqin so‘zlar.", "Leksikologiya", E),
 ("Antonimlar juftini toping.", ["issiq – sovuq", "chiroyli – go‘zal", "dono – aqlli", "tez – chaqqon"], "Antonimlar — ma’nosi qarama-qarshi so‘zlar.", "Leksikologiya", E),
 ("Bir xil aytilib, ma’nosi boshqa-boshqa bo‘lgan so‘zlar (masalan, «ot» — hayvon va «ot» — ism) qanday ataladi?", ["Omonimlar", "Sinonimlar", "Antonimlar", "Paronimlar"], "Shakli bir xil, ma’nosi har xil — omonim.", "Leksikologiya", M),
 ("Gapning bosh bo‘laklarini ko‘rsating.", ["Ega va kesim", "Ega va to‘ldiruvchi", "Kesim va hol", "Aniqlovchi va to‘ldiruvchi"], "Gapning asosini ega va kesim tashkil qiladi.", "Sintaksis", E),
 ("Qaysi gap so‘roq gap?", ["Sen qachon kelasan?", "Bugun havo issiq.", "Darsga kech qolma!", "Qanday go‘zal kun!"], "So‘roq gap so‘roqni ifodalaydi, oxirida so‘roq belgisi.", "Sintaksis", E),
 ("«Qor yog‘di va hamma yoq oppoq bo‘ldi» — qanday gap?", ["Bog‘langan qo‘shma gap", "Ergash gapli qo‘shma gap", "Bog‘lovchisiz qo‘shma gap", "Sodda gap"], "Ikki sodda gap teng bog‘lovchi «va» bilan bog‘langan.", "Sintaksis", M),
 ("O‘zbek adabiy tilida nechta unli tovush bor?", ["6", "5", "8", "10"], "a, o, u, e, i, o‘.", "Fonetika", E),
 ("«Kitobxon» so‘zidagi «-xon» qanday qo‘shimcha?", ["So‘z yasovchi", "Shakl yasovchi", "Kelishik qo‘shimchasi", "Egalik qo‘shimchasi"], "Yangi ma’noli so‘z (kitob o‘quvchi) yasaydi.", "Morfologiya", M),
 ("«Uyimiz» so‘zidagi «-imiz» qanday qo‘shimcha?", ["I shaxs ko‘plikdagi egalik qo‘shimchasi", "Kelishik qo‘shimchasi", "Ko‘plik qo‘shimchasi", "So‘z yasovchi qo‘shimcha"], "Kimning uyi? — bizning.", "Morfologiya", M),
 ("«va, lekin, ammo» qaysi yordamchi so‘zlar?", ["Bog‘lovchilar", "Ko‘makchilar", "Yuklamalar", "Undovlar"], "So‘z va gaplarni bog‘laydi.", "Yordamchi so‘zlar", E),
 ("«uchun, bilan, kabi» qaysi yordamchi so‘zlar?", ["Ko‘makchilar", "Bog‘lovchilar", "Yuklamalar", "Modal so‘zlar"], "Ot bilan kelib, munosabat bildiradi.", "Yordamchi so‘zlar", M),
])

# The learning path's first short lessons: rule, a worked example, the usual mistake.
NOTES = {
"matematika": {
"Kasrlar": "Kasr — butunning qismi: a/b da b (maxraj) butun necha qismga bo‘linganini, a (surat) nechta qism olinganini ko‘rsatadi.\n\nQo‘shish va ayirish: avval maxrajlarni tenglashtiring. 1/2 + 1/3 = 3/6 + 2/6 = 5/6.\nKo‘paytirish: surat suratga, maxraj maxrajga. Bo‘lish: ikkinchi kasrni to‘ntirib ko‘paytiring: 2/3 : 4/9 = 2/3 · 9/4 = 3/2.\n\nDiqqat: maxrajlarni qo‘shib yubormang — 1/2 + 1/3 ≠ 2/5.",
"Foizlar": "1 % — sonning yuzdan biri. p % ni topish: son · p/100. Masalan, 80 ning 15 % i = 80 · 0,15 = 12.\n\nNecha foiz: qism / butun · 100. 30 soni 120 ning 30/120 · 100 = 25 % i.\nFoizga o‘zgarish: yangi narx = eski · (1 ± p/100). 20 % arzonlashsa — 0,8 ga ko‘paytiriladi; dastlabki narx = yangi : 0,8.\n\nDiqqat: ketma-ket foizlar qo‘shilmaydi — 10 % va yana 10 % oshish 21 % beradi (1,1 · 1,1 = 1,21).",
"Tenglamalar": "Chiziqli tenglama ax + b = c: noma’lumli hadlarni bir tomonga, sonlarni ikkinchi tomonga o‘tkazing (o‘tganda ishora o‘zgaradi), so‘ng koeffitsiyentga bo‘ling.\n\nMisol: 2(x + 3) = 5x − 9 → 2x + 6 = 5x − 9 → 15 = 3x → x = 5.\nModulli tenglama |x − a| = b (b > 0): x − a = b yoki x − a = −b — ikki ildiz.\n\nDiqqat: qavsni ochganda har bir hadni ko‘paytiring; javobni tenglamaga qo‘yib tekshiring.",
"Kvadrat tenglamalar": "ax² + bx + c = 0 uchun diskriminant D = b² − 4ac.\nD > 0 — ikki ildiz: x = (−b ± √D) / 2a; D = 0 — bitta ildiz; D < 0 — haqiqiy ildiz yo‘q.\n\nMisol: x² − 5x + 6 = 0: D = 25 − 24 = 1, x = (5 ± 1)/2 → 2 va 3.\n\nDiqqat: −b ni unutmang va 2a ga butun suratni bo‘ling.",
"Viyet teoremasi": "x² + px + q = 0 keltirilgan tenglama ildizlari uchun: x₁ + x₂ = −p, x₁ · x₂ = q.\nUmumiy holda ax² + bx + c = 0: x₁ + x₂ = −b/a, x₁ · x₂ = c/a.\n\nMisol: x² − 7x + 10 = 0 → yig‘indi 7, ko‘paytma 10 → ildizlar 2 va 5.\n\nDiqqat: yig‘indida ishora teskari (−p).",
"Progressiyalar": "Arifmetik progressiya: har had oldingisidan d ga farq qiladi. aₙ = a₁ + (n − 1)d, yig‘indi Sₙ = (a₁ + aₙ) · n / 2.\nGeometrik progressiya: har had oldingisidan q marta katta. bₙ = b₁ · qⁿ⁻¹.\n\nMisol: 1 + 2 + … + 100 = (1 + 100) · 100 / 2 = 5050.\n\nDiqqat: n-hadda (n − 1) ishlatiladi, n emas.",
"Tengsizliklar": "Tengsizlik tenglama kabi yechiladi, bitta farq bilan: ikkala tomonni manfiy songa ko‘paytirsangiz yoki bo‘lsangiz, belgi teskari bo‘ladi (−3x < 12 → x > −4).\n\nKvadrat tengsizlik: ildizlarni toping, son o‘qida belgilang. (x − 1)(x + 4) ≤ 0 → −4 ≤ x ≤ 1 (ko‘paytma ildizlar orasida manfiy).\n\nDiqqat: ≤ va ≥ da chegaraviy nuqtalar javobga kiradi.",
"Pifagor teoremasi": "To‘g‘ri burchakli uchburchakda gipotenuza kvadrati katetlar kvadratlari yig‘indisiga teng: c² = a² + b².\n\nMisol: katetlar 5 va 12 → c = √(25 + 144) = 13. Kateti noma’lum bo‘lsa: b = √(c² − a²).\nMashhur uchliklar: 3–4–5, 5–12–13, 6–8–10.\n\nDiqqat: gipotenuza — eng uzun tomon, to‘g‘ri burchak qarshisida.",
"Ehtimollik": "Hodisa ehtimoli = qulay natijalar soni / barcha teng imkonli natijalar soni. U 0 dan 1 gacha.\n\nMisol: soqqada juft son (2, 4, 6) — 3/6 = 1/2. Mustaqil hodisalar birga ro‘y berishi — ehtimollar ko‘paytiriladi: ikki tanga ham gerb — 1/2 · 1/2 = 1/4.\n\nDiqqat: barcha natijalarni to‘g‘ri sanang — ikki tangada 4 ta natija bor (GG, GR, RG, RR).",
"Kombinatorika": "n ta turli narsani qatorga terish usullari — n! (n faktorial): 5! = 120.\nn tadan k tasini tartibsiz tanlash — C(n, k) = n! / (k! (n − k)!): C(6, 2) = 15.\nKo‘paytirish qoidasi: birinchi tanlov m usulda, ikkinchisi k usulda bo‘lsa — jami m · k.\n\nDiqqat: tartib muhimmi (navbat, o‘rin) yoki yo‘qmi (guruh) — shunga qarab formula tanlang.",
"Daraja va ildiz": "aⁿ — a ning n marta o‘ziga ko‘paytmasi. Qoidalar: aᵐ · aⁿ = aᵐ⁺ⁿ, aᵐ : aⁿ = aᵐ⁻ⁿ, (aᵐ)ⁿ = aᵐⁿ, a⁰ = 1, a⁻ⁿ = 1/aⁿ.\n√a — kvadrati a bo‘lgan manfiy bo‘lmagan son: √49 = 7, √a · √b = √(ab).\n\nDiqqat: (a + b)² ≠ a² + b²; to‘g‘risi a² + 2ab + b².",
"Logarifm": "logₐb = c degani aᶜ = b (a > 0, a ≠ 1, b > 0). log₂8 = 3, chunki 2³ = 8.\nQoidalar: logₐ(xy) = logₐx + logₐy, logₐ(x/y) = logₐx − logₐy, logₐxⁿ = n · logₐx, logₐa = 1, logₐ1 = 0.\n\nDiqqat: log(x + y) ni bo‘lib bo‘lmaydi; manfiy son va noldan logarifm yo‘q.",
},
"ingliz": {
"Present Perfect": "Tuzilishi: have/has + V3 (eat – ate – eaten). O‘tmishda bo‘lgan, natijasi hozir muhim ish yoki hozirgacha davom etgan holat.\n\nKalit so‘zlar: ever, never, already, yet, just, since (boshlangan vaqt), for (davomiylik).\nI have lived here since 2019. Have you ever been to Samarkand? We haven't seen it yet.\n\nDiqqat: aniq o‘tgan vaqt (yesterday, in 2020, last week) bo‘lsa — Past Simple.",
"Past Simple": "Tugagan ish, aniq o‘tgan vaqt bilan: yesterday, last week, in 2015, ago.\nTo‘g‘ri fe’llar -ed oladi (visit → visited), noto‘g‘rilari yodlanadi (go → went, see → saw).\nInkor va so‘roq: did + V1: I didn't go. Did you see it?\n\nDiqqat: did dan keyin fe’l asosiy shaklda: Did he went ❌ → Did he go ✓.",
"Conditionals": "0-tur (umumiy haqiqat): If + Present, Present — If you heat ice, it melts.\n1-tur (real kelajak): If + Present, will + V1 — If it rains, we will stay home.\n2-tur (xayoliy hozir): If + Past, would + V1 — If I were rich, I would travel.\n\nDiqqat: if qismida will ishlatilmaydi: If it will rain ❌.",
"Passive voice": "Majhul nisbat: ish kim tomonidan emas, nimaga qilingani muhim. Tuzilishi: to be (zamonga mos) + V3.\nPresent: English is spoken. Past: The bridge was built in 1995. Future: The letters will be sent.\nBajaruvchi by bilan: The book was written by Qodiriy.\n\nDiqqat: to be zamonni, V3 ma’noni beradi — is build ❌, is built ✓.",
"Modal verbs": "can — qobiliyat/imkon, could — o‘tmishdagi qobiliyat yoki muloyim so‘rov, must — qat’iy majburiyat, mustn't — taqiq, don't have to — shart emas, should — maslahat, might/may — ehtimol.\nModal fe’ldan keyin to siz asosiy fe’l: You must wear a seatbelt.\n\nDiqqat: mustn't (mumkin emas) va don't have to (shart emas) — ma’nosi boshqa.",
"Adjectives": "Qisqa sifatlar: -er / the -est (tall – taller – the tallest). Uzun sifatlar: more / the most (interesting – more interesting – the most interesting).\nNoto‘g‘rilari: good – better – the best, bad – worse – the worst.\nTenglik: as … as — She is as tall as her brother.\n\nDiqqat: more bilan -er birga ishlatilmaydi: more taller ❌.",
"Prepositions": "Vaqt: at — soat (at 9 o'clock), on — kun va sana (on Monday, on 5 May), in — oy, yil, fasl (in May, in 2026).\nJoy: in — ichida, on — ustida, at — nuqtada (at school).\nTurg‘un birikmalar yodlanadi: interested in, good at, afraid of, depend on.\n\nDiqqat: in the morning, lekin at night.",
"Reported speech": "O‘zlashtirma gapda zamon bir pog‘ona orqaga suriladi: am/is → was, do → did, will → would, have done → had done.\nShe said, \"I am tired.\" → She said that she was tired.\nSo‘roqda so‘z tartibi darak gapdagidek: He asked where I lived (where did I live ❌).\n\nDiqqat: olmoshlarni ham o‘zgartiring: I → he/she, my → his/her.",
"Gerund": "Gerund — fe’lning -ing shakli, ot o‘rnida keladi. Ba’zi fe’llardan keyin faqat -ing: enjoy, suggest, avoid, finish, mind — She suggested taking a taxi.\nPredlogdan keyin ham -ing: interested in reading, look forward to seeing.\n\nDiqqat: look forward to da to — predlog, shuning uchun to see ❌, to seeing ✓.",
"Quantifiers": "Sanaladigan otlar (books, apples): many, a few, few. Sanalmaydigan otlar (milk, water, time): much, a little, little.\nIkkalasiga: a lot of, some (darak), any (inkor va so‘roq).\nThere isn't much milk. There are a few apples.\n\nDiqqat: a few — «bir nechta» (ijobiy), few — «juda oz» (salbiy).",
},
"ona_tili": {
"Kelishiklar": "O‘zbek tilida 6 kelishik bor: bosh (kim? nima?), qaratqich -ning (kimning?), tushum -ni (kimni? nimani?), jo‘nalish -ga (kimga? qayerga?), o‘rin-payt -da (kimda? qayerda?), chiqish -dan (kimdan? qayerdan?).\n\nMisol: maktab-dan (chiqish), uy-ga (jo‘nalish), kitob-ni (tushum).\n\nDiqqat: qaratqich (-ning) va tushum (-ni) ni adashtirmang: «kitobning varag‘i» — qaratqich, «kitobni o‘qidim» — tushum.",
"So‘z turkumlari": "Mustaqil so‘z turkumlari: ot (kim? nima?), sifat (qanday? qanaqa?), son (nechta? nechanchi?), olmosh, fe’l (nima qildi?), ravish (qanday qilib? qachon?).\nYordamchi so‘zlar: ko‘makchi, bog‘lovchi, yuklama. Alohida guruh: modal, undov, taqlid so‘zlar.\n\nMisol: «tez» — «tez mashina» da sifat, «tez yugurdi» da ravish.\n\nDiqqat: so‘z turkumini gapdagi vazifasi va so‘rog‘iga qarab aniqlang.",
"Leksikologiya": "Sinonimlar — ma’nosi yaqin so‘zlar (yuz – bet – chehra). Antonimlar — qarama-qarshi ma’noli so‘zlar (issiq – sovuq). Omonimlar — shakli bir xil, ma’nosi boshqa so‘zlar (ot — hayvon; ot — ism).\n\nParonimlar — talaffuzi yaqin, ma’nosi boshqa so‘zlar (asr – asir).\n\nDiqqat: bitta so‘zning ko‘p ma’noliligi (ko‘z — a’zo, uzukning ko‘zi) omonimiya emas.",
"Sintaksis": "Gapning bosh bo‘laklari — ega (kim? nima?) va kesim (nima qildi? qanday?). Ikkinchi darajali bo‘laklar — to‘ldiruvchi, aniqlovchi, hol.\nMaqsadga ko‘ra gaplar: darak, so‘roq, buyruq, his-hayajon.\nQo‘shma gaplar: bog‘langan (va, lekin, ammo bilan), ergash gapli (bosh va ergash gap), bog‘lovchisiz.\n\nDiqqat: «va» bilan bog‘langan ikki sodda gap — bog‘langan qo‘shma gap.",
"Yordamchi so‘zlar": "Ko‘makchilar ot bilan kelib munosabat bildiradi: uchun, bilan, kabi, sari, bo‘ylab.\nBog‘lovchilar so‘z va gaplarni bog‘laydi: va, ham, lekin, ammo, biroq, yoki.\nYuklamalar qo‘shimcha ma’no beradi: -mi, -chi, faqat, hatto, axir.\n\nDiqqat: «bilan» ko‘makchi ham, bog‘lovchi ham bo‘lishi mumkin: «qalam bilan yozdi» (ko‘makchi), «Anvar bilan Salim» (bog‘lovchi).",
},
}


def q(s):
    return "null" if s is None else "'" + s.replace("'", "''") + "'"


def main():
    for title, subject, minutes, desc, items in TESTS:
        texts = [it[0] for it in items]
        assert len(texts) == len(set(texts)), f"repeated question in {title}"
        for question, options, expl, topic, diff in items:
            assert 2 <= len(options) <= 6 and len(options) == len(set(options)), (title, question)
            assert topic and len(topic) <= 80 and diff in (1, 2, 3), (title, question)
    for subject, notes in NOTES.items():
        for topic, body in notes.items():
            assert 20 <= len(body) <= 6000 and len(topic) <= 80, (subject, topic)

    rng = random.Random(2609)
    out = ["-- The question bank, part 3, and the first lessons of the learning path (scripts/seed_tests_3.py).", "begin;"]
    order = 30
    for title, subject, minutes, desc, items in TESTS:
        order += 1
        out.append("with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)")
        out.append(f"  values ({q(title)}, {q(desc)}, {q(subject)}, 'mavzu', null, {minutes}, {q(SOURCE)}, {order}, true) returning id)")
        vals = []
        for i, (question, options, expl, topic, diff) in enumerate(items, 1):
            ix = list(range(len(options)))
            rng.shuffle(ix)
            arr = "array[" + ", ".join(q(options[k]) for k in ix) + "]"
            vals.append(f"  ((select id from t), {q(question)}, {arr}, {ix.index(0)}, {q(expl)}, {q(topic)}, {diff}, {i})")
        out.append("insert into public.test_questions (test_id, question, options, correct, explanation, topic, difficulty, sort_order) values")
        out.append(",\n".join(vals) + ";")
    rows = [f"  ({q(s)}, {q(t)}, {q(b)})" for s, notes in NOTES.items() for t, b in notes.items()]
    out.append("insert into public.study_notes (subject, topic, body_uz) values")
    out.append(",\n".join(rows))
    out.append("on conflict (subject, topic) do update set body_uz = excluded.body_uz, updated_at = now();")
    out.append("commit;")
    print("\n".join(out))
    print(f"-- {len(TESTS)} tests, {sum(len(t[4]) for t in TESTS)} questions, {len(rows)} lessons", file=sys.stderr)


main()
