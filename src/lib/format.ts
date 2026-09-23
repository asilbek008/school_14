import type { Locale } from "@/i18n/config";

const intlLocale: Record<Locale, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-GB" };
const timeZone = "Asia/Tashkent";

export function formatDate(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[lang], { dateStyle: "long", timeZone }).format(new Date(iso));
}

export function formatDateTime(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[lang], {
    dateStyle: "long",
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso));
}
