import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import { audienceLabels } from "./SurveyForm";

export const metadata: Metadata = { title: "So‘rovnomalar" };

type Row = {
  id: number;
  title_uz: string;
  audience: string;
  closes_at: string | null;
  is_published: boolean;
  questions: { count: number }[];
  responses: { count: number }[];
};

/** A survey with no closing time stays open until it is hidden. */
const stillOpen = (closes: string | null) => !closes || new Date(closes) > new Date();

export default async function AdminSurveysPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("surveys")
    .select("id, title_uz, audience, closes_at, is_published, questions:survey_questions(count), responses:survey_responses(count)")
    .order("sort_order")
    .order("id", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <AdminHeader title="So‘rovnomalar" action={{ href: "/admin/surveys/new", label: "+ So‘rovnoma" }} />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Ota-onalar va o‘quvchilar fikri. Javoblar ismsiz saqlanadi — kim javob berganini baza ham bilmaydi, shuning uchun natijalar faqat
        umumiy son sifatida ko‘rinadi.
      </p>
      {rows.length ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
          {rows.map((s) => {
            const open = stillOpen(s.closes_at);
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <Link href={`/admin/surveys/${s.id}`} className="min-w-0 flex-1 hover:underline">
                  <span className="block font-medium text-slate-900">{s.title_uz}</span>
                  <span className="text-sm text-slate-500">
                    {audienceLabels[s.audience] ?? s.audience} · {s.questions?.[0]?.count ?? 0} ta savol
                    {s.closes_at && ` · ${open ? "yopiladi" : "yopilgan"} ${formatDateTime(s.closes_at, "uz")}`}
                  </span>
                </Link>
                {!s.is_published && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Yashirin</span>}
                {open && s.is_published && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Ochiq</span>}
                <Link href={`/admin/surveys/${s.id}/results`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Natijalar ({s.responses?.[0]?.count ?? 0})
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali so‘rovnoma yo‘q.</p>
      )}
    </>
  );
}
