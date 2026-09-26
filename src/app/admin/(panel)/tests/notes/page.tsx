import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { testSubjects } from "@/lib/tests";
import { subjectLabels } from "../TestForm";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = { title: "Qisqa darslar" };

/** The learning path's lessons: every topic of the question bank, with or without its short lesson. */
export default async function NotesPage({ searchParams }: PageProps<"/admin/tests/notes">) {
  const { supabase } = await requireAdmin();
  const [{ data: stats }, { data: notes }] = await Promise.all([
    supabase.rpc("question_bank_stats"),
    supabase.from("study_notes").select("subject, topic, is_published, updated_at"),
  ]);
  const rows = (stats ?? []) as { subject: string; topic: string | null; questions: number; difficulty: number | null }[];
  const subjects = [...new Set(rows.filter((r) => r.topic).map((r) => r.subject))].sort(
    (a, b) => testSubjects.indexOf(a as never) - testSubjects.indexOf(b as never),
  );
  const s = String((await searchParams).s ?? "") || subjects[0] || "";
  const topics = new Map<string, { questions: number; difficulty: number }>();
  for (const r of rows) {
    if (r.subject !== s || !r.topic) continue;
    const t = topics.get(r.topic) ?? { questions: 0, difficulty: 0 };
    t.difficulty = (t.difficulty * t.questions + Number(r.difficulty ?? 2) * Number(r.questions)) / (t.questions + Number(r.questions));
    t.questions += Number(r.questions);
    topics.set(r.topic, t);
  }
  const list = [...topics].sort((a, b) => a[1].difficulty - b[1].difficulty || b[1].questions - a[1].questions);
  const noteOf = (topic: string) => notes?.find((n) => n.subject === s && n.topic === topic);
  const written = list.filter(([topic]) => noteOf(topic)).length;

  return (
    <>
      <AdminHeader title="Qisqa darslar (O‘quv yo‘li)" back="/admin/tests" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytdagi «O‘quv yo‘li» sahifasida har mavzu osondan qiyinga tartibda chiqadi. Har mavzuga qisqa dars yozing: qoida, bitta
        misol va ko‘p uchraydigan xato (5–10 gap). Mavzular savollardagi «Mavzu» maydonidan olinadi.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {subjects.map((x) => (
          <Link
            key={x}
            href={`/admin/tests/notes?s=${encodeURIComponent(x)}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${x === s ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            {subjectLabels[x] ?? x}
          </Link>
        ))}
      </div>
      <p className="mb-2 text-sm text-slate-500">
        {list.length} ta mavzu · {written} tasiga dars yozilgan
      </p>
      <ol className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
        {list.map(([topic, info], i) => {
          const note = noteOf(topic);
          return (
            <li key={topic} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="w-6 text-right text-sm text-slate-400">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <b className="text-slate-900">{topic}</b>
                <span className="ml-2 text-xs text-slate-500">
                  {info.questions} savol · qiyinlik {info.difficulty.toFixed(1)}
                </span>
              </span>
              {note ? (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${note.is_published ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                  {note.is_published ? "✓ Dars bor" : "Yashirin"}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Dars yo‘q</span>
              )}
              <Link
                href={`/admin/tests/notes/edit?s=${encodeURIComponent(s)}&t=${encodeURIComponent(topic)}`}
                className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                {note ? "Tahrirlash" : "Yozish"}
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
