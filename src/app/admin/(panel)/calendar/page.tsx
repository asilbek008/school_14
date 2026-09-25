import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDayRange } from "@/lib/format";
import { schoolYearOf, yearLabel } from "@/lib/school-years";
import AdminHeader from "@/components/admin/AdminHeader";
import { kindLabels } from "./PeriodForm";

export const metadata: Metadata = { title: "O‘quv yili taqvimi" };

const tint: Record<string, string> = {
  chorak: "bg-blue-100 text-blue-800",
  tatil: "bg-teal-100 text-teal-800",
  imtihon: "bg-amber-100 text-amber-800",
  boshqa: "bg-slate-100 text-slate-700",
};

export default async function AdminCalendarPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("calendar_periods")
    .select("id, kind, title_uz, title_ru, title_en, starts_on, ends_on, is_published")
    .order("starts_on", { ascending: false });
  const rows = data ?? [];
  // Grouped by school year, newest first; a period belongs to the year it starts in.
  const years = [...new Set(rows.map((r) => schoolYearOf(`${r.starts_on}T12:00:00+05:00`)))];

  return (
    <>
      <AdminHeader title="O‘quv yili taqvimi" action={{ href: "/admin/calendar/new", label: "+ Qo‘shish" }} />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Choraklar, ta’tillar va imtihon davrlari — vazirlik buyrug‘i chiqqach kiriting. Davlat bayramlari bu yerga yozilmaydi: saytdagi
        taqvim ularni «Tadbirlar»dagi «Bayram» turkumidan oladi.
      </p>
      {rows.length ? (
        <div className="space-y-6">
          {years.map((y) => (
            <section key={y}>
              <h2 className="mb-2 text-base font-bold text-slate-900">{yearLabel(y)} o‘quv yili</h2>
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
                {rows
                  .filter((r) => schoolYearOf(`${r.starts_on}T12:00:00+05:00`) === y)
                  .sort((a, b) => a.starts_on.localeCompare(b.starts_on))
                  .map((r) => (
                    <li key={r.id}>
                      <Link href={`/admin/calendar/${r.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tint[r.kind] ?? tint.boshqa}`}>{kindLabels[r.kind] ?? r.kind}</span>
                        <span className="font-medium text-slate-900">{r.title_uz}</span>
                        <span className="text-sm text-slate-500">{formatDayRange(r.starts_on, r.ends_on, "uz")}</span>
                        {!r.is_published && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Yashirin</span>}
                        {(!r.title_ru || !r.title_en) && <span className="ml-auto text-xs font-medium text-amber-700">Tarjimasi to‘liq emas</span>}
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Taqvim hali kiritilmagan.</p>
      )}
    </>
  );
}
