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

// <input type="datetime-local"> values are wall-clock times with no zone; the school is in
// Tashkent (UTC+5, no DST), so admin forms read and write them in that zone.
const TASHKENT_OFFSET = "+05:00";

export function toTashkentInput(iso: string | null): string {
  if (!iso) return "";
  const shifted = new Date(new Date(iso).getTime() + 5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

export function fromTashkentInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}:00${TASHKENT_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
