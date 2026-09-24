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
- Vercel'ga joylanadi

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
- "Maktab haqida" va "Qabul" — `pages` jadvalidan (`CmsPage` komponenti).
- Aloqa formasi: `[lang]/contact/actions.ts` Server Action `contact_messages` ga yozadi
  (honeypot `website` maydoni bor; telefon yoki email majburiy). Action kiritilgan qiymatlarni
  qaytaradi — React 19 action'dan keyin formani tozalaydi, shuning uchun `defaultValue` kerak.
- Maktab faktlari `src/lib/school.ts` da: manzil, telefon, ish vaqti (tarjima qilinadiganlari
  `Record<Locale, string>`), raqamlar (o‘quvchi/xodim/sinf). `null` = "tez orada". Sinflar soni bosh sahifada
  `school_classes` dan hisoblanadi (YT — yakka tartibdagi sinflar qo‘shilmaydi).
- Qo‘ng‘iroqlar: `src/lib/bells.ts` — 2 smena (08:00: 1,2,5,9,10,11-sinf; 13:00: 3,4,6,7,8-sinf),
  dars 45 daq, tanaffus 5 daq. `/schedule` sahifasi va `LiveCard` ("Hozir maktabda", client
  komponent, Toshkent vaqtini brauzerda hisoblaydi — sahifa keshlangani uchun serverda emas) shundan foydalanadi.
- Lug‘at satrlaridagi `{n}` kabi joylar `fill()` (`src/i18n/fill.ts`) bilan to‘ldiriladi.
- Savol-javob (`/faq`) matnlari lug‘atda (`faq.items`).
- Turkumlar (`src/lib/categories.ts`): yangilik — `yangilik|elon|tadbir|yutuq`, tadbir —
  `bayram|maktab|olimpiada|sport` (DB `check` bilan bir xil; nomlari lug‘atda `newsCats`/`eventCats`).
  Ro‘yxatlarda `CategoryFilter` — server render qilingan elementlarni `data-cat` bo‘yicha CSS bilan
  yashiradi, shuning uchun sahifa keshlanishi buzilmaydi.
- `events.all_day` — bayramlar kabi vaqtsiz tadbirlar Toshkent vaqti 00:00–23:59 sifatida saqlanadi
  (yaqinlashayotgan/o‘tgan ajratish kun davomida to‘g‘ri ishlashi uchun), saytda faqat sana chiqadi.
- To‘garaklar (`/clubs`, `clubs` jadvali) va galereya (`/gallery`, `gallery_albums` +
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
  `useSyncExternalStore` bilan o‘qiladi, sahifa keshi buzilmaydi), `/timetable/[id]` — `ClassTimetableView`
  ("Kunlik": kun tanlash + vaqt chizig‘i, "Haftalik": jadval; "bugun"/"hozir" brauzerda Toshkent vaqti bo‘yicha).
  Ishlatilayotgan fanni o‘chirib bo‘lmaydi (`on delete restrict`). Admin tahriri — 6×6 `select` jadvali,
  saqlashda to‘ldirilganlar upsert, bo‘shatilganlar o‘chiriladi (`classes/actions.ts`).
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
- Xodim profili (`/staff/[id]`): toifa, ma’lumoti, ish staji, telefon/email (faqat xodim roziligi
  bilan), qo‘shimcha ma’lumot va sinf rahbarligi. Bo‘sh maydonlar ko‘rsatilmaydi. Rus tilidagi
  sonlar uchun `plural()` (`src/i18n/fill.ts`, `Intl.PluralRules`).
- `supabase/seed/2026-2027.sql`, `supabase/seed/clubs.sql` va `supabase/seed/subjects.sql` — bir marta qo‘llangan boshlang‘ich kontent (davlat bayramlari;
  tasdiqlanmagan maktab tadbirlari va bitta yangilik qoralama holida).
- eMaktab (`school.eMaktabUrl`, https://emaktab.uz): baholar va davomat faqat u yerda — ochiq saytda
  o‘quvchilarning shaxsiy ma’lumoti (baho, davomat, ism) ko‘rsatilmaydi. Saytda faqat havola:
  `EMaktabCard` (bosh sahifa), header (xl), mobil menyu va footer.
- Faqat egasi tasdiqlagan ma’lumotni qo‘ying. Eski artifact maketidagi dars jadvallari, sinf
  bo‘yicha o‘quvchi sonlari va xodim ismlari to‘qima — ularni saytga ko‘chirmang.
- Sana/vaqt `src/lib/format.ts` orqali, `Asia/Tashkent` vaqt zonasida.

### Dizayn
- Shriftlar: Inter (`font-sans`) va sarlavhalar uchun Bricolage Grotesque (`font-display`; bosh sahifa hero va
  `PageHeader` h1; kirillcha harfi yo‘q — rus matni Inter'ga tushadi). Bosh sahifa hero matni lug‘atda (`home.heroTitle`,
  `heroLead`, `eyebrow`/`eyebrowStarted` — sentabrda "o‘quv yili boshlandi"), tugmalar: dars jadvali va yangiliklar.
- Rang tokenlari `src/app/globals.css` `@theme` da: `navy`, `brand` (ko‘k), `teal`, `gold` (+ `-deep`,
  `-soft`), `paper`. Qorong‘i bloklar (hero, `PageHeader`, footer) — `chrome` va `tricolor-rule` utility'lari.
- Animatsiya (`globals.css`): `lift` (kartalar hover'da ko‘tariladi, `translate` bilan — `reveal`
  animatsiyasining `transform`i bilan to‘qnashmasligi uchun), `press` (tugmalar), `link-grow`
  (havola tagchizig‘i), `reveal` (scroll bilan paydo bo‘lish, faqat CSS `animation-timeline: view()`),
  `animate-fade-up` / `animate-fade-in` (hero va sarlavhalar). Karta ichidagi rasm/strelka uchun
  `group` + `group-hover:`. `prefers-reduced-motion` da hammasi o‘chadi — yangi animatsiya ham
  shu qoidaga bo‘ysunsin.
- Tadbirlar (`EventItem`): `<details class="acc">` akkordeon — sana plitkasi (turkum rangida), sarlavha, hafta kuni bilan
  sana va yaqinlashayotganlarda `DaysLeft` ("Bugun"/"Ertaga"/"N kundan so‘ng"; brauzerda Toshkent kuni bo‘yicha,
  serverda hech narsa chiqarmaydi). Ochilganda turkum, vaqt, joy va tavsif. `details.acc` ochilish animatsiyasi
  `globals.css` da (`::details-content`).
- Sahifa banneri (`PageHeader`): `crumbs` — yuqoridagi sahifalar (Bosh sahifa › …), kicker, sarlavha, intro.
  Footer: brend, manzil + o‘quv yili (`currentSchoolYear()`, `school.ts`), bo‘limlar (2 ustun), aloqa; `ToTop` tugmasi.
- Tungi rejim: `html.dark` (`[lang]/layout.tsx` dagi inline skript birinchi chizishdan oldin qo‘yadi: saqlangan
  tanlov `localStorage.theme`, bo‘lmasa tizim sozlamasi; `ThemeToggle` — header'dagi quyosh/oy tugmasi). `dark:`
  klasslar ishlatilmaydi — `globals.css` da tokenlar almashtiriladi: slate shkalasi teskari, `bg-white` (text-navy
  bo‘lmasa) → `--surface`, `-soft` ranglar to‘q, `-deep` matnlar ochroq, `main` ichidagi `bg-navy` → brand. Navy
  bloklar (`.chrome`, `.site-header`) light-mode slate'ni saqlaydi; ular ichidagi oq kartalarga `surface` klassini
  bering (dropdown, mobil menyu, `LiveCard`). Yangi rang (arbitrary `bg-[#…]`) qo‘shsangiz, tungi rejimda tekshiring.
  Admin panelga ta’sir qilmaydi.
- Header (`SiteHeader` + client `SiteNav`): yuqorida topbar (md+; manzil, telefon, o‘quv yili, eMaktab), ostida
  sticky navbar: Bosh sahifa · Maktab ▾ · Dars jadvali · O‘qituvchilar · Yangiliklar · Tadbirlar ▾. Dropdown'larda
  ikonka + qisqa izoh (`navDesc` lug‘atda); hover/bosish/klaviatura bilan ochiladi, Esc, tashqariga bosish va sahifa
  o‘zgarganda yopiladi. Joriy sahifa oq "pill". Mobil — butun ekranli panel (`MobileMenu` `<details>`, guruhlar ichki
  `<details>`; ochiqligida sahifa scroll bo‘lmaydi). Telefonda (sm dan kichik) til va rejim tugmalari header'da emas,
  menyu panelining tepasida — rus/ingliz nomlari uzun, header'ga sig‘maydi (menyu tugmasi ekrandan chiqib ketardi).
- Bosh sahifa "Tezkor kirish": `LiveCard` + 4 karta (ikonka, izoh, pastda strelka doirasi), maketdagidek.

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
- Yangilik galereyasi: yangilikni tahrirlash sahifasida `PhotoUploader` (`news/<id>/` ga yuklaydi); yangi
  yangilik saqlangach tahrirlash sahifasiga o‘tiladi. Ochiq sahifada matndan keyin `Lightbox`. Telegram'dan
  kelgan postning 1-rasmi muqova, qolganlari (12 tagacha) galereya.
- Galereya: albom yaratilgach rasm qo‘shish sahifasiga o‘tiladi; rasm/albom o‘chirilganda
  Storage'dagi fayllar ham o‘chiriladi (`gallery/actions.ts`).
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
  sort_order) — yangilik galereyasi (RLS'da yangilikka bog‘liq, albom rasmlari kabi)
- `events` (title_*, description_*, location, starts_at, ends_at, is_published)
- `staff` (full_name, short_name, position_*, subject_*, photo, category_*, education_*, experience_years,
  phone, email, bio_*, sort_order, is_published)
- `subjects` (name_*, sort_order), `school_classes` (grade, letter, homeroom_teacher_id,
  is_published), `lessons` (class_id, weekday, period, subject_id, teacher, alt_subject_id, alt_teacher)
- `pages` (slug, title_*, body_*) — "Maktab haqida", "Qabul" kabi tahrirlanadigan sahifalar
- `contact_messages` (name, email, phone, message, is_read, created_at)

### Xavfsizlik modeli
Har bir jadvalda Row Level Security yoqilgan. Admin tekshiruvi `private.is_admin()` funksiyasi
orqali (`admins` jadvalida `auth.uid()` bormi). Anonim foydalanuvchilar faqat `is_published`
yozuvlarni o‘qiydi va faqat `contact_messages` ga yozadi; qolganiga faqat adminlar yozadi.
`private.is_admin()` `anon` roliga ham ochiq bo‘lishi shart — o‘qish siyosatlari uni chaqiradi.
U `SECURITY DEFINER`, shuning uchun API'ga chiqmaydigan `private` sxemasida turadi (Supabase
advisors talabi). Har bir jadval va amal uchun bitta siyosat: `for all` ishlatmang, aks holda
SELECT'da ikkita permissive siyosat bo‘ladi.
Rasmlar `media` Storage bucket'ida (JPEG/PNG/WebP, 5 MB gacha): hamma o‘qiydi, faqat admin yuklaydi.
