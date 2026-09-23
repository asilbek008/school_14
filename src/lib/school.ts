import type { Locale } from "@/i18n/config";

type Localized = Record<Locale, string>;

// School facts shown across the site. null = not provided yet (pages show "coming soon").
export const school = {
  foundedLabel: { uz: "1950-yillardan beri", ru: "С 1950-х годов", en: "Since the 1950s" } as Localized,
  address: {
    uz: "Surxondaryo viloyati, Qiziriq tumani",
    ru: "Сурхандарьинская область, Кизирикский район",
    en: "Qiziriq district, Surkhandarya region",
  } as Localized | null,
  phone: "+998 90 970 90 91" as string | null,
  email: null as string | null,
  hours: {
    uz: "Dushanba – Shanba, 09:00 – 17:30",
    ru: "Понедельник – Суббота, 09:00 – 17:30",
    en: "Monday – Saturday, 09:00 – 17:30",
  } as Localized | null,
  mapEmbedUrl: null as string | null, // Google/Yandex Maps embed URL
  stats: { students: 1001, staff: 72, classes: 45 },
};

/** "tel:" link for a phone number written with spaces. */
export const telHref = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;
