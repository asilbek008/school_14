import type { Locale } from "@/i18n/config";

const intlLocale: Record<Locale, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-GB" };
const timeZone = "Asia/Tashkent";

export function formatDate(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[lang], { dateStyle: "long", timeZone }).format(new Date(iso));
}

/** Date with the weekday: "15-oktabr, 2026, chorshanba". */
export function formatDateFull(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[lang], { dateStyle: "full", timeZone }).format(new Date(iso));
}

export function formatTime(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[lang], { timeStyle: "short", timeZone }).format(new Date(iso));
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

// Plain dates ("2026-09-02", no time) are calendar days: read and shown in UTC so no zone shifts them.
const dayFormat = (lang: Locale, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(intlLocale[lang], { ...options, timeZone: "UTC" });

/** "2-sentabr – 31-oktabr" / "2 – 8-noyabr"; one day alone when both are the same. */
export function formatDayRange(from: string, to: string, lang: Locale): string {
  const f = dayFormat(lang, { day: "numeric", month: "long" });
  return from === to ? f.format(new Date(from)) : f.formatRange(new Date(from), new Date(to));
}

/** Month name of a plain date: "Sentabr". */
export const formatMonth = (day: string, lang: Locale) => dayFormat(lang, { month: "long" }).format(new Date(day));
