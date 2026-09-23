// Bell schedule: two shifts, 45-minute lessons with 5-minute breaks, Monday–Saturday.
// Shared by the server-rendered schedule page and the client-side "now at school" card.

export const LESSON_MINUTES = 45;
export const BREAK_MINUTES = 5;
export const LESSONS_PER_SHIFT = 6;

export const shifts = [
  { id: 1, start: "08:00", grades: [1, 2, 5, 9, 10, 11] },
  { id: 2, start: "13:00", grades: [3, 4, 6, 7, 8] },
] as const;

export type Shift = (typeof shifts)[number];

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const fmtMinutes = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

export function lessons(shift: Shift) {
  const first = toMinutes(shift.start);
  return Array.from({ length: LESSONS_PER_SHIFT }, (_, i) => {
    const start = first + i * (LESSON_MINUTES + BREAK_MINUTES);
    return { n: i + 1, start, end: start + LESSON_MINUTES };
  });
}

export type ShiftStatus =
  | { kind: "dayoff" }
  | { kind: "before"; startsAt: string }
  | { kind: "lesson"; n: number; minutesLeft: number; progress: number }
  | { kind: "break"; nextLesson: number; minutesLeft: number; progress: number }
  | { kind: "after" };

/** Status of a shift at `minutes` past midnight on `weekday` (0 = Sunday), Tashkent time. */
export function shiftStatus(shift: Shift, weekday: number, minutes: number): ShiftStatus {
  if (weekday === 0) return { kind: "dayoff" };
  const list = lessons(shift);
  const dayStart = list[0].start;
  const dayEnd = list[list.length - 1].end;
  if (minutes < dayStart) return { kind: "before", startsAt: shift.start };
  if (minutes >= dayEnd) return { kind: "after" };
  const progress = (minutes - dayStart) / (dayEnd - dayStart);
  for (const lesson of list) {
    if (minutes < lesson.end) {
      return minutes >= lesson.start
        ? { kind: "lesson", n: lesson.n, minutesLeft: lesson.end - minutes, progress }
        : { kind: "break", nextLesson: lesson.n, minutesLeft: lesson.start - minutes, progress };
    }
  }
  return { kind: "after" };
}

/** Current weekday and minutes past midnight in Tashkent (UTC+5, no DST). */
export function tashkentNow(date = new Date()) {
  const shifted = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  return {
    weekday: shifted.getUTCDay(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    clock: fmtMinutes(shifted.getUTCHours() * 60 + shifted.getUTCMinutes()),
  };
}

/** The shift a grade studies in (every grade 1–11 is in exactly one shift). */
export function shiftForGrade(grade: number): Shift {
  return shifts.find((s) => (s.grades as readonly number[]).includes(grade)) ?? shifts[0];
}
