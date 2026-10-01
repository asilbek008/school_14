# 14-maktab — Android ilovasi (Play Store)

Bu papkadagi loyiha saytning o'zini ilovaga aylantiradi. Ichida alohida dastur yo'q: ilova ochilganda
**https://qiziriq14maktab.vercel.app** ning o'zi ko'rinadi, Chrome dvigatelida, lekin brauzer manzil
qatorisiz — ya'ni oddiy ilovaga o'xshaydi. Texnik nomi **TWA** (Trusted Web Activity).

Buning ma'nosi: saytda nima ishlasa, ilovada ham ishlaydi. Saytni yangilasak, ilova ham yangilanadi —
Play Store'ga qayta yuklash shart emas. Faqat ilovaning o'z ko'rinishi (nomi, ikonkasi, versiyasi)
o'zgarsa, yangi versiya yuklanadi.

---

## 1. Imzo kaliti (bir marta, eng muhim qadam)

Play Store har bir ilovani imzo kaliti bilan taniydi. **Kalitni yo'qotsangiz, ilovani boshqa hech qachon
yangilay olmaysiz** — yangi nom bilan qaytadan chiqarishga to'g'ri keladi. Shuning uchun kalitni va
parolini ishonchli joyda saqlang (masalan maktabning seyfi va parol menejeri).

Kompyuterda (Java o'rnatilgan bo'lishi kerak):

```bash
keytool -genkeypair -v \
  -keystore maktab14.jks \
  -alias maktab14 \
  -keyalg RSA -keysize 4096 -validity 10000
```

So'raladigan parolni o'ylab topasiz va yozib qo'yasiz. Ism-familiya o'rniga maktab nomini yozsangiz bo'ladi.

Kalitning barmoq izini ko'rish:

```bash
keytool -list -v -keystore maktab14.jks -alias maktab14 | grep -A1 "SHA256:"
```

`AB:CD:12:...` ko'rinishidagi 32 ta juftlikni nusxalang — 3-qadamda kerak bo'ladi.

---

## 2. Ilovani yig'ish

### Yo'l A — GitHub o'zi yig'adi (tavsiya etiladi, kompyuterga hech narsa o'rnatilmaydi)

GitHub'da repozitoriy → **Settings → Secrets and variables → Actions** → to'rtta secret qo'shing:

| Secret | Qiymati |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 maktab14.jks` buyrug'ining natijasi |
| `ANDROID_STORE_PASSWORD` | kalit ombori paroli |
| `ANDROID_KEY_ALIAS` | `maktab14` |
| `ANDROID_KEY_PASSWORD` | kalit paroli |

Keyin **Actions → Android → Run workflow**. Bir necha daqiqada tayyor fayl chiqadi: uni
**Artifacts → maktab14-app** dan yuklab olasiz. Ichida `app-release.aab` — Play Store shuni so'raydi.

Secret'lar qo'shilmagan bo'lsa ham ish oqimi ishlaydi: imzosiz **debug APK** chiqaradi, uni telefonga
o'rnatib sinab ko'rish mumkin (Play Store'ga yaramaydi).

### Yo'l B — Android Studio

Bu papkani Android Studio'da oching (`File → Open` → `android`), `keystore.properties.example` dan nusxa
olib `keystore.properties` qiling va to'ldiring, so'ng `Build → Generate Signed App Bundle`.

---

## 3. Saytni ilova bilan bog'lash (manzil qatorini yo'qotish uchun)

Bu qadamsiz ilova ochilganda tepada brauzer manzil qatori ko'rinib turadi — chiroyli emas.

Vercel → loyiha → **Settings → Environment Variables** → yangi o'zgaruvchi:

- Nomi: `ANDROID_CERT_SHA256`
- Qiymati: 1-qadamdagi `SHA256:` barmoq izi (masalan `AB:CD:...:9F`)

Keyin loyihani qayta deploy qiling. Tekshirish:
https://qiziriq14maktab.vercel.app/.well-known/assetlinks.json — bo'sh `[]` emas, ichida barmoq iz
ko'rinishi kerak.

**Diqqat — Play App Signing.** Play Store odatda ilovani o'z kaliti bilan qayta imzolaydi. U holda
Play Console → **Setup → App integrity** bo'limida **ikkita** barmoq iz bo'ladi: "App signing key" va
"Upload key". Ikkalasini ham vergul bilan ajratib `ANDROID_CERT_SHA256` ga yozing:

```
AA:BB:...:11, CC:DD:...:22
```

---

## 4. Play Console

1. https://play.google.com/console — dasturchi hisobi ochiladi (bir martalik to'lov).
   Hisobni **tashkilot** nomidan ochish maqsadga muvofiq: shaxsiy hisoblar uchun Google qo'shimcha
   sinov talablarini qo'yadi. Joriy talablarni ro'yxatdan o'tish paytida Console o'zi ko'rsatadi.
2. **Create app** → nomi «14-maktab», tili o'zbek, turi — Ilova, bepul.
3. **App bundle** sifatida `app-release.aab` yuklanadi.
4. Do'kon sahifasi uchun hamma narsa `android/play/` da tayyor:
   - ikonka 512×512 — `play/icon-512.png`
   - banner 1024×500 — `play/feature-graphic.png` (`play/make-banner.py` bilan qayta chiziladi)
   - ekran rasmlari 1080×1920 — `play/screenshots/`
   - qisqa va to'liq tavsif, uch tilda — `play/listing.md`
   - **maxfiylik siyosati havolasi** (majburiy) — https://qiziriq14maktab.vercel.app/uz/privacy
5. **Data safety**, **Content rating** va **Target audience** so'rovnomalariga javoblar ham
   `play/listing.md` da yozilgan — o'sha yerdan ko'chiring.

---

## Nima qayerda

| Fayl | Nima uchun |
|---|---|
| `app/src/main/AndroidManifest.xml` | Ilovaning tuzilishi: qaysi manzil ochiladi, rang, splash, havolalarni ushlash |
| `app/src/main/res/values/strings.xml` | Sayt manzili va domen — **domen o'zgarsa shu yerni o'zgartiring** |
| `app/build.gradle` | Versiya raqami, imzo sozlamasi |
| `app/src/main/res/mipmap-*/` | Ikonkalar (skript bilan chizilgan) |
| `play/` | Do'kon sahifasi: ikonka, banner, ekran rasmlari va tavsiflar |
| `../src/app/[lang]/privacy/page.tsx` | Maxfiylik siyosati (Play talab qiladi) |
| `../src/app/api/assetlinks/route.ts` | Saytdagi `/.well-known/assetlinks.json` |
| `../.github/workflows/android.yml` | GitHub'dagi yig'ish |

## Yangi versiya chiqarish

`app/build.gradle` da `versionCode` ni bittaga oshiring (1 → 2), `versionName` ni yangilang («1.1»),
so'ng qaytadan yig'ing. Play Console har safar oldingisidan katta `versionCode` talab qiladi.

Yana bir bor: **sayt kontenti uchun yangi versiya kerak emas** — yangilik qo'shsangiz ilovada darhol
ko'rinadi.
