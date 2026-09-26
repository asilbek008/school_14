import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { subjectLabels } from "../TestForm";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = { title: "Savollar statistikasi" };

type Row = {
  question_id: number;
  attempts: number;
  correct: number;
  test_questions: { test_id: number; question: string; options: string[]; correct: number; topic: string | null; tests: { title_uz: string; subject: string } };
};

/**
 * Which questions are answered wrong most often (anonymous counters from finished attempts on the site): a hint
 * for teachers — a topic to explain again, or a question worded unclearly or with a wrong key.
 */
export default async function QuestionStatsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("question_stats")
    .select("question_id, attempts, correct, test_questions(test_id, question, options, correct, topic, tests(title_uz, subject))")
    .gte("attempts", 3)
    .order("attempts", { ascending: false })
    .limit(1000);
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.test_questions);
  const rate = (r: Row) => r.correct / r.attempts;
  const hardest = [...rows].sort((a, b) => rate(a) - rate(b) || b.attempts - a.attempts).slice(0, 60);
  const answers = rows.reduce((a, r) => a + r.attempts, 0);
  const right = rows.reduce((a, r) => a + r.correct, 0);
  // Topics by share of right answers.
  const topics = new Map<string, { subject: string; topic: string; attempts: number; correct: number }>();
  for (const r of rows) {
    const q = r.test_questions;
    if (!q.topic) continue;
    const k = `${q.tests.subject}|${q.topic}`;
    const t = topics.get(k) ?? { subject: q.tests.subject, topic: q.topic, attempts: 0, correct: 0 };
    t.attempts += r.attempts;
    t.correct += r.correct;
    topics.set(k, t);
  }
  const weakTopics = [...topics.values()].filter((t) => t.attempts >= 10).sort((a, b) => a.correct / a.attempts - b.correct / b.attempts).slice(0, 12);
  const pct = (c: number, n: number) => `${Math.round((c / n) * 100)}%`;

  return (
    <>
      <AdminHeader title="Savollar statistikasi" back="/admin/tests" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytda test yakunlanganda har savolga javob to‘g‘ri yoki noto‘g‘ri bo‘lgani ismsiz sanaladi (kim ishlagani saqlanmaydi). Eng
        ko‘p xato qilinadigan savollar — qayta tushuntirish kerak bo‘lgan mavzu yoki kaliti/matni noaniq savol bo‘lishi mumkin.
        Kamida 3 marta javob berilgan savollar ko‘rsatiladi.
      </p>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ["Savollar", rows.length],
          ["Javoblar", answers],
          ["To‘g‘ri javoblar", answers ? pct(right, answers) : "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {weakTopics.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">Eng qiyin mavzular</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {weakTopics.map((t) => (
              <li key={`${t.subject}|${t.topic}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                <span>
                  <b>{t.topic}</b> <span className="text-sm text-slate-500">· {subjectLabels[t.subject] ?? t.subject}</span>
                </span>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-bold text-red-800">{pct(t.correct, t.attempts)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mb-3 text-lg font-bold">Eng ko‘p xato qilinadigan savollar</h2>
      {hardest.length ? (
        <ol className="space-y-2">
          {hardest.map((r) => {
            const q = r.test_questions;
            return (
              <li key={r.question_id}>
                <Link href={`/admin/tests/${q.test_id}/questions/${r.question_id}`} className="block rounded-xl bg-white p-4 shadow-sm hover:ring-2 hover:ring-blue-300">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 font-medium text-slate-900">{q.question}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold ${rate(r) < 0.4 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                      {pct(r.correct, r.attempts)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-green-700">✓ {q.options[q.correct]}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {subjectLabels[q.tests.subject] ?? q.tests.subject}
                    {q.topic && ` · ${q.topic}`} · {q.tests.title_uz} · {r.attempts} marta javob berilgan
                  </p>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">Hali yetarli javob yo‘q — saytda testlar ishlanganda shu yerda ko‘rinadi.</p>
      )}
    </>
  );
}
