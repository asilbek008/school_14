import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { mediaBaseUrl } from "@/lib/media";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import TestForm, { type TestRow } from "../TestForm";
import { difficultyLabels } from "@/lib/tests";
import QuestionImport from "../QuestionImport";
import { deleteTest } from "../actions";

export const metadata: Metadata = { title: "Testni tahrirlash" };

const letters = "ABCDEF";

export default async function EditTestPage({ params }: PageProps<"/admin/tests/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: row }, { data: questions }] = await Promise.all([
    supabase.from("tests").select("*").eq("id", id).maybeSingle(),
    supabase.from("test_questions").select("id, question, options, correct, explanation, image, topic, difficulty").eq("test_id", id).order("sort_order").order("id"),
  ]);
  if (!row) notFound();
  const list = questions ?? [];

  return (
    <>
      <AdminHeader title={row.title_uz} back="/admin/tests" />
      {row.is_published && list.length > 0 && (
        <p className="mb-4 text-sm">
          <a href={`/uz/tests/${id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
            Saytda ochish ↗
          </a>
        </p>
      )}
      <TestForm row={row as TestRow} />

      <section id="questions" className="mt-8 scroll-mt-20 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Savollar ({list.length})</h2>
          <Link href={`/admin/tests/${id}/questions/new`} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            + Savol qo‘shish
          </Link>
        </div>
        {!row.is_published && list.length > 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Test hali saytda ko‘rinmaydi — tayyor bo‘lsa, yuqorida «Saytda ko‘rsatish»ni belgilab saqlang.</p>
        )}
        {list.length > 0 ? (
          <ol className="space-y-2">
            {list.map((q, i) => (
              <li key={q.id}>
                <Link href={`/admin/tests/${id}/questions/${q.id}`} className="flex gap-3 rounded-xl bg-white p-4 shadow-sm hover:ring-2 hover:ring-blue-200">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-3 whitespace-pre-line font-medium text-slate-900">{q.question}</p>
                    <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                      {(q.options as string[]).map((o, k) => (
                        <li key={k} className={k === q.correct ? "font-semibold text-green-700" : "text-slate-500"}>
                          {letters[k]}) <span className="inline-block max-w-[16rem] truncate align-bottom">{o}</span>
                          {k === q.correct && " ✓"}
                        </li>
                      ))}
                    </ul>
                    {(q.explanation || q.image || q.topic || q.difficulty) && (
                      <p className="mt-1 text-xs text-slate-400">
                        {[q.topic && `📚 ${q.topic}`, q.difficulty && `⚡ ${difficultyLabels[q.difficulty]}`, q.explanation && "💬 izoh bor", q.image && "🖼 rasm bor"]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  {q.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                    <img src={`${mediaBaseUrl}/${q.image}`} alt="" className="hidden size-14 shrink-0 rounded-lg object-cover sm:block" />
                  )}
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">Hali savol yo‘q. Birma-bir qo‘shing yoki quyida matn/Excel’dan yuklang.</p>
        )}
        <QuestionImport testId={id} existing={list.length} />
      </section>

      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteTest.bind(null, id)} confirmText={`«${row.title_uz}» testi va uning ${list.length} ta savoli o‘chirilsinmi?`} />
      </div>
    </>
  );
}
