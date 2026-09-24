// Club schedule and video helpers shared by the site and the admin panel.

/** Weekdays a club can meet on (1 = Monday … 6 = Saturday), like timetable weekdays. */
export const CLUB_DAYS = [1, 2, 3, 4, 5, 6] as const;

/** "15:00:00" (Postgres time) → "15:00". */
export const hhmm = (time: string | null) => (time ? time.slice(0, 5) : null);

/**
 * The club's time in words: "Seshanba, Juma • 15:00–16:30". `dayNames` are the six weekday
 * names of the page language (dict.timetable.days). Empty when neither days nor time are set.
 */
export function clubSchedule(club: { days: number[] | null; start_time: string | null; end_time: string | null }, dayNames: string[]) {
  const days = (club.days ?? []).filter((d) => d >= 1 && d <= 6).sort((a, b) => a - b).map((d) => dayNames[d - 1]);
  const start = hhmm(club.start_time);
  const end = hhmm(club.end_time);
  const time = start ? (end ? `${start}–${end}` : start) : "";
  return [days.join(", "), time].filter(Boolean).join(" • ");
}
