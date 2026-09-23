// Timetable helpers shared by the public pages and the admin editor.

/** Monday … Saturday, as stored in `lessons.weekday`. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6] as const;

export const classLabel = (c: { grade: number; letter: string }) => `${c.grade}-${c.letter}`;

/** Groups classes by grade, keeping their order: [[1, [1-A, 1-B]], [2, [...]], …]. */
export function byGrade<T extends { grade: number }>(classes: T[]): [number, T[]][] {
  const groups = new Map<number, T[]>();
  for (const c of classes) groups.set(c.grade, [...(groups.get(c.grade) ?? []), c]);
  return [...groups];
}
