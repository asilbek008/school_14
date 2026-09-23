import type { Locale } from "@/i18n/config";

// School contact details shown on the Contact page and footer.
// null = not provided yet (the page shows "coming soon"). Fill in once the school sends them.
export const school = {
  foundedLabel: { uz: "1950-yillardan beri", ru: "С 1950-х годов", en: "Since the 1950s" } as Record<Locale, string>,
  address: null as string | null,
  phone: "+998 90 970 90 91" as string | null,
  email: null as string | null,
  hours: {
    uz: "Dushanba – Shanba, 09:00 – 17:30",
    ru: "Понедельник – Суббота, 09:00 – 17:30",
    en: "Monday – Saturday, 09:00 – 17:30",
  } as Record<Locale, string> | null,
  mapEmbedUrl: null as string | null, // Google/Yandex Maps embed URL
};

/** "tel:" link for a phone number written with spaces. */
export const telHref = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;
