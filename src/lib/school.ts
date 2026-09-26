import type { Locale } from "@/i18n/config";

type Localized = Record<Locale, string>;

// School facts shown across the site. null = not provided yet (pages show "coming soon").
export const school = {
  // The documents section is hidden for now (owner's request): off the menus, footer, search and sitemap, and its page
  // is a 404. The admin section keeps working; set true to show it again.
  showDocuments: false,
  // Built in 1976 (owner, 2026-09).
  foundedLabel: { uz: "1976-yildan beri", ru: "С 1976 года", en: "Since 1976" } as Localized,
  address: {
    uz: "Surxondaryo viloyati, Qiziriq tumani",
    ru: "Сурхандарьинская область, Кизирикский район",
    en: "Qiziriq district, Surkhandarya region",
  } as Localized | null,
  phone: "+998 90 970 90 91" as string | null,
  email: "Qiziriq14m@gmail.com" as string | null,
  hours: {
    uz: "Dushanba – Shanba, 09:00 – 17:30",
    ru: "Понедельник – Суббота, 09:00 – 17:30",
    en: "Monday – Saturday, 09:00 – 17:30",
  } as Localized | null,
  // The school's pin on Google Maps ("14-umumta'lim maktabi"), and the link the owner shared.
  location: { lat: 37.7435629, lng: 67.2984924 } as { lat: number; lng: number } | null,
  mapUrl: "https://maps.app.goo.gl/Yi3PRuTfUpZwgNKJ7" as string | null,
  // Confirmed by the owner (2026-09): 973 pupils, 72 teachers. Once the admin has entered pupils for every
  // class (school_classes.students), the site shows their sum instead (getStudentTotal). The home page counts
  // classes from the timetable (no individual-study "YT" classes); `classes` is only the offline fallback.
  stats: { students: 973, staff: 72, classes: 43 },
  // Official electronic journal: grades, attendance and homework, behind each family's own login.
  eMaktabUrl: "https://emaktab.uz",
};

/** The school year that runs now: from August on it is this year's, before that last year's. */
export function currentSchoolYear() {
  const now = new Date();
  const from = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return { from, to: from + 1 };
}

/**
 * Google Maps embed (no API key) with a pin on the school, in the page's language. This is the
 * /maps/embed form: the older maps.google.com/maps?output=embed answers with X-Frame-Options.
 */
export const mapEmbedUrl = (lang: Locale) =>
  school.location &&
  `https://www.google.com/maps/embed?pb=!1m3!2m1!1s${school.location.lat},${school.location.lng}!6i16!3m1!1s${lang}!5m1!1s${lang}`;

/** "tel:" link for a phone number written with spaces. */
export const telHref = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;

/** The site's public address (canonical links, sitemap, social previews). Set NEXT_PUBLIC_SITE_URL once a domain is bought. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://qiziriq14maktab.vercel.app").replace(/\/$/, "");
