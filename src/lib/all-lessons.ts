import type { requireAdmin } from "@/lib/admin";

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

/** Every timetable row (there are more than the API's 1000-row page), read in pages. */
export async function allLessons<T>(supabase: Supabase, columns: string): Promise<T[]> {
  const page = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase.from("lessons").select(columns).order("id").range(from, from + page - 1);
    if (error || !data) break;
    rows.push(...(data as T[]));
    if (data.length < page) break;
  }
  return rows;
}
