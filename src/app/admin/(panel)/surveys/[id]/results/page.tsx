import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = { title: "So‘rovnoma natijalari" };

type Question = { id: number; question_uz: string; kind: string; options_uz: string[]; sort_order: number };
type Answer = number | number[] | string;

const bar = ["bg-blue-600", "bg-teal-600", "bg-amber-500", "bg-violet-600", "bg-rose-500", "bg-emerald-600"];

/** How many people chose each option, and the free-text answers as they were written. */
export default async function SurveyResultsPage({ params }: PageProps<"/admin/surveys/[id]/results">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: survey }, { data: questions }, { data: responses }] = await Promise.all([
    supabase.from("surveys").select("id, title_uz").eq("id", id).maybeSingle(),
    supabase.from("survey_questions").select("id, question_uz, kind, options_uz, sort_order").eq("survey_id", id).order("sort_order").order("id"),
    supabase.from("survey_responses").select("answers, created_at").eq("survey_id", id).order("created_at", { ascending: false }).limit(1000),
  ]);
  if (!survey) notFound();
  const rows = (responses ?? []) as { answers: Record<string, Answer>; created_at: string }[];
  const list = (questions ?? []) as Question[];
  const last = rows[0]?.created_at;

  return (
    <>
      <AdminHeader title={survey.title_uz} back={`/admin/surveys/${id}`} />
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
          <p className="text-3xl font-extrabold text-slate-900">{rows.length}</p>
          <p className="text-sm text-slate-500">javob{rows.length >= 1000 && " (oxirgi 1000 tasi)"}</p>
        </div>
        {last && (
          <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{formatDateTime(last, "uz")}</p>
            <p className="text-sm text-slate-500">oxirgi javob</p>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali javob yo‘q.</p>
      ) : (
        <div className="space-y-4">
          {list.map((q, qi) => {
            const given = rows.map((r) => r.answers[String(q.id)]).filter((a) => a !== undefined);
            if (q.kind === "text") {
              const texts = given.filter((a): a is string => typeof a === "string" && a.trim() !== "");
              return (
                <section key={q.id} className="rounded-xl bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-slate-900">
                    {qi + 1}. {q.question_uz}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{texts.length} ta yozma javob</p>
                  <ul className="mt-3 space-y-2">
                    {texts.slice(0, 200).map((text, i) => (
                      <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-[14px] leading-relaxed text-slate-800">
                        {text}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            }

            const labels = q.kind === "scale" ? ["1", "2", "3", "4", "5"] : q.options_uz;
            const counts = labels.map((_, i) =>
              given.filter((a) => (q.kind === "scale" ? a === i + 1 : Array.isArray(a) ? a.includes(i) : a === i)).length,
            );
            const total = q.kind === "scale" || !Array.isArray(given[0]) ? given.length : given.length;
            const average =
              q.kind === "scale" && given.length
                ? (given.reduce((sum: number, a) => sum + (typeof a === "number" ? a : 0), 0) / given.length).toFixed(1)
                : null;
            return (
              <section key={q.id} className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="font-bold text-slate-900">
                  {qi + 1}. {q.question_uz}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {given.length} ta javob{average && ` · o‘rtacha ${average}`}
                </p>
                <ul className="mt-3 space-y-2">
                  {labels.map((label, i) => {
                    const share = total ? Math.round((counts[i] / total) * 100) : 0;
                    return (
                      <li key={i}>
                        <div className="flex items-baseline justify-between gap-3 text-[14px]">
                          <span className="text-slate-800">{label}</span>
                          <span className="shrink-0 font-semibold text-slate-600">
                            {counts[i]} · {share}%
                          </span>
                        </div>
                        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${bar[i % bar.length]}`} style={{ width: `${share}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
