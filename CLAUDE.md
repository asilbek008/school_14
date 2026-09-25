# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Loyiha

14-maktabning rasmiy veb-sayti, 3 tilda: o‘zbek (standart), rus, ingliz. Ochiq sahifalar:
bosh sahifa, yangiliklar va tadbirlar, maktab haqida va o‘qituvchilar, qabul va aloqa.
Parol bilan himoyalangan admin panel orqali maktab xodimlari kod yozmasdan yangilik/tadbir
qo‘shadi, o‘qituvchilar va sahifalarni tahrirlaydi. Maktab haqidagi batafsil ma’lumotlar
(to‘liq nom, manzil, tarix) hali kiritilmagan — egasi keyinroq yuboradi.

## Texnologiyalar

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- Supabase: Postgres, Auth (admin kirishi), Storage (rasmlar). Loyiha: `school-14`
  (ref `cieusvxrfpshlpjelvkt`, "School 14" tashkiloti, Frankfurt `eu-central-1`)
- Ish tartibi (egasining talabi): har vazifa tugagach so‘ramasdan PR ochib `main` ga squash-birlashtiring, branchni `main` dan
  qayta boshlang, Vercel deployi tayyor bo‘lgach natijani saytda tekshirib, egasiga havolasini ko‘rsating.
- Vercel'ga joylanadi (faqat `main`; `vercel.json` `claude/*` branchlarini deploy qilmaydi — bepul tarifning kunlik
  deploy limiti tejaladi)

Next.js 16 o‘quv ma’lumotlaridan farq qiladi: `middleware.ts` endi `src/proxy.ts`
(funksiya nomi `proxy`), `params` — Promise (`await params`), `PageProps<"/[lang]">` /
`LayoutProps<"/[lang]">` global tiplar. Shubha bo‘lsa, `node_modules/next/dist/docs/` ni o‘qing.

## Buyruqlar

- `npm install` — bog‘liqliklarni o‘rnatish
- `npm run dev` — ishlab chiqish serveri, http://localhost:3000
- `npm run build` — production build (TypeScript tekshiruvi ham shu yerda; push'dan oldin ishga tushiring)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — faqat tiplarni tekshirish. Route'lar o‘zgargandan keyin `.next/types`
  eskirib, soxta xatolar chiqsa: `rm -rf .next && npm run build`

- CI: `.github/workflows/ci.yml` — har push/PR'da `npm ci`, lint, `next typegen` + `tsc`, build (Supabase kalitisiz — bo‘sh holatlar),
  Telegram tahlil testi.

## Arxitektura

### Tillar (i18n)
- Barcha sahifalar `src/app/[lang]/` ichida; `[lang]/layout.tsx` — root layout (`<html lang>`),
  `generateStaticParams` orqali `uz`, `ru`, `en` oldindan yaratiladi.
- `src/i18n/config.ts` — `locales`, `defaultLocale` (`uz`), `hasLocale()`. Har bir page/layout
  `hasLocale(lang)` ni tekshiradi, noto‘g‘ri bo‘lsa `notFound()` chaqiradi.
- `src/proxy.ts` — tilsiz URL'ni (`/news`) tilli URL'ga (`/uz/news`) yo‘naltiradi. Tartib:
  `NEXT_LOCALE` cookie → `Accept-Language` → `uz`. Cookie'ni `LanguageSwitcher` o‘rnatadi.
- UI matnlari `src/i18n/dictionaries/{uz,ru,en}.json` da, server tomonda `getDictionary(lang)`
  bilan yuklanadi (`server-only`). `Dictionary` tipi `uz.json` dan olinadi, shuning uchun yangi
  kalitni **uchala** faylga qo‘shing. Client komponentlarga lug‘atning kerakli qismini props
  orqali bering.
- O‘zbekcha matnlarda lotin yozuvi va `‘` / `’` belgilari ishlatiladi (masalan `O‘qituvchilar`).

### Ma’lumot o‘qish (ochiq sahifalar)
- Barcha ochiq so‘rovlar `src/lib/content.ts` da (`getNews`, `getEvents`, `getStaff`, `getPage`...).
  Ular `src/lib/supabase/public.ts` dagi cookie'siz `anon` client'dan foydalanadi, shuning uchun
  sahifalar statik yaratilib, `export const revalidate = 300` bilan yangilanadi. Env o‘rnatilmagan
  bo‘lsa client `null` qaytaradi va sahifalar bo‘sh holatni ko‘rsatadi (xato bermaydi).
- `localized(row, "title", lang)` — `title_<lang>` bo‘sh bo‘lsa `title_uz` ni qaytaradi.
  `mediaUrl(path)` — `media` bucket'dagi yo‘lni ochiq URL'ga aylantiradi.
- Admin kiritgan matn HTML emas, oddiy matn: `RichText` bo‘sh qator bo‘yicha paragraflarga ajratadi.
- "Qabul" (`[lang]/admissions`; artifactda bu bo‘lim yo‘q, shu uslubda qilingan): 3 qadam (qo‘ng‘iroq, ish vaqtida kelish,
  rahbariyat bilan uchrashish — egasining matnidan), `pages` matni, oltin izoh va aloqa kartasi (qo‘ng‘iroq / murojaat).
  Hujjatlar ro‘yxati va muddatlar egasi tasdiqlamaguncha yozilmaydi. Bo‘lim sarlavhasi — `SectionHead`. "Maktab haqida" (`[lang]/about`, maketdagidek): banner (kicker —
  sahifa sarlavhasi, h1 — maktab nomi, `about.lead`), 4 rangli raqam kartasi (o‘quvchi, xodim, sinf, smena), `pages`
  matni + "Qisqacha" (faoliyati, manzil, telefon, ish vaqti), rahbariyat (`positionGroup` = `leaders`, profilga havola)
  va dars vaqtlari qisqacha — to‘liq qo‘ng‘iroqlar jadvali va savol-javob o‘z sahifalarida (takrorlanmaydi).
- Aloqa formasi: `[lang]/contact/actions.ts` Server Action `contact_messages` ga yozadi
  (honeypot `website` maydoni bor; telefon yoki email majburiy; spam cheklovi — `private.contact_rate_limit` trigger'i: bir telefon/email'dan
  10 daqiqada 3 tadan, jami 30 tadan ortiq bo‘lsa `rate_limited` → formada `tooMany`). Action kiritilgan qiymatlarni
  qaytaradi — React 19 action'dan keyin formani tozalaydi, shuning uchun `defaultValue` kerak (`select` yangi
  `defaultValue` ni olmaydi — u `attempt` bo‘yicha qayta yaratiladi). Mavzu (`topic`: savol/taklif/murojaat/boshqa,
  `contactTopics`) admin xabarlarida belgi bo‘lib chiqadi. Sahifa maketdagidek: 4 aloqa kartasi (boshqa sahifalardagi raqam kartalari kabi rangli — `tileColors` `StatTiles` dan; telefonda ixcham),
  "Murojaat yuborish" formasi, "Tezkor javob kerakmi?" izohi va xarita.
- Ishonch qutisi (`/[lang]/trust`, `trust_messages`; admin `/admin/trust`): ismsiz maxfiy murojaat — mavzu (`trustTopics`:
  xavfsizlik/pul/munosabat/taklif/boshqa), matn (10–5000 belgi) va ixtiyoriy aloqa. Yuboruvchi haqida hech narsa saqlanmaydi
  (ism, IP yo‘q); `actions.ts` xato matnini ham loglamaydi. RLS: hamma yozadi, faqat admin o‘qiydi. `private.trust_rate_limit`
  (10 daqiqada 20 ta), `private.notify_trust_message` — Telegram'ga 🔒 belgisi bilan (`notify_messages` yoqilgan bo‘lsa).
  Sahifa `robots: index:false`. Havolalar: footer, aloqa sahifasidagi karta. Admin menyusida o‘qilmaganlar soni, bosh sahifadagi
  "E’tibor talab qiladi" ro‘yxatida ham.
- Onlayn qabul arizasi (`/[lang]/admissions/apply`, `admission_applications`; admin `/admin/applications`): bola F.I.Sh.,
  tug‘ilgan sanasi, sinf (1–11), ota-ona F.I.Sh. va telefoni majburiy; manzil, oldingi maktab va izoh ixtiyoriy. Bu bolaning
  shaxsiy ma’lumoti — saytda hech qachon ko‘rinmaydi: RLS'da hamma yozadi, faqat admin o‘qiydi; `actions.ts` faqat xato kodini
  loglaydi. Yosh 5–20 oralig‘ida tekshiriladi (`badDate`), `private.admission_rate_limit` — 10 daqiqada bir raqamdan 2 ta,
  jami 20 ta; `private.notify_admission` — Telegram'ga 🎒 belgisi bilan. Holat: `new` → `contacted` → `accepted`/`declined`,
  admin izohi alohida maydonda. Sahifa `robots: index:false`, havola — "Qabul" sahifasidagi tugma va sayt qidiruvi.
  Admin menyusida yangi arizalar soni, bosh sahifadagi "E’tibor talab qiladi" ro‘yxatida ham.
- Hujjatlar (`/[lang]/documents`, `documents`; admin `/admin/documents`): litsenziya, nizom, buyruq, hisobot va ariza
  shakllari. Har hujjat — yo `media` bucket'dagi fayl (`kind='file'`, `path`, `file_type`/`file_size` avtomatik), yo boshqa
  saytdagi havola (`kind='link'`, `url` — masalan lex.uz). Bo‘limlar `documentCategories` (`meyoriy|buyruq|hisobot|shakl|boshqa`,
  nomlari lug‘atda `docCats`), sahifada 3 rangli raqam kartasi, `CategoryFilter` (bo‘lim tugmalari + nom bo‘yicha qidiruv).
  Bucket PDF/Word/Excel'ni ham oladi (50 MB gacha; `FileUpload` brauzerdan to‘g‘ridan-to‘g‘ri yuklaydi, Server Action faylni
  ko‘tarmaydi). Admin ro‘yxati `SortableList` (sudrab/↑↓ — `reorderDocuments`), fayl almashtirilsa eskisi Storage'dan o‘chadi;
  hujjat o‘chirilganda fayli ham. Menyuda "Maktab ▾" ichida, footer va sayt qidiruvida ham.
- O‘quv yili taqvimi (`/[lang]/calendar`, `calendar_periods`; admin `/admin/calendar`): choraklar, ta’tillar, imtihonlar (`kind`
  `chorak|tatil|imtihon|boshqa`, `starts_on`/`ends_on` — oddiy sana, `formatDayRange` UTC'da). Davlat bayramlari takrorlanmaydi —
  `getCalendar(start)` ularni `events` (`bayram`) dan oladi. Faqat joriy o‘quv yili. Sahifa: 4 raqam kartasi, `CalendarNow` (client,
  Toshkent kuni: hozirgi davr — chorak ichidagi ta’til/imtihon ustun — va keyingisi, necha kun qolgani), md+ da yil chizig‘i
  (sentabr–avgust, sanaga qarab joylashadi; qisqa bo‘lakda nom yo‘q, `title`da), oylar bo‘yicha kartalar. Sanalar faqat vazirlik
  buyrug‘idan (egasi kiritadi). Menyuda "Maktab ▾" ichida.
- Yutuqlar devori (`/[lang]/achievements`, `achievements`; admin `/admin/achievements`): olimpiada/sport/tanlov natijalari —
  `field` (`achievementFields`), `level` (maktab…xalqaro), `place` 1–3 yoki bo‘sh (`result_*` — sertifikat, ball), g‘olib — `winner`
  (sinf yoki jamoa). O‘quvchi ismi (`names`) faqat `names_consent` bilan: DB `check` + action ham rad etadi, `getAchievements()` ham
  roziliksizni tashlab yuboradi. `teacher_id` — tayyorlagan o‘qituvchi (profilga havola). Sahifa: raqam kartalari (o‘qituvchi kartasi 0 da
  chiqmaydi), medal (oltin/kumush/bronza), bosqich belgisi, turkum tugmalari + qidiruv, `year-scope`/`data-year`. Menyuda "Tadbirlar ▾".
- Testlar va DTM (`/[lang]/tests`, `/tests/[id]`, `/tests/dtm`; `tests` + `test_questions`; admin `/admin/tests`): fan/mavzu testlari
  (`kind='mavzu'`) va DTM savollar banki (`kind='dtm'`). Fanlar — `src/lib/tests.ts` `testSubjects` (DB `check` bilan bir xil; nomlari
  lug‘atda `tests.subjects`), DTM formati `dtm` (majburiy ona tili/matematika/tarix 10×1.1, 1-fan 30×3.1, 2-fan 30×2.1 = 189 ball, 180 daqiqa).
  To‘g‘ri javob va izoh mehmonga ko‘rinmaydi: anon'ga `test_questions` ning faqat boshqa ustunlari `grant` qilingan (shuning uchun
  `select *`/`(count)` embed ishlamaydi — ustunlarni aniq yozing, sonni id'lardan hisoblang), javob — javob berilgandan keyin
  `rpc('test_answers', ids)` (public invoker → `private.test_answers` definer, faqat e’lon qilingan testlar, 200 tagacha). DTM sinovi —
  `rpc('random_test_questions', subject, n)` bilan har fandan tasodifiy (brauzerda). O‘quvchi ro‘yxatdan o‘tmaydi: urinish
  `localStorage.testRun:<key>` da (qayta yuklansa davom ettiriladi, vaqt `startedAt` dan), natijalar — `localStorage.testResults`
  (`TestHistory`), serverga hech narsa yuborilmaydi. `TestRunner` (mashq: har savoldan keyin tekshirish; imtihon: savollar xaritasi,
  vaqt tugasa avtomatik yakun; variantlar aralashtiriladi), `TestPlayer`, `DtmPlayer`. Admin: test formasi, savollar ro‘yxati, savol
  formasi (A–F, to‘g‘risi radio, rasm `media/tests/`), ko‘plab yuklash — matn (Word ko‘rinishi: `*B)`, `Javob: B` yoki oxirida
  `Javoblar: 1-B, …`) yoki Excel (`Savol, A…D, Javob, Izoh`; namuna — `/admin/export/test-template`) — `src/lib/test-import.ts`,
  test: `node --experimental-strip-types scripts/test-question-import.mts` (CI'da ham). Xato bo‘lsa hech narsa saqlanmaydi. Savollar
  faqat egasi/o‘qituvchilar kiritadi — to‘qima savol qo‘shmang. Bosh sahifada `TestsCard` (test bo‘lsa), menyuda "Maktab ▾" ichida.
- O‘quvchilar soni sinf kesimida: `school_classes.students` (0–60, bo‘sh — kiritilmagan). Admin `/admin/classes/students` — barcha
  sinflar bitta formada (`saveStudents`, faqat o‘zgarganlari yoziladi; jami, parallel yig‘indisi va tasdiqlangan son bilan farq),
  sinf formasida ham maydon; ro‘yxatda "O‘quvchi soni kiritilmagan" filtri. Saytda (bosh sahifa, "Maktab haqida", joriy o‘quv yili)
  `getStudentTotal()` — hamma e’lon qilingan sinfda son bo‘lsa yig‘indi, aks holda `school.stats.students` (egasi tasdiqlagan 973).
  Maktab 1976-yilda qurilgan (`foundedLabel`), 72 o‘qituvchi (egasi, 2026-09).
- Test savollari manbalari (egasining so‘rovi bilan o‘rganilgan): savollarni faqat o‘qituvchilar o‘zi tuzadi yoki ochiq litsenziyali
  (masalan OpenStax CC BY 4.0 tarjimasi) bo‘ladi; test kitoblari, pullik saytlar, Telegram va "sizib chiqqan DTM" savollari ko‘chirilmaydi
  (mualliflik huquqi, xato kalitlar). Rasmiy namunalar (uzbmb.uz) faqat havola — `OfficialSamples` (`/tests`, `/tests/dtm`). Har testda
  `tests.source` (muallif/manba, litsenziya) — saytda test ostida "Manba". Saytda "DTM formatidagi mashq savollari" deyiladi, "haqiqiy DTM" emas.
- Maktab faktlari `src/lib/school.ts` da: manzil, telefon, email, xarita (`location` — Google Maps pin, `mapUrl` — egasi
  bergan havola; `/contact` da `mapEmbedUrl(lang)` iframe, manzil topbar/footer'da xaritaga havola), ish vaqti (tarjima qilinadiganlari
  `Record<Locale, string>`), raqamlar (o‘quvchi/xodim/sinf). `null` = "tez orada". Sinflar soni bosh sahifada
  `school_classes` dan hisoblanadi (YT — yakka tartibdagi sinflar qo‘shilmaydi).
- Qo‘ng‘iroqlar: `src/lib/bells.ts` — 2 smena (08:00: 1,2,5,9,10,11-sinf; 13:00: 3,4,6,7,8-sinf),
  dars 45 daq, tanaffus 5 daq. `/schedule` sahifasi va `LiveCard` ("Hozir maktabda", client
  komponent, Toshkent vaqtini brauzerda hisoblaydi — sahifa keshlangani uchun serverda emas) shundan foydalanadi.
- Lug‘at satrlaridagi `{n}` kabi joylar `fill()` (`src/i18n/fill.ts`) bilan to‘ldiriladi.
- Savol-javob (`/faq`, maketdagidek akkordeon — `details.acc`; yonida "Javob topmadingizmi?" — rangli karta, `tileColors[0]`;
  tepada savol va javob matni bo‘yicha qidiruv — `CategoryFilter` `options={[]}`, tugmalarsiz faqat qidiruv chiqadi) matnlari
  lug‘atda (`faq.items`; ixtiyoriy `link` — javob ostida "Ochish →" havolasi). Maketdagi YT savoli qo‘shilmagan (raqamlari tasdiqlanmagan).
- Turkumlar (`src/lib/categories.ts`): yangilik — `yangilik|elon|tadbir|yutuq`, tadbir —
  `bayram|maktab|olimpiada|sport` (DB `check` bilan bir xil; nomlari lug‘atda `newsCats`/`eventCats`).
  Ro‘yxatlarda `CategoryFilter` — server render qilingan elementlarni `data-cat` bo‘yicha CSS bilan
  yashiradi, shuning uchun sahifa keshlanishi buzilmaydi. `data-cat-only` + `hidden` — faqat o‘sha turkum tanlanganda
  ko‘rinadi (`/events` da guruh sarlavhasidagi son turkum bo‘yicha o‘zgaradi, bo‘sh guruhda "Bu turdagi tadbir yo‘q").
- `events.all_day` — bayramlar kabi vaqtsiz tadbirlar Toshkent vaqti 00:00–23:59 sifatida saqlanadi
  (yaqinlashayotgan/o‘tgan ajratish kun davomida to‘g‘ri ishlashi uchun), saytda faqat sana chiqadi.
- Doimiy tadbirlar (`/programs`, `/programs/[slug]`, `programs` jadvali; admin `/admin/programs`): yil bo‘yi muntazam
  loyihalar (birinchisi — Zakovat, `supabase/seed/programs.sql`). `keyword` kiritilsa, `getNewsMentioning()` shu so‘z
  sarlavha yoki matnda uchragan yangiliklarni (Telegram'dan kelganlarini ham) loyiha sahifasida ko‘rsatadi; o‘z rasmi
  (`cover`) bo‘lmasa, oxirgi tegishli yangilik muqovasi olinadi. Menyuda "Tadbirlar ▾" ichida. `/programs` tepasida 4 rangli raqam kartasi (loyiha, tegishli yangiliklar, rasm/video — `getPrograms`
  `media:program_media(count)`, ligadagi 14-maktab jamoalari), kartada har bosqichdagi eng yaxshi o‘rnimiz (🏆), qidiruv 3 tadan ko‘p loyiha bo‘lsa. Rasm/video — `program_media`
  (`club_media` kabi, `media/programs/<id>/`); sahifada tavsifdan keyin rasmlar (`Lightbox`), videolar (`VideoGrid`), keyin yangiliklar.
  Admin: ro‘yxat `SortableList` (to‘garaklar bilan umumiy; sudrab yoki ↑↓, `reorderPrograms`), qatorda kalit so‘z va u topgan
  yangiliklar soni; yangi tadbir saqlangach rasm/video sahifasiga o‘tiladi; rasmlar tartibi `PhotoManager` bilan.
  O‘quvchilar ligasi (Zakovat): `league_tables` (program_id, stage `republic`|`region`, title, as_of, rows jsonb — butun jadval
  bitta qatorda). Admin tadbir sahifasida ligining Excel faylini yuklaydi (`importLeague`; `src/lib/league.ts` — «Jamoa nomi», «Jami»
  va «N-tur» ustunlari, har biri ochko + reyting; reytingli va eng ko‘p jamoali varaq tanlanadi), bosqich jadvali almashtiriladi.
  Saytda `LeagueStandings` (client, xodimlar ro‘yxati uslubida): bosqich yorliqlari, 14-maktab jamoalari kartalari (`isOurSchool` —
  "Qiziriq tumani 14-maktab"), qidiruv, filtr (hammasi / 14-maktab / tuman — `districtOf`), jadval (telefonda kartalar), 50 tadan.
  Viloyat jadvali egasi yuborgan rasmdan ko‘chirilgan (jami = turlar yig‘indisi bilan tekshirilgan).
  Bir ma’lumot bir bo‘limda (egasining talabi): `getNews()` (yangiliklar sahifasi, bosh sahifa, "Boshqa yangiliklar")
  dasturlar kalit so‘zi uchragan yangiliklarni chiqarmaydi — ular faqat dastur sahifasida; bunday yangilikdagi
  "orqaga" havolasi dastur sahifasiga olib boradi.
- To‘garak tafsilotlari (`club_details` migratsiyasi): rahbar — `leader_id` (xodimlar ro‘yxatidan; saytda profilga havola) yoki
  `leader` matni (ro‘yxatda yo‘q bo‘lsa); vaqt — `days` (1–6) + `start_time`/`end_time`, saytda `clubSchedule()` (`src/lib/clubs.ts`,
  kun nomlari `timetable.days` dan), `schedule_*` — faqat izoh. Rasm/video — `club_media` (`photo`/`video` — `media/clubs/<id>/`
  dagi fayl, `youtube` — video id; RLS to‘garakka bog‘liq). `media` bucket videoni ham oladi (MP4/WebM/MOV, 50 MB gacha).
  Har to‘garakning sahifasi `/clubs/[id]` (tavsif, rasmlar `Lightbox`, videolar — `<video>` yoki youtube-nocookie iframe, yon
  kartada rahbar/vaqt/joy/sinflar). Admin: ro‘yxatda tartib sudrab yoki ↑↓ bilan (`reorderClubs`, darhol saqlanadi), formada
  hafta kunlari tugmalari va vaqt, yangi to‘garak saqlangach rasm/video qo‘shish sahifasiga o‘tiladi; o‘chirilganda fayllari ham o‘chadi.
- To‘garaklar (`/clubs`, `clubs` jadvali; maketdagidek: "Qo‘shimcha ta’lim" / "To‘garaklar va mashg‘ulotlar", karta chetida
  navbatma-navbat rangli chiziq, sarlavha yonida sinflar, pastda Rahbari → Vaqti → Joyi; tepada 4 rangli raqam kartasi — to‘garak, rahbar,
  haftalik mashg‘ulot, rasm/video; sinf tugmalari 1–4 / 5–9 / 10–11 — to‘garak sinflari kesishgan har guruhda chiqadi, `data-cat` bo‘sh joy bilan
  ajratilgan ro‘yxat, `CategoryFilter` `~=` bilan tekshiradi; nom/rahbar/joy bo‘yicha qidiruv) va galereya (`/gallery`, `gallery_albums` +
  `gallery_photos`). Albom rasmlari RLS'da albomning o‘ziga bog‘liq: albom yashirin bo‘lsa, rasmlari
  ham mehmonga ko‘rinmaydi. `Lightbox` — rasmlar to‘ri (`layout="mosaic"`: 1-rasm katta, `mosaicSpan` qatorlarni
  bo‘shliqsiz yopadi) va to‘liq ekranli ko‘ruvchi (Esc, ←/→, telefonda surish, miniatyuralar; kichik rasm 1.5× dan
  ortiq kattalashtirilmaydi, orqasida o‘zining xiralashgan nusxasi). `PhotoFrame` — muqovani qirqmasdan, xira
  fon ustida ko‘rsatadi (Telegram'ning past sifatli rasmlari ham chiroyli chiqishi uchun).
- Dars jadvali (`/timetable`, `/timetable/[id]`): `school_classes` (grade + letter, sinf rahbari
  `homeroom_teacher_id` → `staff`), `subjects` (fanlar ro‘yxati, tarjimali) va `lessons` (bitta katak:
  class_id, weekday 1–6, period 1–6, subject_id, teacher — eMaktab'dagidek "Familiya I.O." matn); haftama-hafta almashadigan dars uchun
  `alt_subject_id` + `alt_teacher`). `lessons` da `subjects` ga ikkita FK bor, shuning uchun embed'da
  aniq ko‘rsating: `subjects!lessons_subject_id_fkey(...)`. Smena va dars vaqtlari sinfdan `shiftForGrade()`
  orqali olinadi (`bells.ts`), bazada saqlanmaydi. Darslar RLS'da sinfga bog‘liq (galereya kabi).
  Ochiq sahifa: `/timetable` — `TimetablePicker` (smena → parallel → sinf; tanlov URL hash'da `#s2-g8`,
  `useSyncExternalStore` bilan o‘qiladi, sahifa keshi buzilmaydi; egasining talabi — maketdagi parallellar to‘ri qaytarildi), `/timetable/[id]` — `ClassTimetableView`
  ("Kunlik": kun tanlash + vaqt chizig‘i, "Haftalik": jadval; "bugun"/"hozir" brauzerda Toshkent vaqti bo‘yicha).
  Telefonda ixcham: smena kartalari yonma-yon (2 ustun, ikonkasiz), parallel/sinf tugmalari kichik. "Haftalik" — jadval
  emas, har kun alohida karta (1/2/3 ustun; dars raqami, fan, o‘qituvchi, vaqt; bugungi karta ajratilgan) — keng
  jadvalni yonga aylantirish chalkash edi.
  Ishlatilayotgan fanni o‘chirib bo‘lmaydi (`on delete restrict`; admin fan sahifasida o‘chirish tugmasi o‘rniga izoh, tepada — fan
  ishlatilgan sinflar va o‘qituvchilar). Fanlar ro‘yxati `SortableList` (sudrab/↑↓, `reorderSubjects`) — jadval tahririda shu tartib;
  qatorda darslar soni (almashib o‘tiladiganlari alohida) va tarjimasi yo‘qligi haqida ogohlantirish. Admin tahriri — 6×6 `select` jadvali,
  saqlashda to‘ldirilganlar upsert, bo‘shatilganlar o‘chiriladi (`classes/actions.ts`).
  Admin ro‘yxati — client `ClassList`: smena tugmalari, kamchiliklar filtri (jadvali bo‘sh, sinf rahbarisiz, profilga bog‘lanmagan
  o‘qituvchi ismi, yashirin); sinf kartasida rahbar, darslar soni va `staff.short_name` ga mos kelmagan ismlar. Sinf sahifasi
  tepasida xulosa (smena, rahbar, darslar, bog‘lanmagan ismlar); jadvaldagi o‘qituvchi maydonlari xodimlarning eMaktab nomlarini
  taklif qiladi (`datalist`).
- eMaktab'dan jadval importi: `scripts/emaktab_timetable.py` (xlrd). Ikki format: "Calendar"
  (chorak kalendari, o‘qituvchilar bilan) va "WeekJournal" (sinf jurnali, bitta hafta, o‘qituvchisiz —
  pastida o‘quvchilar ro‘yxati bor, skript faqat sarlavha qatorlarini o‘qiydi; bunday fayllarni
  repoga qo‘shmang va ishlatib bo‘lgach o‘chiring). Kalendardan standart haftani oladi (bayramsiz to‘liq haftalarda eng ko‘p uchragan dars),
  SQL chiqaradi (sinfni yaratadi, darslarini almashtiradi). eMaktab fan nomlari `SUBJECT_ALIASES`
  va `NEW_SUBJECTS` orqali `subjects` ga moslanadi; noma’lum fan `not null` xatosi bilan to‘xtaydi.
- Xodimlarni Excel'dan yuklash (`/admin/staff/import`): `src/lib/staff-import.ts` faylni brauzerda
  (ko‘rib chiqish uchun) va Server Action'da qayta o‘qiydi (`read-excel-file/universal`; npm `xlsx`
  zaif — ishlatmang). Ustunlar sarlavha nomi bo‘yicha topiladi; xodim `short_name` (eMaktab'dagi
  "Familiya I.O.") yoki to‘liq ism bo‘yicha moslanadi; bo‘sh katak eski qiymatni o‘chirmaydi;
  "Sinf rahbari" (5-A) `school_classes.homeroom_teacher_id` ga yoziladi. Faylda xato bo‘lsa hech narsa saqlanmaydi.
  Dars jadvalidagi o‘qituvchi ismi `staff.short_name` bilan mos kelsa, profilga havola bo‘ladi.
  Admin ro‘yxati — client `StaffList`: qidiruv (ism, eMaktab nomi, fan, lavozim), guruh tugmalari (`positionGroup`), kamchiliklar
  filtri (rasmsiz, eMaktab nomisiz, jadvalda darsi topilmagan, yashirin); qatorda avatar, lavozim belgisi, sinf rahbarligi va
  jadvaldagi darslar soni. Tahrirlash sahifasi tepasida — sinf rahbarligi va jadvaldagi darslar/sinflar (`short_name` bo‘yicha).
  `lessons` 1000 qatordan ko‘p (API bir so‘rovda 1000 tagacha beradi) — hammasi kerak bo‘lsa `allLessons()` (`src/lib/all-lessons.ts`) bilan bo‘laklab o‘qing.
- Telegram kanal → yangilik/tadbir (`/admin/telegram`): Supabase Edge Function `supabase/functions/telegram-sync`
  (Deno; service role'ni Supabase o‘zi beradi — kalit hech kimga kerak emas) kanalning ochiq sahifasini
  (`t.me/s/<kanal>`) o‘qiydi. pg_cron har 15 daqiqada `pg_net` bilan chaqiradi; admin "Hozir tekshirish" ham shu.
  Funksiya JWT tekshirmaydi — `x-sync-secret` sarlavhasi `telegram_settings.sync_secret` bilan solishtiriladi
  (anon o‘qiy olmaydi). Tahlil va turkumlash `parse.ts` da (importsiz, Node testi: `node --experimental-strip-types
  scripts/test-telegram-parse.mts`): birinchi qator — sarlavha; `#tadbir/#bayram/#sport/#olimpiada` + sana
  («15-oktabr soat 10:00», «15.10.2026») → tadbir, sanasiz → yangilik (`tadbir` turkumi); `#elon`, `#yutuq`;
  `#saytga_emas`, matnsiz va 80 belgidan qisqa yangilik (iqtibos, tabrik; `#sayt` bilan olinadi) — o‘tkaziladi.
  Hashtag bo‘lmasa turkum sarlavha so‘zlaridan (yutuq/natija/sertifikat → `yutuq`, e’lon/diqqat → `elon`,
  matnda tadbir/bayram → `tadbir`). Sarlavha chetidagi emoji olinadi, KATTA HARFLI sarlavha oddiy yoziladi.
  Albomli postlar ko‘p bo‘lsa sahifada 4–5 ta post turadi, shuning uchun `?before=` bilan 8 sahifagacha orqaga boriladi. Birinchi rasm `media/telegram/` ga ko‘chiriladi (Telegram havolalari
  doimiy emas). Olingan har post `telegram_posts` (channel, post_id) da qoladi — saytdan o‘chirilgan post qayta
  kelmaydi. `import_since` dan oldingi postlar olinmaydi. `?dry=1` — hech narsa yozmasdan natijani qaytaradi; `?backfill=1` — galereyasi yo‘q eski yangiliklarga rasmlarni qo‘shadi.
  Asl sifatli rasmlar: `t.me/s` faqat ~800px nusxa beradi. Admin `@BotFather` botining tokenini `/admin/telegram` da
  kiritsa (`telegram_settings.bot_token`, brauzerga qaytarilmaydi), funksiya `getUpdates` bilan asl rasmlarni
  (`telegram_media`: message_id → file_id) oladi. Bot kanalda admin bo‘lsa (`bot_status` = `ok`): yangi postlar
  `channel_post` bilan keladi, eskilari uchun admin botga /start bosadi (`bot_chat_id`) va funksiya postni o‘sha
  chatga forward qilib, rasmini olib, xabarni o‘chiradi. Admin qilib bo‘lmasa (`not_admin`; Telegram admin
  bo‘lmagan botga kanaldan forward qilishga ruxsat bermaydi) — admin postlarni botga qo‘lda forward qiladi,
  `forward_origin` (kanal + message_id) bo‘yicha moslanadi. `telegram_posts.photo_ids` (albomdagi rasm post id'lari) va `hd` — har ishga tushishda 6 tagacha
  eski yangilik rasmlari asl sifatga almashtiriladi; faqat hamma rasm yuklangandagina almashtiriladi.
  Funksiyani o‘zgartirsangiz, qayta deploy qiling (Supabase MCP `deploy_edge_function`, `verify_jwt: false`).
  Admin sahifasi: tepada 4 karta (holat, oxirgi tekshiruv va natijasi, yangilik + tadbirlar soni / o‘tkazilganlar, asl sifatli
  rasmlar); sozlamalar formasi bo‘limlarda; "Kanaldan olingan postlar" — client `PostList` (oxirgi 200 ta; turi bo‘yicha filtr,
  "Tekshirish kutilmoqda" — `auto_publish` o‘chiq bo‘lganda yashirin qo‘shilganlar, qidiruv, muqova, Telegram havolasi).
- Ro‘yxat sahifalari tepasidagi rangli raqam kartalari — umumiy `StatTiles` (`{ value, label }[]`, ranglar navbat bilan; 3 ta bo‘lsa bir qatorda):
  galereya, yangiliklar, tadbirlar, to‘garaklar, doimiy tadbirlar, xodimlar (jami, rahbariyat, o‘qituvchilar, sinf rahbarlari), dars jadvali
  (sinf, smena, fan va haftalik dars — `getTimetableTotals()`: darslar `count` bilan, fanlar — darsda asosiy fan sifatida uchraganlari).
- Xodimlar ro‘yxati (`/staff`, maketdagidek): "Jamoa" kicker, "O‘qituvchilar va xodimlar", ro‘yxatdagi soni; client
  `StaffDirectory` — ism/fan bo‘yicha qidiruv va lavozim `select`i, kompyuterda jadval (avatar-initsiallar, lavozim
  belgisi: rahbariyat ko‘k, o‘qituvchi yashil, boshqalar sariq; fan; biriktirilgan sinf — `getHomerooms()`),
  telefonda kartalar. Qator bosilsa profil ochiladi.
- Lavozimlar (`src/lib/positions.ts`): `staffPositions` — egasi bergan lavozimlar uch tilda, guruhlari bilan (`leaders`
  rahbariyat, `teachers` o‘qituvchilar, `others` xodimlar); `subjectFilters` — fan bo‘yicha filtrlar (Ona tili, Rus tili,
  Ingliz tili, Informatika, Jismoniy tarbiya; `subject_uz` da so‘z uchrasa). `/staff` da guruh tugmalari (soni bilan) va
  `StaffFilterMenu` — guruhlangan ro‘yxat (guruhning hammasi, lavozim yoki fan; soni, klaviatura bilan boshqariladi).
  `position_uz` apostrof farqisiz (`positionKey`) moslanadi; ro‘yxatda yo‘q lavozim so‘zlariga qarab guruhga qo‘shiladi
  (`positionGroup`). `position_ru/en` bo‘sh bo‘lsa tarjima ro‘yxatdan olinadi (`positionLabel`). Admin formada lavozim
  maydoni shu ro‘yxatni taklif qiladi (`TranslatedField` `suggestions`, datalist).
- Xodim profili (`/staff/[id]`, maketdagidek): chapda karta (rasm yoki initsiallar doirasi, lavozim belgisi guruh rangida,
  telefon/email belgilar bilan — faqat xodim roziligi bilan), o‘ngda toifa, ma’lumoti, ish staji, sinf rahbarligi va
  qo‘shimcha ma’lumot. Ranglar umumiy (`positions.ts`: `groupBadge`, `avatarGradient(id)` — xodimga bog‘liq, filtrda
  o‘zgarmaydi; `initials`) — ro‘yxat, profil va "Maktab haqida"dagi rahbariyat bir xil. Bo‘sh maydonlar ko‘rsatilmaydi. Rus tilidagi
  sonlar uchun `plural()` (`src/i18n/fill.ts`, `Intl.PluralRules`).
- `supabase/seed/calendar-2026-2027.sql` — egasi yuborgan rasmiy kalendardagi choraklar va ta’tillar (qo‘llangan).
- `supabase/seed/2026-2027.sql`, `supabase/seed/clubs.sql` va `supabase/seed/subjects.sql` — bir marta qo‘llangan boshlang‘ich kontent (davlat bayramlari;
  tasdiqlanmagan maktab tadbirlari va bitta yangilik qoralama holida).
- eMaktab (`school.eMaktabUrl`, https://emaktab.uz): baholar va davomat faqat u yerda — ochiq saytda
  o‘quvchilarning shaxsiy ma’lumoti (baho, davomat, ism) ko‘rsatilmaydi. Saytda faqat havola:
  `EMaktabCard` (bosh sahifa), header (xl), mobil menyu va footer.
- Faqat egasi tasdiqlagan ma’lumotni qo‘ying. Eski artifact maketidagi dars jadvallari, sinf
  bo‘yicha o‘quvchi sonlari va xodim ismlari to‘qima — ularni saytga ko‘chirmang.
- Sana/vaqt `src/lib/format.ts` orqali, `Asia/Tashkent` vaqt zonasida.
- "Mening sinfim" (`src/lib/my-class.ts`, faqat brauzerda — `localStorage.myClass`, sahifa keshi buzilmaydi, shaxsiy ma’lumot chiqmaydi):
  sinf jadvalida `MyClassButton` (⭐), bosh sahifada "Tezkor kirish" ostida `MyClassCard` — sinf tanlanmagan bo‘lsa taklif, tanlangan bo‘lsa
  bugungi darslar (smena tugagach yoki yakshanba — keyingi o‘quv kuni; hozirgi dars ajratilgan), darslar brauzerda anon client bilan o‘qiladi;
  `/timetable` da `MyClassShortcut`.
- O‘quv yillari (egasining talabi): `school_years` (start_year — 2025 = 2025–2026, students/staff/classes/graduates — faqat tasdiqlangan
  sonlar, bo‘sh bo‘lishi mumkin; summary_* — yil yakuni; is_published), admin `/admin/years`. Yil 1-sentabr – 31-avgust (`src/lib/school-years.ts`:
  `schoolYearOf`, `yearRange`, `yearLabel`). Topbar'dagi o‘quv yili — `YearSwitcher` (joriy yil + e’lon qilingan yillar; telefonda menyu
  panelining oxirida chiplar). Yil tanlansa `/[lang]/year/[start]` ochiladi: raqamlar (`StatTiles`; joriy yilda bo‘sh bo‘lsa `school.stats`),
  yil yakuni, o‘sha yilgi yangiliklar, tadbirlar, albomlar, boshqa yillar. O‘tgan yil tanlanganda (`SetSiteYear` → `sessionStorage.siteYear`,
  faqat shu tashrif) header ostida `YearBanner` chiqadi va yangiliklar/tadbirlar/galereya (`year-scope` o‘rami, elementlarda `data-year`)
  shu yil bo‘yicha CSS bilan filtrlanadi, umumiy raqamlar (`year-hide`) yashiriladi — sahifa keshi buzilmaydi.
- Sayt bo‘yicha qidiruv (`/[lang]/search`): sahifa statik — server hamma qidiriladigan narsani (sahifalar, yangiliklar, tadbirlar,
  xodimlar, to‘garaklar, doimiy tadbirlar, savol-javob, albomlar) yig‘adi, client `SiteSearch` brauzerda filtrlaydi (hamma so‘z uchrashi
  kerak, sarlavhadagisi oldinda; apostrof va ё farqsiz), turlar bo‘yicha tugmalar, `?q=` manzilda (`useSearchParams`, `Suspense` ichida).
  Kirish: header'da lupa (sm–lg va 1100px dan; 1024–1100px da ruscha sig‘maydi), telefonda menyu panelining tepasida forma, footer'da havola.

### Dizayn
- Shriftlar: Inter (`font-sans`) va sarlavhalar uchun Bricolage Grotesque (`font-display`; bosh sahifa hero va
  `PageHeader` h1; kirillcha harfi yo‘q — rus matni Inter'ga tushadi). Bosh sahifa hero matni lug‘atda (`home.heroTitle` — egasi bergan shior,
  `heroLead`, `eyebrow`/`eyebrowStarted` — sentabrda "o‘quv yili boshlandi"), tugmalar: dars jadvali va yangiliklar.
- Rang tokenlari `src/app/globals.css` `@theme` da: `navy`, `brand` (ko‘k), `teal`, `gold` (+ `-deep`,
  `-soft`), `paper`. Qorong‘i bloklar (hero, `PageHeader`, footer) — `chrome` va `tricolor-rule` utility'lari.
- Animatsiya (`globals.css`): `lift` (kartalar hover'da ko‘tariladi, `translate` bilan — `reveal`
  animatsiyasining `transform`i bilan to‘qnashmasligi uchun), `press` (tugmalar), `link-grow`
  (havola tagchizig‘i), `reveal` (scroll bilan paydo bo‘lish, faqat CSS `animation-timeline: view()`),
  `animate-fade-up` / `animate-fade-in` (hero va sarlavhalar). Karta ichidagi rasm/strelka uchun
  `group` + `group-hover:`. `prefers-reduced-motion` da hammasi o‘chadi — yangi animatsiya ham
  shu qoidaga bo‘ysunsin.
- Tadbirlar sahifasi (`/events`): tepada 4 rangli raqam kartasi (yaqinlashayotgan, shu oyda boshlanadigan — Toshkent vaqti, o‘tgan,
  bayramlar), turkum tugmalari soni bilan, tadbir nomi yoki joyi bo‘yicha qidiruv (`EventItem` `data-q`).
- Tadbirlar (`EventItem`): `<details class="acc">` akkordeon — sana plitkasi (turkum rangida), sarlavha, hafta kuni bilan
  sana va yaqinlashayotganlarda `DaysLeft` ("Bugun"/"Ertaga"/"N kundan so‘ng"; brauzerda Toshkent kuni bo‘yicha,
  serverda hech narsa chiqarmaydi). Ochilganda turkum, vaqt, joy va tavsif. `details.acc` ochilish animatsiyasi
  `globals.css` da (`::details-content`).
- Xatolar: `[lang]/error.tsx` (header/footer qoladi, uch tilda matn — client komponent, lug‘at o‘rniga ichida; "Qayta urinish" va bosh sahifa),
  `app/global-error.tsx` (layout ham buzilsa, o‘z `<html>` i bilan), `admin/(panel)/error.tsx`; 404 — `[lang]/not-found.tsx`.
- Sahifa banneri (`PageHeader`): `crumbs` — yuqoridagi sahifalar (Bosh sahifa › …), kicker, sarlavha, intro.
  Footer: brend, manzil + o‘quv yili (`currentSchoolYear()`, `school.ts`), bo‘limlar (2 ustun), aloqa; `ToTop` tugmasi.
- Tungi rejim: `html.dark` (`[lang]/layout.tsx` dagi inline skript birinchi chizishdan oldin qo‘yadi: saqlangan
  tanlov `localStorage.theme`, bo‘lmasa tizim sozlamasi; `ThemeToggle` — header'dagi quyosh/oy tugmasi). `dark:`
  klasslar ishlatilmaydi — `globals.css` da tokenlar almashtiriladi: slate shkalasi teskari, `bg-white` (text-navy
  bo‘lmasa) → `--surface`, `-soft` ranglar to‘q, `-deep` matnlar ochroq, `main` ichidagi `bg-navy` → brand. Navy
  bloklar (`.chrome`, `.site-header`) light-mode slate'ni saqlaydi; ular ichidagi oq kartalarga `surface` klassini
  bering (dropdown, mobil menyu, `LiveCard`). Til almashganda React `<html>` klassini qayta yozib `dark` ni o‘chiradi —
  `ThemeSync` (layout'da, `useLayoutEffect` + `MutationObserver`) saqlangan rejimni chizishdan oldin qaytaradi. Yangi rang (arbitrary `bg-[#…]`) qo‘shsangiz, tungi rejimda tekshiring.
  Forma maydonlari: `focus:bg-white` va brauzer autofill'i tungi rejimda `--surface` bo‘ladi (aks holda oq fonda och matn o‘qilmaydi).
  Admin panelga ta’sir qilmaydi.
- Header (`SiteHeader` + client `SiteNav`; navbar `sticky top-0`, eski iPhone Safari uchun `globals.css` da `-webkit-sticky` ham): qatorlar chetlari `edges` (egasining talabi): xl dan logo chap chetdan
  40px da, o‘ng tomoni 100rem ustungacha — menyu va tugmalar o‘ng chetga yaqin (lg da ikkala tomon 16px — ruscha sig‘ishi uchun); yuqorida topbar (md+; manzil, telefon, o‘quv yili; eMaktab faqat xl dan kichikda), ostida
  sticky navbar: Bosh sahifa · Maktab ▾ · Dars jadvali · Xodimlar · Yangiliklar · Tadbirlar ▾ (lg+ da o‘ngga,
  tugmalar yoniga surilgan — `lg:ml-auto`, egasining talabi; xl dan tugmalar yonida "eMaktab ↗" (qisqa nom, to‘liq
  nomi `title`da — ruscha 1280px da sig‘ishi uchun; menyu tugmalari `px-3`, 2xl dan `px-4`); `whitespace-nowrap`, menyuda qisqa `nav.timetableShort` —
  ruscha "Расписание уроков" sig‘maydi). Dropdown'larda
  ikonka + qisqa izoh (`navDesc` lug‘atda); hover/bosish/klaviatura bilan ochiladi, Esc, tashqariga bosish va sahifa
  o‘zgarganda yopiladi. Joriy sahifa oq "pill". Mobil — butun ekranli panel (`MobileMenu` `<details>`, guruhlar ichki
  `<details>`; ochiqligida sahifa scroll bo‘lmaydi). Til va rejim tugmalari telefonda ham header'da
  (egasining talabi); sig‘ishi uchun sm dan kichikda tugmalar ixcham, "Rasmiy sayt" yozuvi yo‘q, 375px dan tor ekranda
  faqat "14" belgisi qoladi. Header kengligini o‘zgartirsangiz, 320–414px da uch tilda tekshiring.
- Galereya (maketdagidek): sarlavha "Foto-galereya" (`gallery.title`; menyuda "Galereya"), sanasiz albom kickeri "Albom",
  bo‘sh albomda `gallery.noPhotos`; `/gallery` tepasida 3 rangli raqam kartasi (albom/rasm/video, "Maktab haqida"dagidek), o‘quv yili tugmalari (sentabrdan; bir nechta yil bo‘lsa, "Sanasiz" oxirida) va albom nomi bo‘yicha qidiruv — `CategoryFilter` (`data-cat` yil, `data-q` nom), sahifa keshi buzilmaydi; `Lightbox` tugmalari — 46px shisha doira (chegara bilan), yuqorida hisob va sarlavha. `AlbumCard` — 190px muqova (rasmsiz bo‘lsa ikonka), rasm soni, sarlavha va sana ("Sana
  ko‘rsatilmagan"); albom sahifasida intro — rasm soni, `Lightbox` to‘ri 4 ustunli, 25:18 kataklar. Bosh sahifada
  "Maktab hayotidan" — albomlardagi eng yangi 4 rasm (`Lightbox` `gridClassName`), kamida 2 ta bo‘lsa chiqadi.
- Bosh sahifa "Tezkor kirish": `LiveCard` + 4 karta (ikonka, izoh, pastda strelka doirasi), ostida `EMaktabCard`, maketdagidek.
  Undan keyin "Raqamlarda" / "Maktab hayoti" — `StatTiles` `href` bilan (bosiladigan kartalar): yangiliklar, yaqin tadbirlar,
  to‘garaklar, doimiy loyihalar.
  Bo‘limlar ingichka chiziq bilan ajratilgan, sarlavhalari `SectionHead` (`action` — o‘ngda "Barchasi" tugmasi); "Yaqin kunlardagi
  tadbirlar" — 3 ta ixcham `EventCard` (sana plitkasi, nom, sana • turkum; `/events` ga havola).
- Yangiliklar (maketdagidek): banner "Maktab hayoti" / "Yangiliklar va e’lonlar" (intro — yangiliklar soni), tepada 4 rangli raqam kartasi
  (jami, shu oyda — Toshkent vaqti, rasmlar — muqova + galereya, yutuqlar), filtr tugmalari ko‘plikda (`news.cats`, soni bilan);
  filtr/qidiruvda `CategoryFilter` o‘ramiga `data-filtered` qo‘yiladi — `featured` karta oddiy bo‘ladi (`group-data-filtered/filter:`;
  `display` ni majburlamang, aks holda yashirish qoidasini bosadi), hech narsa qolmasa `emptyLabel`. Maqola sahifasi: `PageHeader`
  (turkum, sarlavha, sana), chapda maqola kartasi + rasmlar, o‘ngda sticky "Boshqa yangiliklar" (4 ta). `NewsCard` `layout` — `card`, `featured` (yangiliklar sahifasida birinchisi), `tall` +
  `row` (bosh sahifada: katta karta chapda, ikkita ixcham qator o‘ngda). `/news` da turkum tugmalari yonida qidiruv —
  `CategoryFilter` `searchLabel`; kartadagi `data-q` (kichik harfli sarlavha) CSS `[data-q*="…" i]` bilan filtrlanadi,
  sahifa keshi buzilmaydi.

### SEO
- `src/app/sitemap.ts` — barcha ochiq sahifalar uch tilda, har birida hreflang muqobillari (yangiliklar, xodimlar, to‘garaklar, dasturlar,
  albomlar, sinflar, yillar); `robots.ts` — `/admin` yopiq. Manzil `siteUrl` (`school.ts`, `NEXT_PUBLIC_SITE_URL` — domen olinganda).
  Layout: `metadataBase`, Open Graph (sayt nomi, tavsif, locale); ulashish rasmi — `[lang]/opengraph-image.tsx` (1200×630, faqat lotin
  matni — standart shriftda kirill yo‘q). Layout'da `alternates.languages` yo‘q (har sahifani bosh sahifaga bog‘lab qo‘yardi) — hreflang sitemap'da.

### Statistika va ilova
- Vercel Web Analytics (`@vercel/analytics`, `[lang]/layout.tsx` da `<Analytics />`; cookie'siz) — Vercel loyihasining Analytics
  bo‘limida yoqilganda ishlaydi.
- PWA: `app/manifest.ts` (start `/uz`, standalone, navy tema), ikonlar — `app/app-icon/[size]` (192/512, `ImageResponse`, statik) va
  `app/apple-icon.tsx`; `src/proxy.ts` matcher'i bu yo‘llarni til yo‘naltirishidan chiqaradi. `viewport.themeColor` — navy.

### Xavfsizlik sarlavhalari
- `next.config.ts` `headers()`: nosniff, `X-Frame-Options`/`frame-ancestors 'self'`, `base-uri`/`object-src`/`form-action`, Referrer-Policy,
  Permissions-Policy, HSTS; `poweredByHeader: false`. To‘liq CSP yo‘q (tema skripti inline, xarita va YouTube iframe'lari).

### Supabase
- `src/lib/supabase/server.ts` (cookie asosida, admin panel uchun), `client.ts` (faqat Client
  Components), `public.ts` (ochiq o‘qish va aloqa formasi).
- `supabase/migrations/` — sxema uchun yagona manba; dashboard'da tahrirlamang, yangi
  migratsiya fayl qo‘shing. Qo‘llagandan keyin Supabase advisors (security + performance) ni tekshiring.
- Env (`.env.local`, commit qilinmaydi; `.env.example` ga qarang):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### Admin panel (`/admin`)
- `src/app/admin/` — alohida root layout, faqat o‘zbek tilida, `[lang]` dan tashqarida
  (UI matnlari lug‘atda emas, to‘g‘ridan-to‘g‘ri kodda). `(panel)/` route group'idagi hamma
  sahifa kirishni talab qiladi; `login/` — ochiq.
- Himoya ikki qavatli: `src/proxy.ts` `/admin/*` uchun Supabase sessiyasini yangilaydi va
  sessiyasizlarni `/admin/login` ga yuboradi; **har bir** admin sahifa va Server Action
  `requireAdmin()` (`src/lib/admin.ts`) ni chaqiradi — u foydalanuvchining `admins`
  jadvalidagi o‘z qatorini o‘qiydi (RLS faqat o‘z qatorini ko‘rsatadi). Yangi admin action yozsangiz, birinchi qatorda `requireAdmin()` bo‘lsin.
- Har bo‘lim: `actions.ts` (`save*(id | null, prev, form)`, `delete*(id)`), `*Form.tsx`,
  `page.tsx` (ro‘yxat), `new/`, `[id]/`. Saqlashdan keyin `revalidatePublic()` butun ochiq
  saytni yangilaydi, keyin `redirect`.
- `components/admin/AdminForm.tsx` action'ni `onSubmit` orqali chaqiradi (`action` prop emas),
  shuning uchun xatoda forma tozalanmaydi. Tarjima maydonlari — `TranslatedField`.
- Rasmlar brauzerdan to‘g‘ridan-to‘g‘ri `media` bucket'ga yuklanadi (`ImageUpload`, `PhotoUploader`;
  RLS: faqat admin), bazaga bucket ichidagi yo‘l (`news/<uuid>.jpg`) yoziladi. Yuklashdan oldin
  `src/lib/resize-image.ts` rasmni 1920px gacha kichraytirib JPEG qiladi (telefon rasmlari 5 MB
  limitdan katta bo‘ladi; HEIC ham shu yo‘l bilan o‘tadi, agar brauzer o‘qiy olsa).
- Rejalashtirilgan yangilik: e’lon qilingan, lekin `published_at` kelajakda bo‘lsa, RLS (`read published news`) uni vaqti kelguncha
  yashiradi (rasm/videolari ham — ularning siyosati yangilik ko‘rinishiga bog‘liq); sahifalar 5 daqiqada yangilanadi, cron kerak emas.
  Admin ro‘yxatida "🕒 Rejalashtirilgan" va chiqish vaqti, holat filtrida alohida.
- Yangilik galereyasi: yangilikni tahrirlash sahifasida `PhotoUploader` (`news/<id>/` ga yuklaydi) va `PhotoManager`
  (tartib sudrab/←→, `reorderNewsPhotos`; muqova alohida — formadagi `cover_image`, shuning uchun `setCover` berilmaydi); yangi
  yangilik saqlangach tahrirlash sahifasiga o‘tiladi. Ochiq sahifada matndan keyin `Lightbox`, keyin videolar (`news_videos`,
  galereya videolari kabi). Telegram'dan kelgan postning 1-rasmi muqova, qolganlari (12 tagacha) galereya. Admin ro‘yxati —
  client `NewsList`: qidiruv, turkum tugmalari (soni bilan), holat filtri; qatorda muqova, turkum, sana, 📷/🎬, Telegram belgisi.
- Admin bosh sahifasi (`(panel)/page.tsx`): 8 statistika kartasi, tezkor tugmalar (+ Yangilik/Tadbir/Albom), "E’tibor talab qiladi" —
  bo‘limlardagi kamchiliklar filtrlarining yig‘indisi (o‘qilmagan xabar, yashirin yangilik, jadvalda bog‘lanmagan o‘qituvchi ismi,
  sinf rahbarisiz sinf, eMaktab nomisiz o‘qituvchi, rasmsiz xodim, tarjimasiz fan/sahifa, vaqtsiz to‘garak, bo‘sh albom, Telegram
  xatosi; faqat 0 dan kattalari, har biri bo‘limga havola), yaqin tadbirlar, so‘nggi xabarlar va yangiliklar. Bo‘limga yangi
  kamchilik filtri qo‘shsangiz, shu ro‘yxatga ham qo‘shing.
- Admin menyusi — client `AdminNav` (`components/admin/AdminNav.tsx`; `(panel)/layout.tsx` faqat nishon sonlarini o‘qiydi): bo‘limlar
  guruhlarda (Kontent, Maktab, Murojaatlar, Tizim) ikonka bilan, joriy sahifa oltin chiziq bilan ajratiladi, o‘qilmaganlar — oltin nishon.
  md+ — navy `sticky` yon panel (pastda "Saytni ko‘rish" va chiqish). Telefonda: yuqorida navy qator (logo, sahifa nomi, menyu tugmasi),
  o‘ngdan chiqadigan to‘liq menyu (`openOn` — ochilgan sahifa; boshqa sahifaga o‘tilsa yopiladi, Esc, orqa fon scroll bo‘lmaydi) va
  pastki panel (Asosiy, Yangiliklar, Murojaatlar — xabar/ishonch/ariza yig‘indisi bilan, Tashriflar, Menyu); `main` pastdan `pb-28`.
  Yangi bo‘lim qo‘shsangiz, `groups` ga yozing. Kirish sahifasi navy fonda. Bosh sahifa kartalari telefonda 2 ustun.
- Faoliyat jurnali (`/admin/activity`, `audit_log`): kontent jadvallaridagi (yangilik, tadbir, xodim, to‘garak, albom, dastur, sahifa,
  hujjat, taqvim, yutuq, test, sinf, fan, o‘quv yili, qabul arizasi, Telegram sozlamalari) har insert/update/delete'ni `private.log_change()`
  trigger'i yozadi — kim (`auth.uid()` + email), qaysi yozuv (`row_ref`, `label`), qaysi ustunlar o‘zgargani (qiymatlar emas — token
  jurnalga tushmaydi). Faqat tizimga kirgan foydalanuvchi o‘zgarishlari (Telegram sync yozilmaydi); faqat `sort_order` o‘zgargan
  (sudrab tartiblash) va bo‘sh update yozilmaydi. RLS: faqat admin o‘qiydi, API orqali yozib/o‘chirib bo‘lmaydi. Yangi kontent jadvali
  qo‘shsangiz, unga ham `<jadval>_audit` trigger'ini va sahifadagi `sections` xaritasiga yozing.
- Kirishlar jurnali (`/admin/logins`, `admin_logins`): har kirish, noto‘g‘ri urinish va chiqish — email, vaqt, IP, joy (Vercel
  `x-vercel-ip-city`/`-country-region`/`-country` sarlavhalari; O‘zbekiston viloyat kodlari nomga aylantiriladi), qurilma
  (`describeDevice`, `src/lib/login-log.ts`). `login/actions.ts` yozadi (`logAdminLogin`, xato bo‘lsa ham kirishni to‘xtatmaydi);
  `admins` da yo‘q hisob kirsa — `not_admin` deb yoziladi va darhol chiqariladi. Insert siyosati: `failed` ni hamma yoza oladi,
  `login`/`logout` ni faqat o‘sha adminning o‘z sessiyasi (uid + jwt email + `is_admin`) — soxta kirish yozib bo‘lmaydi. Trigger
  vaqtni server vaqti qiladi, `failed` ni 10 daqiqada 30 tagacha cheklaydi, 1 yildan eskisini o‘chiradi; `private.notify_admin_login` —
  har kirishda va bir email'ga 15 daqiqada 5/10-noto‘g‘ri urinishda Telegram (`telegram_settings.notify_logins`, sahifadagi tugma).
  Sahifada: 4 karta, qidiruv, hisob/tur filtri, "Yangi qurilma" belgisi. Bosh sahifada "Oldingi kirishingiz" va 24 soatdagi
  noto‘g‘ri urinishlar "E’tibor talab qiladi"da.
- Tashriflar (`/admin/visits`, `site_visits`): ochiq saytdagi sahifa ko‘rishlar. `VisitBeacon` (`[lang]/layout.tsx`, client) har sahifada
  `/api/visit` ga yuboradi: yo‘l, anonim brauzer id (`localStorage.vid`), tashrif id (`sessionStorage.sid`), tashrifning 1-sahifasida
  kelgan sayt hosti. DNT/GPC yoqilgan bo‘lsa yubormaydi. Route handler botlarni o‘tkazib yuboradi, joy (Vercel geo) va qurilmani
  (`requestOrigin`, `login-log.ts`) qo‘shadi; IP, ism, cookie saqlanmaydi. Trigger: server vaqti, bir tashrifga daqiqada 60, soatiga jami
  3000 dan oshsa jimgina tashlanadi, 1 yildan eskisi o‘chadi. Hisoblar bazada — `public.visit_stats(p_days)` (security invoker,
  faqat `authenticated`ga; API 1000 qatordan ko‘p bermaydi). Sahifa: davr (bugun/7/30/90), 4 karta (hozir saytda — 5 daqiqa),
  kunlik ustunlar, sahifalar, joylar (`src/lib/geo.ts` — `placeName`, `flagOf`), manbalar, qurilmalar, so‘nggi 60 ta tashrif.
  Admin bosh sahifasida bugungi tashrifchilar. Adminning o‘zi hisoblanmaydi (egasining talabi): admin panel ochilgan brauzerda
  `ExcludeDevice` (`(panel)/layout.tsx`) `localStorage.noTrack` qo‘yadi va shu brauzerning oldingi tashriflarini o‘chiradi
  (`forgetAdminDevice`, `vid` bo‘yicha); `VisitBeacon` `noTrack` bo‘lsa yubormaydi; `/api/visit` Supabase sessiyasi bor so‘rovni ham yozmaydi.
- Excel eksport: `/admin/export/applications` va `/admin/export/messages` (route handler, `requireAdmin()`; `write-excel-file/node` —
  npm `xlsx` zaif). Sana Toshkent vaqtida matn ("2026-09-25 10:00"), 1-qator qotirilgan. Tugma — `AdminHeader` `download`. Ishonch
  qutisi ataylab eksport qilinmaydi (maxfiy).
- Xabarlar admini: client `MessageList` — "Yangi" / "O‘qilgan" / "Hammasi" yorliqlari, mavzu tugmalari, qidiruv (ism, telefon,
  email, matn), "Hammasini o‘qildi deb belgilash" (`markAllRead`); uzun xabar qisqartiriladi, telefon/email — bosiladigan tugmalar.
  Tepada `NotifyCard` — yangi xabar Telegram'ga: `contact_messages` insert trigger'i (`private.notify_contact_message`, pg_net)
  sayt boti orqali `bot_chat_id` ga yuboradi (mavzu, ism, telefon, email, matn — admin havolasisiz, egasining talabi), `telegram_settings.notify_messages` bilan yoqiladi; token bazadan chiqmaydi, xato bo‘lsa
  xabar baribir saqlanadi. Kartada: bot ulanmagan bo‘lsa — Telegram bo‘limiga havola, Start bosilmagan bo‘lsa — bot havolasi va
  "Tekshirish" (`runTelegramSync`), keyin "Yoqish/O‘chirish" va "Sinov xabari". Telegram API yordamchilari — `src/lib/telegram-bot.ts`.
- Galereya: albom yaratilgach rasm qo‘shish sahifasiga o‘tiladi; rasm/albom o‘chirilganda
  Storage'dagi fayllar ham o‘chiriladi (`gallery/actions.ts`). Admin ro‘yxati — muqovali kartalar (sana bo‘yicha, saytdagidek;
  albomlarni qo‘lda tartiblash yo‘q). Albom sahifasida `PhotoManager` (`components/admin`): rasmlar tartibi sudrab yoki ←→ bilan (`reorderPhotos`,
  darhol saqlanadi), muqova tanlash, o‘chirish. Videolar — `gallery_videos` (`video` fayl `media/gallery/<id>/` da yoki `youtube` id;
  `gallery_photos` dan alohida, chunki rasmlar Lightbox/sanoq/bosh sahifada ishlatiladi). Umumiy: `VideoUploader`, `YoutubeForm`,
  admin `VideoList`, ochiq `VideoGrid` (to‘garaklar bilan bir xil), forma bo‘limlari — `FormSection` (`fields.tsx`), `youtubeId` — `media.ts`.
- Tadbirlar admini: client `EventList` — "Yaqinlashayotgan" (eng yaqini birinchi) / "O‘tgan" / "Hammasi" yorliqlari, qidiruv
  (nom/joy), turkum tugmalari; qatorda sana plitkasi, vaqt yoki "Butun kun", joy, Telegram belgisi. Formada sana va vaqt alohida
  (`start_date`, `start_time`, `end_time`, ixtiyoriy `end_date`); "Butun kun" belgilansa vaqt maydonlari CSS bilan yashiriladi
  (`group-has-[#all-day:checked]`). Tadbirlarda rasm/video yo‘q (saytda akkordeon).
- Sahifalar admini: `pages/info.ts` (`pageInfo` — sahifa saytda qayerda chiqadi va sarlavhasi nima uchun ishlatiladi:
  "Maktab haqida"da banner kickeri, "Qabul"da h1). Kartada har til bo‘yicha matn bor/yo‘q, oxirgi tahrir; tahrirlash sahifasida
  uch tildagi sayt havolalari va tarjimasi yo‘q tillar haqida ogohlantirish. Yangi tahrirlanadigan sahifa qo‘shsangiz, `pageInfo` ga ham yozing.
- `datetime-local` qiymatlari Toshkent vaqti sifatida o‘qiladi/yoziladi
  (`toTashkentInput` / `fromTashkentInput`).
- Yangi admin qo‘shish: Supabase Dashboard → Authentication → Add user, keyin SQL:
  `insert into public.admins (user_id) values ('<uuid>');`. Dashboard'da ochiq ro‘yxatdan
  o‘tishni (signups) o‘chirib qo‘ying — RLS baribir himoya qiladi, lekin keraksiz hisoblar ochilmaydi.
- `next.config.ts` rasm domenini `NEXT_PUBLIC_SUPABASE_URL` dan oladi; `localhost` bo‘lsa
  mahalliy Supabase uchun `dangerouslyAllowLocalIP` yoqiladi.

### Ma’lumotlar modeli
Tarjima qilinadigan maydonlar har bir til uchun alohida ustunda: `title_uz`, `title_ru`,
`title_en` (va `body_*`). Tanlangan tilda bo‘sh bo‘lsa, `_uz` ko‘rsatiladi.
- `admins` (user_id) — kontent yozishi mumkin bo‘lgan Auth foydalanuvchilari; qo‘lda qo‘shiladi
- `news` (slug, title_*, body_*, cover_image, published_at, is_published); `news_photos` (news_id, path,
  sort_order) — yangilik galereyasi (RLS'da yangilikka bog‘liq, albom rasmlari kabi); `news_videos` (news_id, kind `video`|`youtube`, path, sort_order)
- `events` (title_*, description_*, location, starts_at, ends_at, is_published)
- `staff` (full_name, short_name, position_*, subject_*, photo, category_*, education_*, experience_years,
  phone, email, bio_*, sort_order, is_published)
- `subjects` (name_*, sort_order), `school_classes` (grade, letter, homeroom_teacher_id,
  is_published), `lessons` (class_id, weekday, period, subject_id, teacher, alt_subject_id, alt_teacher)
- `clubs` (name_*, description_*, schedule_*, place_*, grade_from/to, leader, leader_id, days, start_time, end_time, photo,
  sort_order, is_published); `club_media` (club_id, kind, path, sort_order)
- `gallery_albums` (title_*, description_*, event_date, cover_photo, is_published); `gallery_photos` (album_id, path,
  sort_order); `gallery_videos` (album_id, kind `video`|`youtube`, path, sort_order)
- `programs` (slug, name_*, summary_*, description_*, schedule_*, place_*, keyword, cover, sort_order, is_published);
  `program_media` (program_id, kind `photo`|`video`|`youtube`, path, sort_order); `league_tables` (program_id, stage, title, as_of, rows)
- `pages` (slug, title_*, body_*) — "Maktab haqida", "Qabul" kabi tahrirlanadigan sahifalar
- `achievements` (title_*, field, level, place, result_*, winner, names, names_consent, teacher_id, achieved_on, photo,
  is_published)
- `calendar_periods` (kind, title_*, note_*, starts_on, ends_on, is_published)
- `tests` (title_*, description_*, subject, kind `mavzu`|`dtm`, grade, time_limit, sort_order, is_published); `test_questions` (test_id,
  question, options text[], correct — 0 dan, explanation, image, sort_order) — `correct`/`explanation` anon'ga yopiq
- `documents` (title_*, description_*, category, kind `file`|`link`, path, url, file_type, file_size, doc_date,
  sort_order, is_published)
- `site_visits` (at, path, lang, visitor, session, referrer, city, region, country, device, mobile)
- `admin_logins` (at, event `login`|`failed`|`logout`, user_id, email, reason, ip, city, region, country, device, user_agent)
- `audit_log` (at, user_id, email, table_name, row_ref, action, label, changed) — faqat trigger yozadi
- `contact_messages` (name, email, phone, topic, message, is_read, created_at); `trust_messages` (topic, message, contact,
  is_read); `admission_applications` (child_name, child_birth_date, grade, parent_name, phone, address, previous_school, note,
  status, admin_note)

### Xavfsizlik modeli
Har bir jadvalda Row Level Security yoqilgan. Admin tekshiruvi `private.is_admin()` funksiyasi
orqali (`admins` jadvalida `auth.uid()` bormi). Anonim foydalanuvchilar faqat `is_published`
yozuvlarni o‘qiydi va faqat `contact_messages` ga yozadi; qolganiga faqat adminlar yozadi.
`private.is_admin()` `anon` roliga ham ochiq bo‘lishi shart — o‘qish siyosatlari uni chaqiradi.
U `SECURITY DEFINER`, shuning uchun API'ga chiqmaydigan `private` sxemasida turadi (Supabase
advisors talabi). Har bir jadval va amal uchun bitta siyosat: `for all` ishlatmang, aks holda
SELECT'da ikkita permissive siyosat bo‘ladi.
Rasmlar va videolar `media` Storage bucket'ida (JPEG/PNG/WebP va MP4/WebM/MOV, 50 MB gacha; rasmlar brauzerda kichraytiriladi):
hamma o‘qiydi, faqat admin yuklaydi.
