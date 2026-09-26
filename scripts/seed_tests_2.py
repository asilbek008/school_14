"""Generates supabase/seed/tests-2026-2.sql — the question bank, part 2 (owner's request, 2026-09):
1) topic and difficulty for the questions of scripts/seed_tests.py (matched by test title and question text);
2) new original practice tests (DTM "2-to‘plam" for every subject, first sets for Russian, informatics and law,
   and school-grade topic tests). Written for the site from the subject programmes; facts checked; nothing copied
   from test books. Each question lists the right answer first; options are shuffled (seeded).
Run: python3 scripts/seed_tests_2.py > supabase/seed/tests-2026-2.sql   (applied once; re-running duplicates the new tests)
"""
import random
from fractions import Fraction

SOURCE = "14-maktab: fan dasturlari va darslik mavzulari asosida sayt uchun tuzilgan mashq savollari (2026, 2-qism). O‘qituvchilar tekshirib, to‘ldirib boradi."

# ---------------------------------------------------------------- 1) tags for the existing questions
# (test title) -> [(topic, difficulty)] in the order of that test's questions in scripts/seed_tests.py
E, M, H = 1, 2, 3
OLD_TAGS = {
"Matematika | 1-sinf: sonlar, qo‘shish va ayirish": [
 ("Qo‘shish va ayirish", E), ("Qo‘shish va ayirish", E), ("Sonlarni taqqoslash", E), ("20 gacha sonlar", E), ("Qo‘shish va ayirish", E),
 ("Geometrik shakllar", E), ("Geometrik shakllar", E), ("Qo‘shish va ayirish", E), ("Qo‘shish va ayirish", E), ("Sonlar ketma-ketligi", M),
 ("Qo‘shish va ayirish", E), ("Vaqt", E), ("20 gacha sonlar", M), ("Sonlarni taqqoslash", E), ("Masalalar", M),
 ("Qo‘shish va ayirish", M), ("Geometrik shakllar", E), ("Sonlarni taqqoslash", M)],
"Musiqa | 1-sinf: notalar va cholg‘ular": [
 ("Notalar", E), ("Notalar", E), ("Cholg‘ular", E), ("Cholg‘ular", E), ("Cholg‘ular", E), ("Cholg‘ular", E), ("Cholg‘ular", E),
 ("Davlat madhiyasi", M), ("Davlat madhiyasi", M), ("Davlat madhiyasi", E)],
"DTM mashq: Matematika (1-to‘plam)": [
 ("Daraja va ildiz", E), ("Daraja va ildiz", E), ("Foizlar", E), ("Tenglamalar", E), ("Kvadrat tenglamalar", M), ("Logarifm", M),
 ("Progressiyalar", M), ("Progressiyalar", M), ("Trigonometriya", E), ("Planimetriya", E), ("Planimetriya", E), ("Planimetriya", M),
 ("Algebraik ifodalar", E), ("Kombinatorika", M), ("Sonlar", E), ("Funksiyalar", E), ("Kasrlar", E), ("Planimetriya", M),
 ("Kasrlar", E), ("Hosila", M), ("Stereometriya", E), ("Sonlar", E)],
"DTM mashq: Fizika (1-to‘plam)": [
 ("Birliklar", E), ("Birliklar", E), ("Dinamika", E), ("Dinamika", E), ("Birliklar", E), ("Ish va quvvat", E), ("Elektr toki", E),
 ("Elektr toki", E), ("Optika", E), ("Tebranish va to‘lqinlar", E), ("Energiya", M), ("Energiya", M), ("Birliklar", E),
 ("Issiqlik", E), ("Issiqlik", M), ("Birliklar", E), ("Kinematika", E), ("Molekulyar fizika", E), ("Dinamika", M), ("Optika", M),
 ("Birliklar", E)],
"DTM mashq: Kimyo (1-to‘plam)": [
 ("Formulalar", E), ("Formulalar", E), ("Kimyoviy elementlar", E), ("Kimyoviy elementlar", E), ("Davriy jadval", E), ("Davriy jadval", E),
 ("Mol va molyar massa", E), ("Mol va molyar massa", M), ("Eritmalar", E), ("Gazlar", M), ("Mol va molyar massa", M), ("Davriy jadval", E),
 ("Organik kimyo", E), ("Kislotalar", E), ("Davriy jadval", E), ("Atom tuzilishi", E), ("Asoslar", E), ("Gazlar", E),
 ("Kimyoviy elementlar", M), ("Kimyoviy reaksiyalar", E), ("Kimyoviy elementlar", E)],
"DTM mashq: Biologiya (1-to‘plam)": [
 ("Hujayra", E), ("Hujayra", E), ("Genetika", M), ("Molekulyar biologiya", M), ("Odam anatomiyasi", E), ("Odam anatomiyasi", E),
 ("Hujayra", M), ("Genetika", E), ("Evolyutsiya", E), ("Odam anatomiyasi", E), ("Odam anatomiyasi", E), ("Odam anatomiyasi", M),
 ("Odam anatomiyasi", M), ("Zoologiya", E), ("Zoologiya", E), ("Zoologiya", E), ("Hujayra", M), ("Genetika", M), ("Mikrobiologiya", M),
 ("Odam anatomiyasi", E)],
"DTM mashq: Ingliz tili (1-to‘plam)": [
 ("To be", E), ("Present Simple", E), ("Irregular verbs", E), ("Nouns", E), ("Present Perfect", M), ("Vocabulary", E),
 ("Present Continuous", E), ("Vocabulary", E), ("Adjectives", M), ("There is / are", E), ("Conditionals", M), ("Modal verbs", E),
 ("Adjectives", M), ("Articles", E), ("Irregular verbs", M), ("Speaking", E), ("Passive voice", H), ("Prepositions", E),
 ("Present Simple", E), ("Vocabulary", E)],
"DTM mashq: Ona tili va adabiyot (1-to‘plam)": [
 ("So‘z turkumlari", E), ("So‘z turkumlari", E), ("So‘z turkumlari", E), ("So‘z turkumlari", E), ("So‘z turkumlari", E), ("So‘z turkumlari", E),
 ("Fonetika", E), ("So‘z turkumlari", E), ("So‘z turkumlari", E), ("Sintaksis", E), ("So‘z turkumlari", M), ("Morfologiya", E),
 ("Kelishiklar", E), ("Adabiyot", E), ("Adabiyot", E), ("Adabiyot", E), ("Adabiyot", M)],
"DTM mashq: O‘zbekiston tarixi (1-to‘plam)": [
 ("Mustaqillik davri", E), ("Mustaqillik davri", E), ("Temuriylar davri", M), ("Temuriylar davri", E), ("Temuriylar davri", E),
 ("Temuriylar davri", M), ("Allomalar", E), ("Allomalar", E), ("Mustaqillik davri", M), ("Mustaqillik davri", M), ("Temuriylar davri", E),
 ("Mo‘g‘ullar istilosi", M), ("Qadimgi davr", M), ("Qadimgi davr", E)],
"DTM mashq: Geografiya (1-to‘plam)": [
 ("O‘zbekiston ma’muriy tuzilishi", E), ("O‘zbekiston ma’muriy tuzilishi", E), ("O‘zbekiston relyefi", M), ("O‘zbekiston chegaralari", E),
 ("O‘zbekiston suvlari", E), ("O‘zbekiston relyefi", M), ("Dunyo okeani", E), ("Materiklar", E), ("Yer shari", M), ("Iqlim", E),
 ("Yer shari", E), ("O‘zbekiston ma’muriy tuzilishi", E)],
}

# ---------------------------------------------------------------- 2) new tests
# (title, subject, kind, grade, minutes, description, [(question, [right, wrong…], explanation, topic, difficulty)])
NEW = []

def test(title, subject, kind, grade, minutes, desc, items):
    NEW.append((title, subject, kind, grade, minutes, desc, items))

test("DTM mashq: Matematika (2-to‘plam)", "matematika", "dtm", None, None,
 "DTM formatidagi mashq savollari: daraja, tenglama va tengsizliklar, logarifm, trigonometriya, geometriya, ehtimollik, hosila va integral.", [
 ("2¹⁰ ning qiymatini toping.", ["1024", "512", "2048", "100"], "2¹⁰ = 1024.", "Daraja va ildiz", E),
 ("√0,49 = ?", ["0,7", "0,07", "7", "0,49"], "0,7 · 0,7 = 0,49.", "Daraja va ildiz", E),
 ("3⁻² = ?", ["1/9", "−9", "−6", "1/6"], "a⁻ⁿ = 1/aⁿ, 3⁻² = 1/9.", "Daraja va ildiz", M),
 ("240 ning 25 foizi nechaga teng?", ["60", "24", "48", "96"], "240 · 0,25 = 60.", "Foizlar", E),
 ("Narx 200 000 so‘m edi. Avval 10 % oshirildi, keyin 10 % kamaytirildi. Yangi narx?", ["198 000 so‘m", "200 000 so‘m", "202 000 so‘m", "180 000 so‘m"], "200 000 · 1,1 = 220 000; 220 000 · 0,9 = 198 000.", "Foizlar", H),
 ("5x + 3 = 2x + 18 tenglamani yeching.", ["5", "3", "7", "15"], "3x = 15, x = 5.", "Tenglamalar", E),
 ("x² − 9 = 0 tenglamaning ildizlari?", ["−3 va 3", "3", "9", "−9 va 9"], "x² = 9, x = ±3.", "Kvadrat tenglamalar", E),
 ("x² + 4x + 4 = 0 tenglamaning ildizi?", ["−2", "2", "−4", "4"], "(x + 2)² = 0, x = −2.", "Kvadrat tenglamalar", M),
 ("2x² − 3x − 5 = 0 tenglamaning diskriminantini toping.", ["49", "31", "−31", "1"], "D = b² − 4ac = 9 + 40 = 49.", "Kvadrat tenglamalar", M),
 ("x + y = 10 va x − y = 4 sistemaning yechimi?", ["x = 7, y = 3", "x = 3, y = 7", "x = 6, y = 4", "x = 5, y = 5"], "Qo‘shsak: 2x = 14, x = 7; y = 3.", "Tenglamalar sistemasi", M),
 ("2x − 3 > 7 tengsizlikni yeching.", ["x > 5", "x > 2", "x < 5", "x > 10"], "2x > 10, x > 5.", "Tengsizliklar", E),
 ("log₃ 81 = ?", ["4", "3", "27", "9"], "3⁴ = 81.", "Logarifm", E),
 ("lg 1000 = ?", ["3", "100", "10", "4"], "10³ = 1000.", "Logarifm", E),
 ("log₂ 32 − log₂ 4 = ?", ["3", "28", "8", "5"], "log₂ 32 = 5, log₂ 4 = 2, 5 − 2 = 3.", "Logarifm", M),
 ("tg 45° = ?", ["1", "0", "√3", "1/2"], None, "Trigonometriya", E),
 ("sin²α + cos²α = ?", ["1", "0", "2", "tg α"], "Asosiy trigonometrik ayniyat.", "Trigonometriya", E),
 ("Arifmetik progressiyada a₁ = 5, d = 3. Dastlabki 10 ta hadning yig‘indisi?", ["185", "150", "155", "320"], "S₁₀ = (2·5 + 9·3) · 10 / 2 = 37 · 5 = 185.", "Progressiyalar", H),
 ("Geometrik progressiyada b₁ = 3, q = 2. Dastlabki 5 ta hadning yig‘indisi?", ["93", "48", "96", "45"], "S₅ = 3 · (2⁵ − 1) / (2 − 1) = 93.", "Progressiyalar", H),
 ("Asoslari 6 va 10, balandligi 5 bo‘lgan trapetsiyaning yuzi?", ["40", "80", "30", "60"], "S = (6 + 10) / 2 · 5 = 40.", "Planimetriya", M),
 ("Radiusi 7 ga teng aylananing uzunligi?", ["14π", "49π", "7π", "28π"], "C = 2πr = 14π.", "Planimetriya", E),
 ("Tomonlari 5, 12 va 13 bo‘lgan uchburchakning yuzi?", ["30", "60", "65", "78"], "5² + 12² = 13² — to‘g‘ri burchakli; S = 5 · 12 / 2 = 30.", "Planimetriya", H),
 ("Oltiburchak ichki burchaklarining yig‘indisi?", ["720°", "540°", "360°", "1080°"], "(n − 2) · 180° = 4 · 180° = 720°.", "Planimetriya", M),
 ("Radiusi 3 ga teng sharning hajmi?", ["36π", "12π", "27π", "108π"], "V = 4/3 · π · 27 = 36π.", "Stereometriya", M),
 ("O‘yin soqqasi tashlandi. Juft son tushish ehtimoli?", ["1/2", "1/3", "1/6", "2/3"], "6 tadan 3 tasi juft: 2, 4, 6.", "Ehtimollik", E),
 ("5 kishidan 2 kishini necha usulda tanlash mumkin?", ["10", "20", "25", "7"], "C(5, 2) = 5 · 4 / 2 = 10.", "Kombinatorika", M),
 ("y = 3x² − 4x + 1 funksiyaning hosilasi?", ["6x − 4", "3x − 4", "6x + 1", "6x² − 4"], None, "Hosila", M),
 ("∫₀² 2x dx = ?", ["4", "2", "8", "1"], "x² ni 0 dan 2 gacha: 4 − 0 = 4.", "Integral", H),
])

test("DTM mashq: Fizika (2-to‘plam)", "fizika", "dtm", None, None,
 "DTM formatidagi mashq savollari: kinematika, dinamika, bosim, ish va energiya, elektr, issiqlik, tebranishlar, optika, atom.", [
 ("72 km/soat necha m/s ga teng?", ["20 m/s", "72 m/s", "7,2 m/s", "36 m/s"], "72 000 m / 3600 s = 20 m/s.", "Kinematika", E),
 ("Jism tinch holatdan 2 m/s² tezlanish bilan harakatlandi. 5 s dan keyingi tezligi?", ["10 m/s", "2,5 m/s", "7 m/s", "25 m/s"], "v = at = 2 · 5 = 10 m/s.", "Kinematika", E),
 ("Jism tinch holatdan 2 m/s² tezlanish bilan 5 s harakatlandi. Bosib o‘tgan yo‘li?", ["25 m", "10 m", "50 m", "20 m"], "s = at²/2 = 2 · 25 / 2 = 25 m.", "Kinematika", M),
 ("Erkin tushayotgan jismning 2 s dan keyingi tezligi (g = 10 m/s²)?", ["20 m/s", "10 m/s", "5 m/s", "40 m/s"], "v = gt = 20 m/s.", "Kinematika", E),
 ("Massasi 5 kg bo‘lgan jismning og‘irligi (g = 10 m/s²)?", ["50 N", "5 N", "0,5 N", "500 N"], "P = mg = 50 N.", "Dinamika", E),
 ("Bikrligi 200 N/m bo‘lgan prujina 5 sm cho‘zildi. Elastiklik kuchi?", ["10 N", "1000 N", "40 N", "4 N"], "F = kx = 200 · 0,05 = 10 N.", "Dinamika", M),
 ("200 N kuch 0,5 m² yuzaga tik ta’sir qilmoqda. Bosim?", ["400 Pa", "100 Pa", "200 Pa", "1000 Pa"], "p = F / S = 200 / 0,5 = 400 Pa.", "Bosim", E),
 ("Suvning 10 m chuqurlikdagi bosimi (ρ = 1000 kg/m³, g = 10 m/s², atmosfera bosimisiz)?", ["100 kPa", "10 kPa", "1 kPa", "1000 kPa"], "p = ρgh = 1000 · 10 · 10 = 100 000 Pa.", "Bosim", M),
 ("Hajmi 0,002 m³ jism suvga to‘liq botirildi. Arximed kuchi (g = 10 m/s²)?", ["20 N", "2 N", "200 N", "0,2 N"], "F = ρgV = 1000 · 10 · 0,002 = 20 N.", "Bosim", M),
 ("50 N kuch jismni kuch yo‘nalishida 4 m ga ko‘chirdi. Bajarilgan ish?", ["200 J", "12,5 J", "54 J", "46 J"], "A = F · s = 200 J.", "Ish va quvvat", E),
 ("Dvigatel 60 s da 1200 J ish bajardi. Quvvati?", ["20 W", "72 000 W", "1260 W", "2 W"], "P = A / t = 1200 / 60 = 20 W.", "Ish va quvvat", E),
 ("Massasi 3 kg, tezligi 4 m/s bo‘lgan jismning impulsi?", ["12 kg·m/s", "7 kg·m/s", "24 kg·m/s", "0,75 kg·m/s"], "p = mv = 12 kg·m/s.", "Impuls", E),
 ("4 Om va 6 Om li rezistorlar ketma-ket ulangan. Umumiy qarshilik?", ["10 Om", "2,4 Om", "24 Om", "2 Om"], "Ketma-ket: R = R₁ + R₂.", "Elektr toki", E),
 ("6 Om va 3 Om li rezistorlar parallel ulangan. Umumiy qarshilik?", ["2 Om", "9 Om", "4,5 Om", "18 Om"], "R = R₁R₂ / (R₁ + R₂) = 18 / 9 = 2 Om.", "Elektr toki", M),
 ("Kuchlanish 220 V, tok kuchi 5 A. Elektr quvvati?", ["1100 W", "44 W", "225 W", "215 W"], "P = UI = 1100 W.", "Elektr toki", E),
 ("1 kW·soat necha joulga teng?", ["3,6·10⁶ J", "1000 J", "3600 J", "3,6·10³ J"], "1000 W · 3600 s = 3 600 000 J.", "Birliklar", M),
 ("2 kg suvni 10 °C ga isitish uchun qancha issiqlik kerak (c = 4200 J/(kg·°C))?", ["84 kJ", "42 kJ", "8,4 kJ", "840 kJ"], "Q = cmΔt = 4200 · 2 · 10 = 84 000 J.", "Issiqlik", M),
 ("Bosim o‘zgarmas bo‘lgan jarayon qanday nomlanadi?", ["Izobarik", "Izotermik", "Izoxorik", "Adiabatik"], None, "Molekulyar fizika", E),
 ("Tebranish chastotasi 50 Hz. Tebranish davri?", ["0,02 s", "50 s", "0,5 s", "2 s"], "T = 1 / ν = 1 / 50 = 0,02 s.", "Tebranish va to‘lqinlar", E),
 ("Tovush tezligi 340 m/s, chastotasi 170 Hz. To‘lqin uzunligi?", ["2 m", "0,5 m", "510 m", "57 800 m"], "λ = v / ν = 340 / 170 = 2 m.", "Tebranish va to‘lqinlar", M),
 ("Yassi ko‘zgudagi tasvir qanday bo‘ladi?", ["Mavhum, to‘g‘ri, buyum bilan teng kattalikda", "Haqiqiy, teskari, kichraygan", "Haqiqiy, to‘g‘ri, kattalashgan", "Mavhum, teskari, kichraygan"], None, "Optika", E),
 ("Fokus masofasi 0,5 m bo‘lgan yig‘uvchi linzaning optik kuchi?", ["2 dptr", "0,5 dptr", "5 dptr", "−2 dptr"], "D = 1 / F = 1 / 0,5 = 2 dptr.", "Optika", M),
 ("Atom yadrosi qanday zarralardan tashkil topgan?", ["Protonlar va neytronlardan", "Elektronlar va protonlardan", "Faqat elektronlardan", "Fotonlardan"], None, "Atom fizikasi", E),
 ("Elektronning zaryadi qanday ishorali?", ["Manfiy", "Musbat", "Zaryadsiz", "Ba’zan musbat, ba’zan manfiy"], None, "Atom fizikasi", E),
 ("Magnit induksiyasining birligi?", ["Tesla", "Veber", "Genri", "Gers"], None, "Birliklar", E),
])

test("DTM mashq: Kimyo (2-to‘plam)", "kimyo", "dtm", None, None,
 "DTM formatidagi mashq savollari: valentlik va oksidlanish darajasi, molyar massa, eritmalar, reaksiyalar, organik birikmalar.", [
 ("H₂O molekulasida kislorodning valentligi?", ["II", "I", "III", "IV"], None, "Valentlik", E),
 ("H₂SO₄ da oltingugurtning oksidlanish darajasi?", ["+6", "+4", "−2", "+2"], "2·(+1) + x + 4·(−2) = 0, x = +6.", "Oksidlanish darajasi", M),
 ("KMnO₄ da marganesning oksidlanish darajasi?", ["+7", "+4", "+2", "+6"], "+1 + x + 4·(−2) = 0, x = +7.", "Oksidlanish darajasi", M),
 ("Sulfat kislotaning (H₂SO₄) molyar massasi?", ["98 g/mol", "96 g/mol", "49 g/mol", "100 g/mol"], "2·1 + 32 + 4·16 = 98.", "Mol va molyar massa", E),
 ("Natriy gidroksidning (NaOH) molyar massasi?", ["40 g/mol", "39 g/mol", "23 g/mol", "56 g/mol"], "23 + 16 + 1 = 40.", "Mol va molyar massa", E),
 ("36 g suv necha mol?", ["2 mol", "1 mol", "0,5 mol", "36 mol"], "n = m / M = 36 / 18 = 2 mol.", "Mol va molyar massa", E),
 ("Normal sharoitda 11,2 l gaz necha mol?", ["0,5 mol", "1 mol", "2 mol", "0,25 mol"], "n = V / 22,4 = 0,5 mol.", "Gazlar", E),
 ("Suvda vodorodning massa ulushi taxminan?", ["11,1 %", "5,6 %", "88,9 %", "33,3 %"], "2 / 18 ≈ 0,111.", "Mol va molyar massa", M),
 ("180 g suvda 20 g tuz eritildi. Eritmadagi tuzning massa ulushi?", ["10 %", "11,1 %", "20 %", "9 %"], "20 / (180 + 20) = 0,1.", "Eritmalar", M),
 ("Eng elektromanfiy element?", ["Ftor", "Kislorod", "Xlor", "Azot"], None, "Davriy jadval", E),
 ("Ishqoriy metallar davriy jadvalning qaysi guruhida joylashgan?", ["I A guruh", "II A guruh", "VII A guruh", "VIII A guruh"], None, "Davriy jadval", E),
 ("Galogenlar qaysi guruhda joylashgan?", ["VII A guruh", "VI A guruh", "I A guruh", "VIII A guruh"], None, "Davriy jadval", E),
 ("Xlorning tartib raqami?", ["17", "35", "18", "7"], None, "Davriy jadval", E),
 ("Bir elementning izotoplari nimasi bilan farq qiladi?", ["Neytronlar soni bilan", "Protonlar soni bilan", "Elektronlar soni bilan", "Tartib raqami bilan"], None, "Atom tuzilishi", M),
 ("Kislota va asosning o‘zaro ta’siri natijasida nima hosil bo‘ladi?", ["Tuz va suv", "Oksid va vodorod", "Faqat tuz", "Kislota va suv"], "Bu neytrallanish reaksiyasi.", "Kimyoviy reaksiyalar", E),
 ("Fenolftalein ishqoriy eritmada qanday rangga kiradi?", ["To‘q pushti (malina)", "Qizil", "Sariq", "Rangsiz qoladi"], None, "Indikatorlar", E),
 ("Lakmus kislotali muhitda qanday rangga kiradi?", ["Qizil", "Ko‘k", "Binafsha", "Yashil"], None, "Indikatorlar", E),
 ("Rux xlorid kislota bilan reaksiyaga kirishganda qanday gaz ajraladi?", ["Vodorod", "Kislorod", "Xlor", "Karbonat angidrid"], "Zn + 2HCl → ZnCl₂ + H₂↑.", "Kimyoviy reaksiyalar", E),
 ("Temir zanglaganda nimalar bilan reaksiyaga kirishadi?", ["Kislorod va suv (namlik) bilan", "Faqat azot bilan", "Faqat vodorod bilan", "Argon bilan"], None, "Metallar", M),
 ("Kalsiy karbonatning formulasi?", ["CaCO₃", "CaO", "Ca(OH)₂", "CaCl₂"], None, "Formulalar", E),
 ("Ozonning formulasi?", ["O₃", "O₂", "CO₂", "H₂O₂"], None, "Formulalar", E),
 ("Etil spirtining formulasi?", ["C₂H₅OH", "CH₃OH", "C₆H₁₂O₆", "CH₃COOH"], None, "Organik kimyo", E),
 ("Glyukozaning formulasi?", ["C₆H₁₂O₆", "C₁₂H₂₂O₁₁", "C₂H₅OH", "C₆H₆"], None, "Organik kimyo", E),
 ("Alkanlarning umumiy formulasi?", ["CₙH₂ₙ₊₂", "CₙH₂ₙ", "CₙH₂ₙ₋₂", "CₙH₂ₙ₋₆"], None, "Organik kimyo", M),
])

test("DTM mashq: Biologiya (2-to‘plam)", "biologiya", "dtm", None, None,
 "DTM formatidagi mashq savollari: botanika, zoologiya, odam va uning salomatligi, genetika, ekologiya.", [
 ("O‘simlikda suv va mineral moddalarni tuproqdan qaysi organ so‘radi?", ["Ildiz", "Barg", "Gul", "Meva"], None, "Botanika", E),
 ("O‘simliklarga yashil rang beradigan pigment?", ["Xlorofill", "Gemoglobin", "Melanin", "Karotin"], None, "Botanika", E),
 ("Fotosintez natijasida nimalar hosil bo‘ladi?", ["Glyukoza va kislorod", "Karbonat angidrid va suv", "Oqsil va azot", "Faqat suv"], None, "Botanika", E),
 ("Bargdagi ustitsalarning vazifasi?", ["Gaz almashinuvi va suv bug‘lanishi", "Urug‘ hosil qilish", "Changlanish", "Suvni tuproqdan so‘rish"], None, "Botanika", M),
 ("Meva gulning qaysi qismidan rivojlanadi?", ["Tuguncha", "Gultojibarg", "Changchi", "Kosacha"], None, "Botanika", M),
 ("Zamburug‘lar qaysi dunyoga kiradi?", ["Zamburug‘lar dunyosi", "O‘simliklar dunyosi", "Hayvonlar dunyosi", "Bakteriyalar dunyosi"], None, "Botanika", E),
 ("Qushlarning yuragi necha kamerali?", ["4", "3", "2", "5"], None, "Zoologiya", E),
 ("Qaysi hayvon suvda hamda quruqlikda yashovchilarga kiradi?", ["Baqa", "Timsoh", "Kaltakesak", "Ilon"], None, "Zoologiya", E),
 ("Baliqlar nima bilan nafas oladi?", ["Jabra bilan", "O‘pka bilan", "Teri bilan", "Traxeya bilan"], None, "Zoologiya", E),
 ("Ko‘rshapalak qaysi sinfga kiradi?", ["Sutemizuvchilar", "Qushlar", "Sudralib yuruvchilar", "Hasharotlar"], None, "Zoologiya", E),
 ("Odam skeletidagi eng uzun suyak?", ["Son suyagi", "Yelka suyagi", "Katta boldir suyagi", "Umurtqa"], None, "Odam anatomiyasi", E),
 ("Quyosh nuri ta’sirida terida qaysi vitamin hosil bo‘ladi?", ["D vitamini", "C vitamini", "A vitamini", "B₁₂ vitamini"], None, "Odam salomatligi", E),
 ("Singa (tsinga) kasalligi qaysi vitamin yetishmasligidan kelib chiqadi?", ["C vitamini", "D vitamini", "A vitamini", "K vitamini"], None, "Odam salomatligi", M),
 ("Qonni yurakdan a’zolarga olib boradigan tomirlar?", ["Arteriyalar", "Venalar", "Limfa tomirlari", "Nervlar"], None, "Odam anatomiyasi", E),
 ("Ovqat hazm qilish qayerdan boshlanadi?", ["Og‘iz bo‘shlig‘idan", "Oshqozondan", "Ingichka ichakdan", "Yo‘g‘on ichakdan"], None, "Odam anatomiyasi", E),
 ("O‘pkada gaz almashinuvi qayerda sodir bo‘ladi?", ["Alveolalarda", "Bronxlarda", "Traxeyada", "Hiqildoqda"], None, "Odam anatomiyasi", M),
 ("Nerv hujayrasi qanday nomlanadi?", ["Neyron", "Nefron", "Eritrotsit", "Miotsit"], None, "Odam anatomiyasi", E),
 ("DNKning qo‘sh spiral modelini kimlar taklif qilgan?", ["J. Uotson va F. Krik", "G. Mendel va T. Morgan", "Ch. Darvin va A. Uolles", "L. Paster va R. Kox"], None, "Molekulyar biologiya", M),
 ("Aa × aa chatishtirilganda avlodda genotiplar nisbati?", ["1 : 1", "3 : 1", "1 : 2 : 1", "Hammasi Aa"], "Avlodning yarmi Aa, yarmi aa.", "Genetika", H),
 ("To‘liq dominantlikda Aa × Aa chatishtirilganda fenotiplar nisbati?", ["3 : 1", "1 : 1", "1 : 2 : 1", "9 : 3 : 3 : 1"], None, "Genetika", H),
 ("Odamning jinsiy hujayralarida (gametalarida) nechta xromosoma bor?", ["23", "46", "44", "22"], None, "Genetika", M),
 ("Penitsillinni kim kashf etgan?", ["Aleksandr Fleming", "Lui Paster", "Robert Kox", "Edvard Jenner"], None, "Mikrobiologiya", M),
 ("Oziq zanjirida produtsentlar (hosil qiluvchilar) kimlar?", ["Yashil o‘simliklar", "Yirtqich hayvonlar", "Zamburug‘lar", "O‘txo‘r hayvonlar"], None, "Ekologiya", E),
 ("Qaysi gaz issiqxona effektining asosiy sabablaridan biri?", ["Karbonat angidrid", "Kislorod", "Azot", "Geliy"], None, "Ekologiya", M),
])

test("DTM mashq: Ingliz tili (2-to‘plam)", "ingliz", "dtm", None, None,
 "DTM formatidagi mashq savollari: zamonlar, shart gaplar, ko‘chirma gap, modal fe’llar, predloglar va so‘z boyligi.", [
 ("He ___ like coffee.", ["doesn't", "don't", "isn't", "not"], "He/she/it + does not.", "Present Simple", E),
 ("We ___ to London last year.", ["went", "go", "have gone", "goes"], "«Last year» → Past Simple.", "Past Simple", E),
 ("She has ___ finished her homework.", ["already", "yet", "ago", "last"], "«Already» goes with Present Perfect in positive sentences.", "Present Perfect", M),
 ("While I ___ dinner, the phone rang.", ["was cooking", "cooked", "am cooking", "have cooked"], "A longer action interrupted → Past Continuous.", "Past Continuous", M),
 ("By next year, they ___ the new bridge.", ["will have built", "will build", "built", "have built"], "«By + future time» → Future Perfect.", "Future Perfect", H),
 ("If I ___ rich, I would travel around the world.", ["were", "am", "will be", "had been"], "Second conditional: if + Past Simple (were), would + verb.", "Conditionals", M),
 ("He asked me where I ___.", ["lived", "live", "do live", "am living"], "Reported question: tenses move back, no inversion.", "Reported speech", H),
 ("You ___ smoke here. It's forbidden.", ["mustn't", "needn't", "don't have to", "can"], "Prohibition → mustn't.", "Modal verbs", M),
 ("The book ___ by millions of people every year.", ["is read", "reads", "is reading", "read"], "Present Simple Passive: is/are + V3.", "Passive voice", M),
 ("I'm interested ___ history.", ["in", "on", "at", "for"], None, "Prepositions", E),
 ("She is good ___ maths.", ["at", "in", "on", "with"], None, "Prepositions", E),
 ("How ___ money do you have?", ["much", "many", "few", "a lot"], "Money is uncountable → much.", "Quantifiers", E),
 ("I have ___ friends in this city.", ["a few", "a little", "much", "any"], "Countable plural → a few.", "Quantifiers", M),
 ("Choose the opposite of «cheap».", ["expensive", "poor", "easy", "short"], None, "Vocabulary", E),
 ("Choose the synonym of «begin».", ["start", "finish", "stop", "end"], None, "Vocabulary", E),
 ("Which word is a noun?", ["happiness", "happy", "happily", "unhappy"], None, "Word formation", M),
 ("Choose the plural of «mouse».", ["mice", "mouses", "mices", "mouse"], None, "Nouns", E),
 ("Choose the past form of «buy».", ["bought", "buyed", "brought", "buy"], None, "Irregular verbs", E),
 ("He said, «I am tired.» → He said that he ___ tired.", ["was", "is", "has been", "will be"], None, "Reported speech", M),
 ("She is a teacher, ___?", ["isn't she", "is she", "doesn't she", "wasn't she"], "Positive sentence → negative tag.", "Question tags", M),
 ("I ___ play football when I was a child, but now I don't.", ["used to", "use to", "am used to", "was used"], None, "Used to", M),
 ("I enjoy ___ books.", ["reading", "to read", "read", "reads"], "«Enjoy» is followed by -ing.", "Gerund", M),
 ("This test is ___ than the last one.", ["easier", "more easy", "easiest", "easyer"], None, "Adjectives", E),
 ("Neither Tom nor his friends ___ here now.", ["are", "is", "was", "be"], "The verb agrees with the nearer subject («friends»).", "Agreement", H),
])

test("DTM mashq: Ona tili va adabiyot (2-to‘plam)", "ona_tili", "dtm", None, None,
 "DTM formatidagi mashq savollari: kelishiklar, leksikologiya, yordamchi so‘zlar, gap bo‘laklari, o‘zbek adabiyoti.", [
 ("O‘zbek tilida nechta kelishik bor?", ["6 ta", "5 ta", "7 ta", "4 ta"], "Bosh, qaratqich, tushum, jo‘nalish, o‘rin-payt, chiqish.", "Kelishiklar", E),
 ("Tushum kelishigining qo‘shimchasi?", ["-ni", "-ning", "-ga", "-dan"], None, "Kelishiklar", E),
 ("Jo‘nalish kelishigining qo‘shimchasi?", ["-ga", "-da", "-ni", "-ning"], None, "Kelishiklar", E),
 ("Chiqish kelishigining qo‘shimchasi?", ["-dan", "-da", "-ga", "-ni"], None, "Kelishiklar", E),
 ("Ma’nosi qarama-qarshi bo‘lgan so‘zlar qanday ataladi?", ["Antonimlar", "Sinonimlar", "Omonimlar", "Paronimlar"], None, "Leksikologiya", E),
 ("Shakli bir xil, ma’nosi har xil so‘zlar qanday ataladi?", ["Omonimlar", "Sinonimlar", "Antonimlar", "Neologizmlar"], None, "Leksikologiya", E),
 ("Ma’nosi bir-biriga yaqin so‘zlar qanday ataladi?", ["Sinonimlar", "Antonimlar", "Omonimlar", "Arxaizmlar"], None, "Leksikologiya", E),
 ("«Faqat», «hatto», «-mi» qaysi so‘z turkumiga kiradi?", ["Yuklama", "Bog‘lovchi", "Ko‘makchi", "Undov"], None, "Yordamchi so‘zlar", M),
 ("«Va», «lekin», «ammo» qaysi so‘z turkumiga kiradi?", ["Bog‘lovchi", "Yuklama", "Ko‘makchi", "Modal so‘z"], None, "Yordamchi so‘zlar", E),
 ("«Uchun», «bilan», «kabi» qaysi so‘z turkumiga kiradi?", ["Ko‘makchi", "Bog‘lovchi", "Yuklama", "Ravish"], None, "Yordamchi so‘zlar", M),
 ("«Albatta», «ehtimol» so‘zlari qaysi turkumga kiradi?", ["Modal so‘z", "Ravish", "Undov", "Sifat"], None, "Yordamchi so‘zlar", M),
 ("To‘ldiruvchi qaysi so‘roqlarga javob beradi?", ["kimni? nimani? kimga? nimaga?", "qanday? qaysi?", "qayerda? qachon?", "kim? nima?"], None, "Sintaksis", M),
 ("Hol qaysi so‘roqlarga javob beradi?", ["qayerda? qachon? qanday?", "kimni? nimani?", "kimning? nimaning?", "kim? nima?"], None, "Sintaksis", M),
 ("Qo‘shma gapning turlari qaysi javobda to‘g‘ri berilgan?", ["Bog‘langan, ergashgan va bog‘lovchisiz qo‘shma gaplar", "Sodda va yoyiq gaplar", "Darak va so‘roq gaplar", "Undov va buyruq gaplar"], None, "Sintaksis", H),
 ("«Alpomish» qanday asar?", ["O‘zbek xalq dostoni", "Tarixiy roman", "G‘azal", "Masal"], None, "Xalq og‘zaki ijodi", E),
 ("«Sarob» romanining muallifi?", ["Abdulla Qahhor", "Abdulla Qodiriy", "Oybek", "Said Ahmad"], None, "Adabiyot", M),
 ("«Shum bola» qissasining muallifi?", ["G‘afur G‘ulom", "Abdulla Qahhor", "Hamid Olimjon", "Erkin Vohidov"], None, "Adabiyot", E),
 ("«Navoiy» romanining muallifi?", ["Oybek", "Abdulla Qodiriy", "Cho‘lpon", "Pirimqul Qodirov"], None, "Adabiyot", E),
 ("«Mehrobdan chayon» romanining muallifi?", ["Abdulla Qodiriy", "Cho‘lpon", "Oybek", "Abdulla Qahhor"], None, "Adabiyot", E),
 ("«Dunyoning ishlari» asarining muallifi?", ["O‘tkir Hoshimov", "Said Ahmad", "Xudoyberdi To‘xtaboyev", "Tog‘ay Murod"], None, "Adabiyot", M),
 ("«Sariq devni minib» asarining muallifi?", ["Xudoyberdi To‘xtaboyev", "O‘tkir Hoshimov", "G‘afur G‘ulom", "Anvar Obidjon"], None, "Adabiyot", E),
 ("Pirimqul Qodirovning «Yulduzli tunlar» romani qaysi tarixiy shaxs haqida?", ["Zahiriddin Muhammad Bobur", "Amir Temur", "Mirzo Ulug‘bek", "Alisher Navoiy"], None, "Adabiyot", M),
 ("«Devonu lug‘otit turk» asarining muallifi?", ["Mahmud Koshg‘ariy", "Yusuf Xos Hojib", "Ahmad Yugnakiy", "Alisher Navoiy"], None, "Mumtoz adabiyot", M),
 ("«Qutadg‘u bilig» dostonining muallifi?", ["Yusuf Xos Hojib", "Mahmud Koshg‘ariy", "Ahmad Yassaviy", "Lutfiy"], None, "Mumtoz adabiyot", M),
 ("Alisher Navoiy «Xamsa»sining birinchi dostoni?", ["«Hayrat ul-abror»", "«Farhod va Shirin»", "«Layli va Majnun»", "«Saddi Iskandariy»"], None, "Mumtoz adabiyot", H),
 ("«O‘tkan kunlar» romanining bosh qahramoni?", ["Otabek", "Anvar", "Said", "Mirzakarim"], None, "Adabiyot", E),
 ("Said Ahmadning «Ufq» asari qanday janrda?", ["Trilogiya (roman)", "Doston", "G‘azal", "Masal"], None, "Adabiyot", H),
])

test("DTM mashq: O‘zbekiston tarixi (2-to‘plam)", "tarix", "dtm", None, None,
 "DTM formatidagi mashq savollari: qadimgi davr, o‘rta asrlar allomalari, Temuriylar, xonliklar, XX asr va mustaqillik.", [
 ("Zardushtiylikning muqaddas kitobi?", ["«Avesto»", "«Qutadg‘u bilig»", "«Boburnoma»", "«Temur tuzuklari»"], None, "Qadimgi davr", E),
 ("Afrosiyob qaysi shaharning qadimiy qismi?", ["Samarqand", "Buxoro", "Xiva", "Termiz"], None, "Qadimgi davr", E),
 ("Kushon podsholigining eng mashhur hukmdori?", ["Kanishka", "Spitamen", "Muqanna", "Qutayba"], None, "Qadimgi davr", M),
 ("Varaxsha saroyi xarobalari qaysi viloyatda joylashgan?", ["Buxoro", "Xorazm", "Surxondaryo", "Farg‘ona"], None, "Qadimgi davr", M),
 ("«Movarounnahr» so‘zining ma’nosi?", ["Daryoning narigi tomoni", "Tog‘lar o‘lkasi", "Ikki dengiz oralig‘i", "Cho‘l va vohalar"], None, "O‘rta asrlar", M),
 ("Somoniylar davlatining poytaxti?", ["Buxoro", "Samarqand", "Marv", "Urganch"], None, "O‘rta asrlar", M),
 ("Xorazmshohlar davlatining poytaxti?", ["Urganch (Gurganj)", "Buxoro", "Samarqand", "Xiva"], None, "O‘rta asrlar", M),
 ("Mo‘g‘ullar O‘tror shahrini qaysi yili qamal qila boshlagan?", ["1219-yil", "1370-yil", "1220-yil", "1405-yil"], None, "Mo‘g‘ullar istilosi", H),
 ("«Al-Jome’ as-sahih» asarining muallifi?", ["Imom al-Buxoriy", "Imom at-Termiziy", "Abu Mansur al-Moturidiy", "Burhoniddin al-Marg‘inoniy"], None, "Allomalar", M),
 ("«Hindiston» asarining muallifi?", ["Abu Rayhon Beruniy", "Abu Ali ibn Sino", "Muhammad al-Xorazmiy", "Mahmud Koshg‘ariy"], None, "Allomalar", M),
 ("Amir Temur qaysi yili vafot etgan?", ["1405-yil", "1370-yil", "1336-yil", "1449-yil"], None, "Temuriylar davri", M),
 ("«Temur tuzuklari» kimning nomi bilan bog‘liq?", ["Amir Temur", "Mirzo Ulug‘bek", "Zahiriddin Muhammad Bobur", "Husayn Boyqaro"], None, "Temuriylar davri", E),
 ("Registon maydonidagi uchta madrasadan eng qadimgisi?", ["Ulug‘bek madrasasi", "Sherdor madrasasi", "Tillakori madrasasi", "Ko‘kaldosh madrasasi"], None, "Temuriylar davri", H),
 ("Alisher Navoiy yashagan yillar?", ["1441–1501", "1336–1405", "1483–1530", "1394–1449"], None, "Temuriylar davri", M),
 ("Zahiriddin Muhammad Bobur yashagan yillar?", ["1483–1530", "1441–1501", "1336–1405", "1500–1550"], None, "Temuriylar davri", M),
 ("Temuriylar davrida Hirotda ijod qilgan buyuk miniatyurachi rassom?", ["Kamoliddin Behzod", "Mirak Naqqosh", "Chingiz Ahmarov", "Ural Tansiqboyev"], None, "Temuriylar davri", M),
 ("XVIII–XIX asrlarda hozirgi O‘zbekiston hududidagi uchta davlat?", ["Buxoro amirligi, Xiva xonligi, Qo‘qon xonligi", "Somoniylar, Qoraxoniylar, G‘aznaviylar", "Kushon, Qang‘, Davan", "Oltin O‘rda, Chig‘atoy ulusi, Elxoniylar"], None, "Xonliklar davri", E),
 ("Toshkent Rossiya imperiyasi qo‘shinlari tomonidan qaysi yili bosib olingan?", ["1865-yil", "1868-yil", "1873-yil", "1876-yil"], None, "Mustamlaka davri", H),
 ("Turkiston general-gubernatorligi qaysi yili tuzilgan?", ["1867-yil", "1865-yil", "1917-yil", "1924-yil"], None, "Mustamlaka davri", H),
 ("«Padarkush» dramasining muallifi?", ["Mahmudxo‘ja Behbudiy", "Abdulla Avloniy", "Munavvar qori", "Hamza Hakimzoda Niyoziy"], None, "Jadidchilik", M),
 ("O‘zbekiston SSR qaysi yili tuzilgan?", ["1924-yil", "1917-yil", "1930-yil", "1936-yil"], None, "Sovet davri", M),
 ("1930-yilgacha O‘zbekiston SSRning poytaxti qaysi shahar edi?", ["Samarqand", "Toshkent", "Buxoro", "Qo‘qon"], None, "Sovet davri", H),
 ("Toshkent zilzilasi qachon sodir bo‘lgan?", ["1966-yil 26-aprel", "1941-yil 22-iyun", "1976-yil 1-sentabr", "1991-yil 31-avgust"], None, "Sovet davri", M),
 ("Ikkinchi jahon urushi qaysi yillarda bo‘lgan?", ["1939–1945", "1914–1918", "1941–1943", "1945–1950"], None, "Sovet davri", E),
 ("O‘zbekiston Respublikasining birinchi Prezidenti?", ["Islom Karimov", "Shavkat Mirziyoyev", "Sharof Rashidov", "Usmon Yusupov"], None, "Mustaqillik davri", E),
 ("O‘zbekiston Respublikasi Davlat bayrog‘i qachon qabul qilingan?", ["1991-yil 18-noyabr", "1992-yil 2-iyul", "1992-yil 10-dekabr", "1991-yil 31-avgust"], None, "Davlat ramzlari", H),
 ("O‘zbekiston Respublikasi Davlat gerbi qachon qabul qilingan?", ["1992-yil 2-iyul", "1991-yil 18-noyabr", "1992-yil 8-dekabr", "1993-yil 1-sentabr"], None, "Davlat ramzlari", H),
 ("O‘zbekiston Respublikasi Davlat madhiyasi qachon qabul qilingan?", ["1992-yil 10-dekabr", "1992-yil 2-iyul", "1991-yil 18-noyabr", "1994-yil 1-iyul"], None, "Davlat ramzlari", H),
])

test("DTM mashq: Geografiya (2-to‘plam)", "geografiya", "dtm", None, None,
 "DTM formatidagi mashq savollari: O‘zbekiston viloyatlari, chegaralari va suvlari, dunyo geografiyasi, xarita.", [
 ("Qashqadaryo viloyatining markazi?", ["Qarshi", "Shahrisabz", "Termiz", "Navoiy"], None, "O‘zbekiston ma’muriy tuzilishi", E),
 ("Sirdaryo viloyatining markazi?", ["Guliston", "Jizzax", "Yangiyer", "Sirdaryo"], None, "O‘zbekiston ma’muriy tuzilishi", M),
 ("Xorazm viloyatining markazi?", ["Urganch", "Xiva", "Nukus", "Xonqa"], None, "O‘zbekiston ma’muriy tuzilishi", E),
 ("Toshkent viloyatining markazi?", ["Nurafshon", "Toshkent", "Chirchiq", "Angren"], None, "O‘zbekiston ma’muriy tuzilishi", H),
 ("Qoraqalpog‘iston Respublikasining poytaxti?", ["Nukus", "Mo‘ynoq", "Urganch", "To‘rtko‘l"], None, "O‘zbekiston ma’muriy tuzilishi", E),
 ("O‘zbekistonning eng janubiy viloyati?", ["Surxondaryo", "Qashqadaryo", "Buxoro", "Samarqand"], None, "O‘zbekiston ma’muriy tuzilishi", E),
 ("Farg‘ona vodiysida joylashgan viloyatlar?", ["Andijon, Namangan, Farg‘ona", "Samarqand, Jizzax, Sirdaryo", "Buxoro, Navoiy, Xorazm", "Qashqadaryo, Surxondaryo, Buxoro"], None, "O‘zbekiston ma’muriy tuzilishi", E),
 ("O‘zbekistonning maydoni taxminan qancha?", ["448,9 ming km²", "1 mln km²", "200 ming km²", "2,7 mln km²"], None, "O‘zbekiston hududi", M),
 ("O‘zbekiston va Lixtenshteynning umumiy geografik xususiyati?", ["Ikkalasi ham dengizga chiqishi yo‘q davlatlar bilan o‘ralgan", "Ikkalasi ham orol davlat", "Ikkalasi ham Yevropada", "Ikkalasi ham okean bo‘yida"], None, "O‘zbekiston hududi", H),
 ("O‘zbekistonning eng uzun davlat chegarasi qaysi davlat bilan?", ["Qozog‘iston", "Turkmaniston", "Tojikiston", "Afg‘oniston"], None, "O‘zbekiston chegaralari", M),
 ("O‘zbekistonning eng qisqa davlat chegarasi qaysi davlat bilan?", ["Afg‘oniston", "Qirg‘iziston", "Tojikiston", "Turkmaniston"], None, "O‘zbekiston chegaralari", M),
 ("Chorvoq suv ombori qaysi daryoda qurilgan?", ["Chirchiq", "Zarafshon", "Amudaryo", "Qashqadaryo"], None, "O‘zbekiston suvlari", M),
 ("Tuyamo‘yin suv ombori qaysi daryoda?", ["Amudaryo", "Sirdaryo", "Zarafshon", "Chirchiq"], None, "O‘zbekiston suvlari", M),
 ("Aydar–Arnasoy ko‘llar tizimi qaysi viloyatlar hududida?", ["Jizzax va Navoiy", "Xorazm va Buxoro", "Farg‘ona va Namangan", "Surxondaryo va Qashqadaryo"], None, "O‘zbekiston suvlari", H),
 ("Amudaryo qaysi daryolarning qo‘shilishidan hosil bo‘ladi?", ["Panj va Vaxsh", "Norin va Qoradaryo", "Chirchiq va Ohangaron", "Zarafshon va Surxondaryo"], None, "O‘zbekiston suvlari", M),
 ("Sirdaryo qaysi daryolarning qo‘shilishidan hosil bo‘ladi?", ["Norin va Qoradaryo", "Panj va Vaxsh", "Chirchiq va Ohangaron", "Sherobod va Surxondaryo"], None, "O‘zbekiston suvlari", M),
 ("O‘zbekiston qaysi vaqt mintaqasida joylashgan?", ["UTC+5", "UTC+3", "UTC+6", "UTC+4"], None, "Yer shari", M),
 ("Everest (Jomolungma) cho‘qqisining balandligi taxminan?", ["8849 m", "7495 m", "6962 m", "5642 m"], None, "Dunyo relyefi", E),
 ("Dunyo okeanidagi eng chuqur botiq?", ["Mariana botig‘i", "Puerto-Riko botig‘i", "Yava botig‘i", "Tonga botig‘i"], None, "Dunyo okeani", E),
 ("Dunyodagi eng katta issiq cho‘l?", ["Sahroi Kabir", "Gobi", "Qizilqum", "Kalaxari"], None, "Materiklar", E),
 ("Maydoni eng katta davlat?", ["Rossiya", "Kanada", "Xitoy", "AQSh"], None, "Dunyo davlatlari", E),
 ("Eng kichik materik?", ["Avstraliya", "Antarktida", "Yevropa", "Janubiy Amerika"], None, "Materiklar", E),
 ("Dunyodagi eng chuqur ko‘l?", ["Baykal", "Kaspiy", "Viktoriya", "Issiqko‘l"], None, "Ko‘llar", M),
 ("Dunyodagi maydoni eng katta ko‘l?", ["Kaspiy dengizi", "Baykal", "Viktoriya", "Yuqori ko‘l"], None, "Ko‘llar", M),
 ("Ekvator Yer sharini qanday yarimsharlarga ajratadi?", ["Shimoliy va Janubiy", "Sharqiy va G‘arbiy", "Kunduzgi va tungi", "Quruqlik va suv"], None, "Yer shari", E),
 ("Bosh (Grinvich) meridiani Yer sharini qanday yarimsharlarga ajratadi?", ["Sharqiy va G‘arbiy", "Shimoliy va Janubiy", "Issiq va sovuq", "Materik va okean"], None, "Yer shari", E),
 ("Geografik kenglik qanday qiymatlarda o‘lchanadi?", ["0° dan 90° gacha", "0° dan 180° gacha", "0° dan 360° gacha", "−180° dan 180° gacha"], None, "Xarita", M),
 ("Masshtab 1 : 100 000 bo‘lsa, xaritadagi 1 sm joydagi necha km ga teng?", ["1 km", "10 km", "100 km", "0,1 km"], "100 000 sm = 1000 m = 1 km.", "Xarita", M),
])

test("DTM mashq: Rus tili (1-to‘plam)", "rus", "dtm", None, None,
 "Mashq savollari DTM formatida: padejlar, so‘z turkumlari, so‘z tarkibi, imlo, gap bo‘laklari va rus adabiyoti.", [
 ("Сколько падежей в русском языке?", ["6", "5", "7", "4"], "Именительный, родительный, дательный, винительный, творительный, предложный.", "Падежи", E),
 ("Какой падеж отвечает на вопросы «кого? чего?»", ["Родительный", "Дательный", "Винительный", "Предложный"], None, "Падежи", E),
 ("Какой падеж отвечает на вопросы «кому? чему?»", ["Дательный", "Родительный", "Творительный", "Именительный"], None, "Падежи", E),
 ("Какой падеж отвечает на вопросы «кем? чем?»", ["Творительный", "Дательный", "Предложный", "Винительный"], None, "Падежи", E),
 ("Какой падеж отвечает на вопросы «о ком? о чём?»", ["Предложный", "Родительный", "Творительный", "Дательный"], None, "Падежи", E),
 ("Какого рода существительное «окно»?", ["Среднего", "Мужского", "Женского", "Общего"], None, "Существительное", E),
 ("Какого рода существительное «кофе»?", ["Мужского", "Среднего", "Женского", "Не имеет рода"], None, "Существительное", H),
 ("Множественное число слова «человек»:", ["люди", "человеки", "человека", "людей"], None, "Существительное", E),
 ("Множественное число слова «ребёнок»:", ["дети", "ребёнки", "ребята", "детей"], None, "Существительное", E),
 ("Антоним к слову «горячий»:", ["холодный", "тёплый", "жаркий", "огненный"], None, "Лексика", E),
 ("Синоним к слову «смелый»:", ["храбрый", "трусливый", "робкий", "слабый"], None, "Лексика", E),
 ("Какой частью речи является слово «быстро»?", ["Наречие", "Прилагательное", "Глагол", "Существительное"], None, "Части речи", E),
 ("Какой частью речи является слово «красивый»?", ["Прилагательное", "Наречие", "Существительное", "Причастие"], None, "Части речи", E),
 ("Какой частью речи является слово «читать»?", ["Глагол", "Существительное", "Наречие", "Прилагательное"], None, "Части речи", E),
 ("Слова «я, ты, он» — это …", ["местоимения", "существительные", "числительные", "союзы"], None, "Части речи", E),
 ("Выберите слово, написанное правильно.", ["жираф", "жыраф", "шышка", "жызнь"], "«Жи», «ши» пишутся с буквой «и».", "Орфография", E),
 ("В каком слове мягкий знак написан правильно?", ["ночь", "ключь", "врачь", "мячь"], "Мягкий знак после шипящих пишется у существительных женского рода.", "Орфография", M),
 ("Какой глагол совершенного вида?", ["написать", "писать", "читать", "говорить"], "Совершенный вид отвечает на вопрос «что сделать?».", "Глагол", M),
 ("Прошедшее время глагола «идти» (он):", ["шёл", "идил", "идёт", "шла"], None, "Глагол", M),
 ("Сравнительная степень прилагательного «хороший»:", ["лучше", "хорошее", "хорошо", "самый хороший"], None, "Прилагательное", M),
 ("Превосходная степень прилагательного «большой»:", ["самый большой", "больше", "большее", "большой-большой"], None, "Прилагательное", E),
 ("Я живу ___ Ташкенте.", ["в", "на", "к", "из"], None, "Предлоги", E),
 ("Мы поехали ___ бабушке.", ["к", "в", "на", "у"], None, "Предлоги", E),
 ("Выделите приставку в слове «переход».", ["пере-", "пе-", "переход", "-ход"], None, "Состав слова", M),
 ("Выделите корень в слове «лесной».", ["лес", "лесн", "ной", "лесной"], None, "Состав слова", M),
 ("Какой суффикс в слове «домик»?", ["-ик", "-ок", "-мик", "-к"], None, "Состав слова", M),
 ("Главные члены предложения:", ["подлежащее и сказуемое", "дополнение и определение", "обстоятельство и сказуемое", "подлежащее и дополнение"], None, "Синтаксис", E),
 ("Кто написал роман в стихах «Евгений Онегин»?", ["А. С. Пушкин", "М. Ю. Лермонтов", "Н. В. Гоголь", "И. А. Крылов"], None, "Литература", E),
 ("Кто автор романа «Война и мир»?", ["Л. Н. Толстой", "Ф. М. Достоевский", "И. С. Тургенев", "А. П. Чехов"], None, "Литература", E),
 ("Кто автор романа «Преступление и наказание»?", ["Ф. М. Достоевский", "Л. Н. Толстой", "А. С. Пушкин", "М. А. Булгаков"], None, "Литература", M),
 ("Кто написал рассказ «Муму»?", ["И. С. Тургенев", "А. П. Чехов", "Н. В. Гоголь", "Л. Н. Толстой"], None, "Литература", M),
])

test("DTM mashq: Informatika (1-to‘plam)", "informatika", "dtm", None, None,
 "Mashq savollari DTM formatida: axborot birliklari, sanoq sistemalari, mantiq, kompyuter qurilmalari, internet, Excel, Python asoslari.", [
 ("1 bayt necha bitga teng?", ["8", "10", "16", "1024"], None, "Axborot birliklari", E),
 ("1 Kbayt necha baytga teng?", ["1024", "1000", "8", "512"], None, "Axborot birliklari", E),
 ("1 Mbayt necha Kbaytga teng?", ["1024", "1000", "100", "8"], None, "Axborot birliklari", E),
 ("Ikkilik sanoq sistemasidagi 1010₂ soni o‘nlikda nechaga teng?", ["10", "12", "5", "1010"], "8 + 0 + 2 + 0 = 10.", "Sanoq sistemalari", M),
 ("13 sonini ikkilik sanoq sistemasida yozing.", ["1101", "1011", "1110", "1001"], "13 = 8 + 4 + 1.", "Sanoq sistemalari", M),
 ("111₂ + 1₂ = ?", ["1000₂", "112₂", "1110₂", "1001₂"], "7 + 1 = 8 = 1000₂.", "Sanoq sistemalari", M),
 ("O‘n oltilik sanoq sistemasidagi F raqami o‘nlikda nechaga teng?", ["15", "16", "14", "6"], None, "Sanoq sistemalari", E),
 ("Sakkizlik sanoq sistemasidagi 17₈ o‘nlikda nechaga teng?", ["15", "17", "8", "71"], "1·8 + 7 = 15.", "Sanoq sistemalari", M),
 ("Mantiqiy «VA» (AND) amali: 1 VA 0 = ?", ["0", "1", "10", "2"], "VA faqat ikkalasi ham 1 bo‘lsa 1 beradi.", "Mantiq", E),
 ("Mantiqiy «YOKI» (OR) amali: 1 YOKI 0 = ?", ["1", "0", "10", "2"], None, "Mantiq", E),
 ("Mantiqiy «EMAS» (NOT) amali: EMAS 1 = ?", ["0", "1", "−1", "2"], None, "Mantiq", E),
 ("Kompyuterning ma’lumotlarni qayta ishlovchi asosiy qurilmasi?", ["Markaziy protsessor", "Monitor", "Klaviatura", "Printer"], None, "Kompyuter qurilmalari", E),
 ("Elektr toki o‘chganda ma’lumotlari o‘chib ketadigan xotira?", ["Operativ xotira (RAM)", "Qattiq disk", "Fleshka", "Optik disk"], None, "Kompyuter qurilmalari", E),
 ("Qaysi biri kiritish qurilmasi?", ["Klaviatura", "Monitor", "Printer", "Karnay"], None, "Kompyuter qurilmalari", E),
 ("Qaysi biri chiqarish qurilmasi?", ["Printer", "Sichqoncha", "Skaner", "Mikrofon"], None, "Kompyuter qurilmalari", E),
 ("Qaysi biri operatsion tizim?", ["Windows", "Microsoft Word", "Google Chrome", "Excel"], None, "Dasturiy ta’minot", E),
 ("Qaysi biri brauzer?", ["Google Chrome", "Windows", "Paint", "Telegram Desktop"], None, "Internet", E),
 ("Veb-sahifalar qaysi til yordamida yaratiladi?", ["HTML", "SQL", "Excel", "Paint"], None, "Internet", E),
 ("«https» manzilidagi «s» harfi nimani bildiradi?", ["Xavfsiz (shifrlangan) ulanishni", "Saytning sekinligini", "Server nomini", "Sahifa sonini"], None, "Internet", M),
 ("IP-manzil nima?", ["Tarmoqdagi qurilmaning raqamli manzili", "Elektron pochta paroli", "Fayl nomi", "Dastur nomi"], None, "Internet", M),
 ("Excel’da formula qaysi belgi bilan boshlanadi?", ["=", "+", "#", "@"], None, "Elektron jadvallar", E),
 ("Excel’da A1 = 2, A2 = 3, A3 = 5 bo‘lsa, =SUM(A1:A3) natijasi?", ["10", "5", "30", "3"], "2 + 3 + 5 = 10.", "Elektron jadvallar", E),
 ("Excel’da B ustun va 4-qator kesishgan katak manzili?", ["B4", "4B", "B:4", "D2"], None, "Elektron jadvallar", E),
 ("Python: print(2 ** 3) natijasi?", ["8", "6", "5", "23"], "** — darajaga ko‘tarish.", "Python", E),
 ("Python: print(7 // 2) natijasi?", ["3", "3.5", "4", "1"], "// — butun bo‘lish.", "Python", M),
 ("Python: print(7 % 3) natijasi?", ["1", "2", "0", "2.33"], "% — bo‘lishdan qoldiq.", "Python", M),
 ("Python: len(\"maktab\") natijasi?", ["6", "5", "7", "1"], None, "Python", E),
 ("Algoritm nima?", ["Masalani yechish uchun aniq ko‘rsatmalar ketma-ketligi", "Kompyuterning qismi", "Dasturlash tili", "Faylning nomi"], None, "Algoritmlar", E),
 ("Blok-sxemada romb shakli nimani bildiradi?", ["Shart (tarmoqlanish)", "Boshlanish va tugash", "Hisoblash amali", "Ma’lumot kiritish"], None, "Algoritmlar", M),
 ("«.docx» kengaytmali fayl qaysi dasturga tegishli?", ["Microsoft Word", "Microsoft Excel", "Paint", "PowerPoint"], None, "Dasturiy ta’minot", E),
 ("Ctrl + C tugmalari nima qiladi?", ["Nusxa oladi", "Joylashtiradi", "Kesib oladi", "Saqlaydi"], None, "Dasturiy ta’minot", E),
 ("Ctrl + V tugmalari nima qiladi?", ["Joylashtiradi", "Nusxa oladi", "O‘chiradi", "Chop etadi"], None, "Dasturiy ta’minot", E),
])

test("DTM mashq: Huquq asoslari (1-to‘plam)", "huquq", "dtm", None, None,
 "Mashq savollari: O‘zbekiston Respublikasi Konstitutsiyasi, davlat hokimiyati, davlat ramzlari, inson huquqlari va huquq asoslari.", [
 ("O‘zbekistonda Konstitutsiya kuni qachon nishonlanadi?", ["8-dekabr", "1-sentabr", "30-aprel", "10-dekabr"], None, "Konstitutsiya", E),
 ("O‘zbekiston Respublikasining amaldagi Konstitutsiyasi (yangi tahriri) qanday qabul qilingan?", ["2023-yil 30-aprelda referendumda", "1992-yil 8-dekabrda Oliy Kengash sessiyasida", "2016-yil 4-dekabrda saylovda", "2017-yil 1-yanvarda farmon bilan"], None, "Konstitutsiya", M),
 ("Oliy yuridik kuchga ega bo‘lgan hujjat?", ["Konstitutsiya", "Prezident farmoni", "Hukumat qarori", "Mahalliy hokim qarori"], None, "Konstitutsiya", E),
 ("Oliy Majlis qanday palatalardan iborat?", ["Qonunchilik palatasi va Senat", "Senat va Vazirlar Mahkamasi", "Oliy sud va Konstitutsiyaviy sud", "Faqat Qonunchilik palatasi"], None, "Davlat hokimiyati", E),
 ("Oliy Majlis Qonunchilik palatasi nechta deputatdan iborat?", ["150", "100", "120", "65"], None, "Davlat hokimiyati", M),
 ("Amaldagi Konstitutsiyaga ko‘ra Prezident necha yil muddatga saylanadi?", ["7 yil", "5 yil", "4 yil", "6 yil"], None, "Davlat hokimiyati", M),
 ("Prezidentlikka nomzod kamida necha yoshda bo‘lishi kerak?", ["35", "30", "40", "25"], None, "Davlat hokimiyati", M),
 ("Fuqarolar necha yoshdan saylashda ishtirok etish huquqiga ega?", ["18", "16", "21", "25"], None, "Saylov huquqi", E),
 ("O‘zbekiston Respublikasining davlat tili?", ["O‘zbek tili", "Rus tili", "Ingliz tili", "Qoraqalpoq tili"], None, "Konstitutsiya", E),
 ("O‘zbekiston Respublikasining poytaxti?", ["Toshkent", "Samarqand", "Buxoro", "Nukus"], None, "Konstitutsiya", E),
 ("Qoraqalpog‘iston Respublikasining poytaxti?", ["Nukus", "Urganch", "Beruniy", "Mo‘ynoq"], None, "Konstitutsiya", E),
 ("Davlat hokimiyati qaysi tarmoqlarga bo‘linadi?", ["Qonun chiqaruvchi, ijro etuvchi va sud", "Markaziy va mahalliy", "Harbiy va fuqarolik", "Iqtisodiy va siyosiy"], None, "Davlat hokimiyati", E),
 ("Ijro etuvchi hokimiyatni amalga oshiruvchi hukumat?", ["Vazirlar Mahkamasi", "Senat", "Oliy sud", "Qonunchilik palatasi"], None, "Davlat hokimiyati", M),
 ("O‘zbekiston Respublikasida davlat boshlig‘i kim?", ["Prezident", "Bosh vazir", "Senat raisi", "Oliy sud raisi"], None, "Davlat hokimiyati", E),
 ("Qonunlarning Konstitutsiyaga muvofiqligini qaysi organ tekshiradi?", ["Konstitutsiyaviy sud", "Oliy sud", "Bosh prokuratura", "Vazirlar Mahkamasi"], None, "Sud hokimiyati", M),
 ("O‘zbekiston Respublikasining davlat ramzlari?", ["Bayroq, gerb va madhiya", "Bayroq va pasport", "Gerb va Konstitutsiya", "Madhiya va so‘m"], None, "Davlat ramzlari", E),
 ("O‘zbekiston Davlat bayrog‘ida nechta yulduz bor?", ["12", "10", "7", "14"], None, "Davlat ramzlari", E),
 ("O‘zbekiston Davlat gerbidagi afsonaviy qush?", ["Humo", "Burgut", "Laylak", "Qaldirg‘och"], None, "Davlat ramzlari", E),
 ("O‘zbekistonda Mustaqillik kuni qachon nishonlanadi?", ["1-sentabr", "8-dekabr", "21-mart", "9-may"], None, "Davlat bayramlari", E),
 ("O‘zbekiston Respublikasi davlat boshqaruvi shakliga ko‘ra qanday davlat?", ["Respublika", "Monarxiya", "Federatsiya", "Konfederatsiya"], None, "Davlat asoslari", M),
 ("Inson huquqlari umumjahon deklaratsiyasi qachon qabul qilingan?", ["1948-yil 10-dekabr", "1945-yil 24-oktabr", "1989-yil 20-noyabr", "1992-yil 8-dekabr"], None, "Inson huquqlari", M),
 ("Birlashgan Millatlar Tashkiloti qaysi yili tashkil topgan?", ["1945-yil", "1948-yil", "1918-yil", "1991-yil"], None, "Xalqaro huquq", E),
 ("Bola huquqlari to‘g‘risidagi konvensiya qaysi yili qabul qilingan?", ["1989-yil", "1948-yil", "1995-yil", "2001-yil"], None, "Inson huquqlari", M),
 ("O‘zbekistonda nikoh yoshi (erkak va ayol uchun) necha yosh?", ["18", "16", "17", "20"], None, "Oila huquqi", M),
 ("Fuqaro to‘liq muomala layoqatiga (voyaga yetgach) necha yoshdan ega bo‘ladi?", ["18", "16", "14", "21"], None, "Fuqarolik huquqi", M),
 ("Oliy Majlisning Inson huquqlari bo‘yicha vakili qanday nomlanadi?", ["Ombudsman", "Prokuror", "Advokat", "Notarius"], None, "Inson huquqlari", M),
 ("Huquq normasi nima?", ["Davlat tomonidan o‘rnatiladigan va ta’minlanadigan umummajburiy xulq-atvor qoidasi", "Jamiyatda shakllangan, bajarilishi ixtiyoriy bo‘lgan axloqiy tavsiya", "Oilada avloddan avlodga o‘tib keladigan an’ana va urf-odat", "Faqat tashkilot ichida amal qiladigan ichki tartib qoidasi"], None, "Huquq nazariyasi", M),
 ("Jinoyat nima?", ["Jinoyat kodeksida taqiqlangan, jazo qo‘llash tahdidi bilan man etilgan aybli ijtimoiy xavfli qilmish", "Mehnat intizomini buzish, uning uchun faqat hayfsan beriladi", "Jamoat joyida odob-axloq qoidalariga rioya qilmaslik", "Shartnoma majburiyatini o‘z vaqtida bajarmaslik"], None, "Jinoyat huquqi", H),
 ("Referendum nima?", ["Muhim masalalar bo‘yicha umumxalq ovoz berishi", "Parlament majlisi", "Sud jarayoni", "Hukumat qarori"], None, "Davlat asoslari", E),
 ("Mahalla qanday organ?", ["Fuqarolarning o‘zini o‘zi boshqarish organi", "Sud organi", "Harbiy qism", "Vazirlik"], None, "Davlat asoslari", E),
 ("Konstitutsiyaga ko‘ra umumiy o‘rta ta’lim qanday?", ["Majburiy; davlat ta’lim muassasalarida bepul", "Ixtiyoriy va pullik", "Faqat shaharlarda", "Faqat 18 yoshdan keyin"], None, "Inson huquqlari", M),
])

test("Matematika | 5-sinf: natural sonlar va kasrlar", "matematika", "mavzu", 5, 20,
 "5-sinf matematika mavzulari: natural sonlar ustida amallar, bo‘linish belgilari, oddiy va o‘nli kasrlar, perimetr va yuza, o‘lchov birliklari.", [
 ("1256 + 744 = ?", ["2000", "1990", "1900", "2100"], None, "Natural sonlar", E),
 ("1000 − 387 = ?", ["613", "623", "713", "687"], None, "Natural sonlar", E),
 ("125 · 8 = ?", ["1000", "1250", "800", "1025"], None, "Natural sonlar", E),
 ("144 : 12 = ?", ["12", "14", "11", "13"], None, "Natural sonlar", E),
 ("9² = ?", ["81", "18", "99", "72"], "9 · 9 = 81.", "Natural sonlar", E),
 ("x + 35 = 80 tenglamani yeching.", ["45", "115", "55", "35"], "x = 80 − 35 = 45.", "Tenglamalar", E),
 ("3687 sonini yuzlargacha yaxlitlang.", ["3700", "3600", "3690", "4000"], None, "Natural sonlar", M),
 ("Qaysi son 3 ga qoldiqsiz bo‘linadi?", ["123", "124", "125", "127"], "Raqamlar yig‘indisi 1 + 2 + 3 = 6 — 3 ga bo‘linadi.", "Bo‘linish belgilari", M),
 ("Qaysi son 5 ga qoldiqsiz bo‘linadi?", ["245", "243", "251", "529"], "0 yoki 5 bilan tugagan sonlar 5 ga bo‘linadi.", "Bo‘linish belgilari", E),
 ("3/5 + 1/5 = ?", ["4/5", "4/10", "3/25", "2/5"], None, "Oddiy kasrlar", E),
 ("7/8 − 3/8 = ?", ["1/2", "4/16", "10/8", "1/4"], "4/8 = 1/2.", "Oddiy kasrlar", M),
 ("2 1/3 aralash sonni noto‘g‘ri kasr shaklida yozing.", ["7/3", "5/3", "6/3", "3/7"], "2 · 3 + 1 = 7.", "Oddiy kasrlar", M),
 ("0,5 + 0,25 = ?", ["0,75", "0,30", "0,525", "7,5"], None, "O‘nli kasrlar", E),
 ("4,2 · 10 = ?", ["42", "4,20", "0,42", "420"], "10 ga ko‘paytirilganda vergul bir xona o‘ngga suriladi.", "O‘nli kasrlar", E),
 ("Bo‘yi 8 sm, eni 5 sm bo‘lgan to‘g‘ri to‘rtburchakning perimetri?", ["26 sm", "40 sm", "13 sm", "80 sm"], "P = 2 · (8 + 5) = 26 sm.", "Perimetr va yuza", E),
 ("Bo‘yi 8 sm, eni 5 sm bo‘lgan to‘g‘ri to‘rtburchakning yuzi?", ["40 sm²", "26 sm²", "13 sm²", "45 sm²"], "S = 8 · 5 = 40 sm².", "Perimetr va yuza", E),
 ("2,5 soat necha daqiqa?", ["150 daqiqa", "250 daqiqa", "125 daqiqa", "90 daqiqa"], "2,5 · 60 = 150.", "O‘lchov birliklari", M),
 ("3 km 250 m necha metr?", ["3250 m", "325 m", "3025 m", "32 500 m"], None, "O‘lchov birliklari", E),
 ("24 ta daftar 3 o‘quvchiga teng bo‘lindi. Har biriga nechtadan tegdi?", ["8 ta", "6 ta", "7 ta", "21 ta"], None, "Masalalar", E),
 ("To‘g‘ri burchak necha gradus?", ["90°", "180°", "45°", "60°"], None, "Burchaklar", E),
])

test("Algebra | 8-sinf: ildizlar va kvadrat tenglamalar", "matematika", "mavzu", 8, 25,
 "8-sinf algebra mavzulari: kvadrat ildiz, darajalar, ko‘paytuvchilarga ajratish, kvadrat tenglamalar va Viyet teoremasi, tengsizliklar.", [
 ("√81 = ?", ["9", "8", "81", "40,5"], None, "Kvadrat ildiz", E),
 ("√2 · √8 = ?", ["4", "√10", "16", "2√2"], "√16 = 4.", "Kvadrat ildiz", M),
 ("(√5)² = ?", ["5", "25", "√5", "10"], None, "Kvadrat ildiz", E),
 ("1/√2 ni maxrajini irratsionallikdan qutqarib yozing.", ["√2/2", "2/√2", "√2", "1/2"], "1/√2 = √2/(√2·√2) = √2/2.", "Kvadrat ildiz", H),
 ("√(3² + 4²) = ?", ["5", "7", "25", "12"], "√25 = 5.", "Kvadrat ildiz", E),
 ("a² · a³ = ?", ["a⁵", "a⁶", "a", "2a⁵"], None, "Darajalar", E),
 ("(a³)² = ?", ["a⁶", "a⁵", "a⁹", "2a³"], None, "Darajalar", E),
 ("2⁻³ = ?", ["1/8", "−8", "−6", "1/6"], None, "Darajalar", M),
 ("0,00052 sonining standart shakli?", ["5,2 · 10⁻⁴", "5,2 · 10⁴", "52 · 10⁻⁵", "0,52 · 10⁻³"], None, "Darajalar", M),
 ("x² − 16 ni ko‘paytuvchilarga ajrating.", ["(x − 4)(x + 4)", "(x − 4)²", "(x − 8)(x + 2)", "(x + 4)²"], "a² − b² = (a − b)(a + b).", "Ko‘paytuvchilarga ajratish", E),
 ("(x² − 1) / (x − 1) ni soddalashtiring (x ≠ 1).", ["x + 1", "x − 1", "x", "1"], "x² − 1 = (x − 1)(x + 1).", "Ko‘paytuvchilarga ajratish", M),
 ("x² = 49 tenglamaning ildizlari?", ["−7 va 7", "7", "49", "−7"], None, "Kvadrat tenglamalar", E),
 ("x² − 6x + 5 = 0 tenglamaning ildizlari?", ["1 va 5", "−1 va −5", "2 va 3", "1 va 6"], "Yig‘indi 6, ko‘paytma 5.", "Kvadrat tenglamalar", M),
 ("x² + 2x − 3 = 0 tenglamaning diskriminanti?", ["16", "8", "−8", "4"], "D = 4 + 12 = 16.", "Kvadrat tenglamalar", M),
 ("x² − 7x + 10 = 0 tenglama ildizlarining yig‘indisi?", ["7", "10", "−7", "−10"], "Viyet teoremasi: x₁ + x₂ = −b/a = 7.", "Viyet teoremasi", M),
 ("x² + 3x − 10 = 0 tenglama ildizlarining ko‘paytmasi?", ["−10", "10", "3", "−3"], "Viyet teoremasi: x₁ · x₂ = c/a = −10.", "Viyet teoremasi", M),
 ("−3x < 12 tengsizlikni yeching.", ["x > −4", "x < −4", "x > 4", "x < 4"], "Manfiy songa bo‘lganda tengsizlik belgisi o‘zgaradi.", "Tengsizliklar", H),
 ("2x + y = 7 va x − y = 2 sistemaning yechimi?", ["x = 3, y = 1", "x = 1, y = 5", "x = 2, y = 3", "x = 4, y = −1"], "Qo‘shsak: 3x = 9, x = 3; y = 1.", "Tenglamalar sistemasi", M),
 ("y = 1/x funksiyaning grafigi qanday nomlanadi?", ["Giperbola", "Parabola", "To‘g‘ri chiziq", "Aylana"], None, "Funksiyalar", E),
 ("y = x² parabolaning uchi qaysi nuqtada?", ["(0; 0)", "(1; 1)", "(0; 1)", "(1; 0)"], None, "Funksiyalar", E),
])

test("Geometriya | 7–9-sinf: uchburchak, to‘rtburchak, aylana", "matematika", "mavzu", 9, 20,
 "7–9-sinf geometriya mavzulari: burchaklar, uchburchaklar, Pifagor teoremasi, to‘rtburchaklar yuzi, aylana va doira.", [
 ("Qo‘shni burchaklardan biri 65°. Ikkinchisi necha gradus?", ["115°", "25°", "65°", "135°"], "Qo‘shni burchaklar yig‘indisi 180°.", "Burchaklar", E),
 ("Vertikal burchaklar haqida qaysi fikr to‘g‘ri?", ["Ular teng", "Yig‘indisi 90°", "Yig‘indisi 180°", "Biri ikkinchisidan ikki marta katta"], None, "Burchaklar", E),
 ("Teng tomonli uchburchakning har bir burchagi?", ["60°", "90°", "45°", "120°"], None, "Uchburchaklar", E),
 ("Teng yonli uchburchakning asosidagi burchaklari haqida to‘g‘ri fikr?", ["Ular teng", "Ular har doim 90°", "Yig‘indisi 90°", "Biri o‘tmas"], None, "Uchburchaklar", E),
 ("Uchburchakning tashqi burchagi nimaga teng?", ["U bilan qo‘shni bo‘lmagan ikki ichki burchak yig‘indisiga", "Qo‘shni ichki burchakka", "180° ga", "Uchala ichki burchak yig‘indisiga"], None, "Uchburchaklar", M),
 ("Katetlari 9 va 12 bo‘lgan to‘g‘ri burchakli uchburchakning gipotenuzasi?", ["15", "21", "13", "108"], "√(81 + 144) = √225 = 15.", "Pifagor teoremasi", M),
 ("Asosi 10, balandligi 6 bo‘lgan uchburchakning yuzi?", ["30", "60", "16", "15"], "S = 10 · 6 / 2 = 30.", "Yuzalar", E),
 ("Asosi 8, balandligi 5 bo‘lgan parallelogrammning yuzi?", ["40", "20", "13", "26"], "S = a · h = 40.", "Yuzalar", E),
 ("Diagonallari 6 va 8 bo‘lgan rombning yuzi?", ["24", "48", "14", "12"], "S = d₁ · d₂ / 2 = 24.", "Yuzalar", M),
 ("To‘rtburchak ichki burchaklarining yig‘indisi?", ["360°", "180°", "540°", "720°"], None, "To‘rtburchaklar", E),
 ("Diametri 10 bo‘lgan doiraning yuzi?", ["25π", "100π", "10π", "5π"], "r = 5, S = πr² = 25π.", "Aylana va doira", M),
 ("Diametri 10 bo‘lgan aylananing uzunligi?", ["10π", "5π", "25π", "20π"], "C = πd = 10π.", "Aylana va doira", E),
 ("Diametrga tiralgan ichki chizilgan burchak necha gradus?", ["90°", "180°", "45°", "60°"], None, "Aylana va doira", M),
 ("O‘xshash uchburchaklarning o‘xshashlik koeffitsiyenti 2 ga teng. Yuzalari nisbati?", ["4", "2", "8", "√2"], "Yuzalar nisbati k² ga teng.", "O‘xshashlik", H),
 ("Tomoni 4 bo‘lgan muntazam oltiburchakning perimetri?", ["24", "16", "20", "36"], "6 · 4 = 24.", "Ko‘pburchaklar", E),
])

test("Ingliz tili | 5-sinf: so‘zlar va oddiy grammatika", "ingliz", "mavzu", 5, 10,
 "5-sinf ingliz tili mavzulari: ranglar, sonlar, hafta kunlari va oylar, oila, to be / have got, Present Simple.", [
 ("«Olma» in English is …", ["apple", "orange", "pear", "grape"], None, "Vocabulary", E),
 ("«Qizil» in English is …", ["red", "green", "blue", "yellow"], None, "Colours", E),
 ("«Twelve» — this number is …", ["12", "20", "2", "21"], None, "Numbers", E),
 ("Which day comes after Monday?", ["Tuesday", "Sunday", "Thursday", "Friday"], None, "Days and months", E),
 ("The first month of the year is …", ["January", "June", "March", "December"], None, "Days and months", E),
 ("I ___ ten years old.", ["am", "is", "are", "be"], None, "To be", E),
 ("This is ___ umbrella.", ["an", "a", "the two", "some"], "«Umbrella» begins with a vowel sound.", "Articles", E),
 ("There ___ a cat in the room.", ["is", "are", "am", "be"], None, "There is / are", E),
 ("My sister ___ long hair.", ["has", "have", "is", "are"], None, "Have got", E),
 ("He ___ to school every day.", ["goes", "go", "going", "gone"], None, "Present Simple", M),
 ("The opposite of «hot» is …", ["cold", "warm", "big", "old"], None, "Vocabulary", E),
 ("«Ona» in English is …", ["mother", "father", "sister", "aunt"], None, "Family", E),
 ("The plural of «box» is …", ["boxes", "boxs", "boxies", "box"], None, "Nouns", M),
 ("«What's your name?» — the best answer:", ["My name is Ali.", "I am fine.", "I am ten.", "I live in Qiziriq."], None, "Speaking", E),
 ("I study ___ school number 14.", ["at", "on", "under", "of"], None, "Prepositions", M),
])

# ---------------------------------------------------------------- SQL
def q(s):
    return "null" if s is None else "'" + s.replace("'", "''") + "'"

def load_old():
    import contextlib, io, os, runpy
    with contextlib.redirect_stdout(io.StringIO()):
        ns = runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_tests.py"))
    return ns["TESTS"]

def main():
    old = load_old()
    assert set(OLD_TAGS) == {t[0] for t in old}, "tags must cover every old test"
    for title, _s, _k, _g, _m, _d, items in old:
        assert len(OLD_TAGS[title]) == len(items), (title, len(OLD_TAGS[title]), len(items))
    seen_titles = {t[0] for t in old}
    for title, subject, kind, grade, minutes, desc, items in NEW:
        assert title not in seen_titles, title
        seen_titles.add(title)
        texts = [it[0] for it in items]
        assert len(texts) == len(set(texts)), f"repeated question in {title}"
        for question, options, expl, topic, diff in items:
            assert 2 <= len(options) <= 6 and len(options) == len(set(options)), (title, question)
            assert topic and len(topic) <= 80 and diff in (1, 2, 3), (title, question)

    rng = random.Random(1402)
    out = ["-- The question bank, part 2 (scripts/seed_tests_2.py). Applied once; re-running adds the new tests again.", "begin;"]
    rows = []
    for title, _s, _k, _g, _m, _d, items in old:
        for (question, *_rest), (topic, diff) in zip(items, OLD_TAGS[title]):
            rows.append(f"  ({q(title)}, {q(question)}, {q(topic)}, {diff})")
    out.append("update public.test_questions x set topic = v.topic, difficulty = v.difficulty")
    out.append("from public.tests t, (values")
    out.append(",\n".join(rows))
    out.append(") as v (title, question, topic, difficulty)")
    out.append("where t.id = x.test_id and t.title_uz = v.title and x.question = v.question and x.topic is null;")

    order = {"mavzu": 20, "dtm": 110}
    for title, subject, kind, grade, minutes, desc, items in NEW:
        order[kind] += 1
        out.append(f"with t as (insert into public.tests (title_uz, description_uz, subject, kind, grade, time_limit, source, sort_order, is_published)")
        out.append(f"  values ({q(title)}, {q(desc)}, {q(subject)}, {q(kind)}, {grade or 'null'}, {minutes or 'null'}, {q(SOURCE)}, {order[kind]}, true) returning id)")
        vals = []
        for i, (question, options, expl, topic, diff) in enumerate(items, 1):
            ix = list(range(len(options)))
            rng.shuffle(ix)
            arr = "array[" + ", ".join(q(options[k]) for k in ix) + "]"
            vals.append(f"  ((select id from t), {q(question)}, {arr}, {ix.index(0)}, {q(expl)}, {q(topic)}, {diff}, {i})")
        out.append("insert into public.test_questions (test_id, question, options, correct, explanation, topic, difficulty, sort_order) values")
        out.append(",\n".join(vals) + ";")
    out.append("commit;")
    print("\n".join(out))

    import sys
    n_new = sum(len(t[6]) for t in NEW)
    print(f"-- {len(NEW)} new tests, {n_new} new questions; {sum(len(t[6]) for t in old)} old questions tagged", file=sys.stderr)

main()
