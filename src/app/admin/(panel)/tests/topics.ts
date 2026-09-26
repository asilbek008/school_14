import type { requireAdmin } from "@/lib/admin";

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

/** The topics already used in a subject's questions (every test of the subject), sorted — suggestions for the forms. */
export async function subjectTopics(supabase: Supabase, subject: string): Promise<string[]> {
  const { data } = await supabase.from("test_questions").select("topic, tests!inner(subject)").eq("tests.subject", subject).not("topic", "is", null).limit(5000);
  return [...new Set((data ?? []).map((r) => r.topic as string))].sort((a, b) => a.localeCompare(b, "uz"));
}
