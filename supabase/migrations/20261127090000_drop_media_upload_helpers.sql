-- Rasmlar 1440px ga qayta qurilganda ishlatilgan vaqtinchalik yordamchilarni olib tashlaydi.
--
-- Saytdagi 222 rasm 800px'dan 1440px'ga qayta qurilib bucket'ga yuklandi. Yuklash uchun
-- vaqtinchalik `media-upload` Edge Function ishlatilgan: u tokenni shu jadvaldan tekshirgan,
-- shuning uchun token repoga ham, env'ga ham tushmagan. Funksiyaning o‘zi ishdan keyin
-- JWT talab qiladigan 410 ga aylantirilgan, bu yerda esa qolgan uchta narsa o‘chiriladi:
-- token jadvali, uni tekshirgan RPC va yo‘llarni almashtirish uchun tuzilgan xarita.
drop function if exists public.media_upload_ok(text);
drop table if exists private.media_tokens;
drop table if exists private.media_rename;
