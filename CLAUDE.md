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
- Supabase: Postgres, Auth (admin kirishi), Storage (rasmlar). Sxema tayyor, lekin Supabase
  loyihasi hali yaratilmagan (egasi alohida tashkilot ochmoqda; mintaqa: Frankfurt `eu-central-1`)
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

### Supabase
- `src/lib/supabase/server.ts` (Server Components/Actions, cookie asosida, `server-only`) va
  `client.ts` (faqat Client Components). Imkon qadar server client'dan foydalaning.
- `supabase/migrations/` — sxema uchun yagona manba; dashboard'da tahrirlamang, yangi
  migratsiya fayl qo‘shing.
- Env (`.env.local`, commit qilinmaydi; `.env.example` ga qarang):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### Rejadagi qismlar (hali yaratilmagan)
- `src/app/[lang]/admin/` — admin panel; `src/proxy.ts` Supabase sessiyasini ham yangilab,
  sessiya bo‘lmasa `/[lang]/admin/login` ga yo‘naltiradi.
- O‘zgartirishlar client'dagi Supabase chaqiruvlari orqali emas, `admin/**/actions.ts` dagi
  Server Actions orqali bajariladi.

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
Har bir jadvalda Row Level Security yoqilgan. Admin tekshiruvi `public.is_admin()` funksiyasi
orqali (`admins` jadvalida `auth.uid()` bormi). Anonim foydalanuvchilar faqat `is_published`
yozuvlarni o‘qiydi va faqat `contact_messages` ga yozadi; qolganiga faqat adminlar yozadi.
`is_admin()` `anon` roliga ham ochiq bo‘lishi shart — o‘qish siyosatlari uni chaqiradi.
Rasmlar `media` Storage bucket'ida (JPEG/PNG/WebP, 5 MB gacha): hamma o‘qiydi, faqat admin yuklaydi.
