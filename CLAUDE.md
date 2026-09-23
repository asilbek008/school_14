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
  `Record<Locale, string>`), raqamlar (o‘quvchi/xodim/sinf). `null` = "tez orada".
- Qo‘ng‘iroqlar: `src/lib/bells.ts` — 2 smena (08:00: 1,2,5,9,10,11-sinf; 13:00: 3,4,6,7,8-sinf),
  dars 45 daq, tanaffus 5 daq. `/schedule` sahifasi va `LiveCard` ("Hozir maktabda", client
  komponent, Toshkent vaqtini brauzerda hisoblaydi — sahifa keshlangani uchun serverda emas) shundan foydalanadi.
- Lug‘at satrlaridagi `{n}` kabi joylar `fill()` (`src/i18n/fill.ts`) bilan to‘ldiriladi.
- Savol-javob (`/faq`) matnlari lug‘atda (`faq.items`).
- Faqat egasi tasdiqlagan ma’lumotni qo‘ying. Eski artifact maketidagi dars jadvallari, sinf
  bo‘yicha o‘quvchi sonlari va xodim ismlari to‘qima — ularni saytga ko‘chirmang.
- Sana/vaqt `src/lib/format.ts` orqali, `Asia/Tashkent` vaqt zonasida.

### Dizayn
- Rang tokenlari `src/app/globals.css` `@theme` da: `navy`, `brand` (ko‘k), `teal`, `gold` (+ `-deep`,
  `-soft`), `paper`. Qorong‘i bloklar (hero, `PageHeader`, footer) — `chrome` va `tricolor-rule` utility'lari.
- Header: ochiq menyu + "Maktab ▾" dropdown (hover va `:focus-visible` bilan, JS'siz); mobil — `<details>`.

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
- Rasmlar brauzerdan to‘g‘ridan-to‘g‘ri `media` bucket'ga yuklanadi (`ImageUpload`, RLS: faqat
  admin), bazaga bucket ichidagi yo‘l (`news/<uuid>.png`) yoziladi.
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
- `news` (slug, title_*, body_*, cover_image, published_at, is_published)
- `events` (title_*, description_*, location, starts_at, ends_at, is_published)
- `staff` (full_name, position_*, subject_*, photo, sort_order, is_published)
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
