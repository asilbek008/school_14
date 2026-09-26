// School years run 1 September – 31 August; a year is named by the calendar year it starts in (2025 = 2025–2026).

export type SchoolYearRow = {
  start_year: number;
  summary_uz: string;
  summary_ru: string | null;
  summary_en: string | null;
  students: number | null;
  staff: number | null;
  classes: number | null;
  graduates: number | null;
  is_published: boolean;
};

/** "2025–2026". */
export const yearLabel = (start: number) => `${start}–${start + 1}`;

/** The school year a date (ISO, "2025-10-03…") falls in, Tashkent time: September onwards starts a new one. */
export function schoolYearOf(iso: string): number {
  const d = new Date(new Date(iso).getTime() + 5 * 60 * 60 * 1000);
  return d.getUTCMonth() >= 8 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
}

/** The school year of a news item, event or achievement: the one the admin chose, otherwise by its date. */
export const itemYear = (chosen: number | null | undefined, iso: string | null | undefined): number | null =>
  chosen ?? (iso ? schoolYearOf(iso) : null);

/** Years offered in admin forms: the current one and the five before it, plus a stored one if older. */
export function yearChoices(current: number, stored?: number | null): number[] {
  const years = Array.from({ length: 6 }, (_, i) => current - i);
  return stored && !years.includes(stored) ? [...years, stored].sort((a, b) => b - a) : years;
}

/** ISO bounds of a school year, for date filters: [1 September start, 1 September next) in Tashkent time. */
export const yearRange = (start: number) => ({ from: `${start}-09-01T00:00:00+05:00`, to: `${start + 1}-09-01T00:00:00+05:00` });
