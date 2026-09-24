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

/** ISO bounds of a school year, for date filters: [1 September start, 1 September next) in Tashkent time. */
export const yearRange = (start: number) => ({ from: `${start}-09-01T00:00:00+05:00`, to: `${start + 1}-09-01T00:00:00+05:00` });
