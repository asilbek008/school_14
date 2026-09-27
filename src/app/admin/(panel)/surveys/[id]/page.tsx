import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import SurveyForm, { type SurveyRow } from "../SurveyForm";
import { kindLabels } from "../QuestionForm";
import { deleteSurvey } from "../actions";

export const metadata: Metadata = { title: "So‘rovnomani tahrirlash" };

export default async function EditSurveyPage({ params }: PageProps<"/admin/surveys/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: row }, { data: questions }] = await Promise.all([
    supabase.from("surveys").select("*").eq("id", id).maybeSingle(),
    supabase.from("survey_questions").select("id, question_uz, kind, required, options_uz, sort_order").eq("survey_id", id).order("sort_order").order("id"),
  ]);
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={row.title_uz} back="/admin/surveys" action={{ href: `/admin/surveys/${id}/results`, label: "Natijalar" }} />
      <SurveyForm row={row as SurveyRow} />

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Savollar</h2>
          <Link href={`/admin/surveys/${id}/questions/new`} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            + Savol qo‘shish
          </Link>
        </div>
        {questions?.length ? (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
            {questions.map((q, i) => (
              <li key={q.id}>
                <Link href={`/admin/surveys/${id}/questions/${q.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className="text-sm font-bold text-slate-400">{i + 1}.</span>
                  <span className="min-w-0 flex-1 font-medium text-slate-900">{q.question_uz}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{kindLabels[q.kind] ?? q.kind}</span>
                  {q.options_uz?.length > 0 && <span className="text-xs text-slate-500">{q.options_uz.length} variant</span>}
                  {!q.required && <span className="text-xs text-slate-500">ixtiyoriy</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">Savol qo‘shilmagan — so‘rovnoma saytda ko‘rinmaydi.</p>
        )}
      </section>

      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteSurvey.bind(null, id)} confirmText="So‘rovnoma va uning barcha javoblari o‘chiriladi. Davom etasizmi?" />
      </div>
    </>
  );
}
