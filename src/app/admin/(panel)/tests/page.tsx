import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { testSubjects } from "@/lib/tests";
import AdminHeader from "@/components/admin/AdminHeader";
import Status from "@/components/admin/Status";
import { subjectLabels } from "./TestForm";

export const metadata: Metadata = { title: "Testlar" };

export default async function AdminTestsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("tests")
    .select("id, title_uz, title_ru, title_en, subject, kind, grade, time_limit, is_published, test_questions(count)")
    .order("sort_order")
    .order("id");
  const rows = (data ?? []).map((r) => ({ ...r, count: (r.test_questions as unknown as { count: number }[])[0]?.count ?? 0 }));
  const dtmPool = new Map<string, number>();
  for (const r of rows) if (r.kind === "dtm" && r.is_published) dtmPool.set(r.subject, (dtmPool.get(r.subject) ?? 0) + r.count);
  const total = rows.reduce((a, r) => a + r.count, 0);

  return (
    <>
      <AdminHeader title="Testlar" action={{ href: "/admin/tests/new", label: "+ Test qo‘shish" }} />
      <Link
        href="/admin/tests/bank"
        className="mb-4 flex items-center gap-3 rounded-2xl bg-white p-4 text-sm hover:ring-2 hover:ring-blue-300"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-100 text-lg">📚</span>
        <span className="flex-1">
          <b className="block text-slate-900">Savollar bazasi</b>
          <span className="text-slate-500">Barcha savollar fan, mavzu va qiyinlik bo‘yicha; DTM uchun yetarlimi — bir qarashda</span>
        </span>
        <span aria-hidden className="text-slate-400">→</span>
      </Link>
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        O‘quvchilar saytda ro‘yxatdan o‘tmasdan test ishlaydi, natijalari faqat o‘z qurilmasida qoladi. To‘g‘ri javoblar sahifa kodida
        ko‘rinmaydi — faqat javob berilgandan keyin keladi. Savollarni birma-bir yoki Word/Excel’dan nusxalab yuklash mumkin.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Testlar", rows.length],
          ["Savollar", total],
          ["Saytda", rows.filter((r) => r.is_published).length],
          ["DTM savollari (saytda)", [...dtmPool.values()].reduce((a, n) => a + n, 0)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
            <b className="block text-2xl">{value}</b>
            <span className="text-sm text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      <section className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-slate-800">DTM sinovi uchun savollar bazasi</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {testSubjects
            .filter((s) => s !== "boshqa")
            .map((s) => {
              const n = dtmPool.get(s) ?? 0;
              const need = ["ona_tili", "matematika", "tarix"].includes(s) ? 10 : 30;
              return (
                <span key={s} className={`rounded-full px-3 py-1 ${n >= need ? "bg-green-100 text-green-800" : n ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-500"}`}>
                  {subjectLabels[s]}: <b>{n}</b>
                </span>
              );
            })}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Bitta sinov uchun: Ona tili, Matematika, Tarix — kamida 10 tadan (majburiy), asosiy fan — 30 ta. Savollar ko‘p bo‘lsa, har safar har
          xil savollar tushadi.
        </p>
      </section>

      {rows.length ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/tests/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-bold text-blue-800">{r.count}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{r.title_uz}</p>
                  <p className="text-sm text-slate-500">
                    {[subjectLabels[r.subject], r.kind === "dtm" && "DTM", r.grade && `${r.grade}-sinf`, r.time_limit ? `${r.time_limit} daq.` : "vaqtsiz", `${r.count} ta savol`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {!r.count && <span className="hidden text-xs font-medium text-amber-700 sm:inline">Savol yo‘q</span>}
                <Status published={r.is_published} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali test qo‘shilmagan.</p>
      )}
    </>
  );
}
