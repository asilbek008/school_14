import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { dtm, testSubjects } from "@/lib/tests";
import AdminHeader from "@/components/admin/AdminHeader";
import { subjectLabels } from "../TestForm";
import BankList, { type BankQuestion } from "./BankList";

export const metadata: Metadata = { title: "Savollar bazasi" };

/** Every question of every test in one place: per subject how big the bank is (and whether a DTM mock has enough). */
export default async function QuestionBankPage() {
  const { supabase } = await requireAdmin();
  // The API returns at most 1000 rows a request: read in pages.
  const rows: BankQuestion[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from("test_questions")
      .select("id, test_id, question, options, correct, explanation, topic, difficulty, tests!inner(title_uz, subject, kind, is_published)")
      .order("test_id")
      .order("sort_order")
      .range(from, from + 999);
    const page = (data ?? []) as unknown as BankQuestion[];
    rows.push(...page);
    if (page.length < 1000) break;
  }

  const bySubject = testSubjects
    .map((s) => {
      const list = rows.filter((r) => r.tests.subject === s);
      const dtmCount = list.filter((r) => r.tests.kind === "dtm" && r.tests.is_published).length;
      const need = s === "boshqa" ? 0 : dtm.compulsory.includes(s) ? dtm.compulsoryCount : dtm.mainCount;
      return {
        subject: s,
        total: list.length,
        dtm: dtmCount,
        need,
        topics: new Set(list.map((r) => r.topic).filter(Boolean)).size,
        noTopic: list.filter((r) => !r.topic).length,
        noExplanation: list.filter((r) => !r.explanation).length,
      };
    })
    .filter((s) => s.total || s.need);
  const total = rows.length;
  const tagged = rows.filter((r) => r.topic).length;
  const tile = "rounded-2xl bg-white p-4";

  return (
    <>
      <AdminHeader title="Savollar bazasi" back="/admin/tests" />
      <p className="-mt-3 mb-5 max-w-3xl text-sm text-slate-600">
        Barcha testlardagi savollar bir joyda: fan, mavzu va qiyinlik bo‘yicha. Saytdagi «DTM sinovi» har fandan tasodifiy savol oladi — asosiy fan
        uchun kamida {dtm.mainCount} ta, majburiy fanlar uchun {dtm.compulsoryCount} ta kerak (turli-tuman bo‘lishi uchun 2–3 barobar ko‘p bo‘lgani yaxshi).
        Savolni tahrirlash uchun ustiga bosing.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={tile}>
          <b className="block text-2xl text-slate-900">{total}</b>
          <span className="text-sm text-slate-500">savol</span>
        </div>
        <div className={tile}>
          <b className="block text-2xl text-slate-900">{bySubject.filter((s) => s.total).length}</b>
          <span className="text-sm text-slate-500">fan</span>
        </div>
        <div className={tile}>
          <b className="block text-2xl text-slate-900">{new Set(rows.map((r) => `${r.tests.subject}:${r.topic}`).values()).size}</b>
          <span className="text-sm text-slate-500">mavzu</span>
        </div>
        <div className={tile}>
          <b className="block text-2xl text-slate-900">{total ? Math.round((tagged / total) * 100) : 0}%</b>
          <span className="text-sm text-slate-500">mavzusi belgilangan</span>
        </div>
      </div>

      <section className="mb-6 overflow-x-auto rounded-2xl bg-white p-4">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="py-2 pr-3 font-semibold">Fan</th>
              <th className="py-2 pr-3 text-right font-semibold">Savollar</th>
              <th className="py-2 pr-3 font-semibold">DTM banki</th>
              <th className="py-2 pr-3 text-right font-semibold">Mavzular</th>
              <th className="py-2 pr-3 text-right font-semibold">Mavzusiz</th>
              <th className="py-2 text-right font-semibold">Izohsiz</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bySubject.map((s) => {
              const pct = s.need ? Math.min(100, Math.round((s.dtm / (s.need * 2)) * 100)) : 0;
              return (
                <tr key={s.subject}>
                  <td className="py-2.5 pr-3 font-medium text-slate-900">{subjectLabels[s.subject]}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{s.total}</td>
                  <td className="py-2.5 pr-3">
                    {s.need ? (
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                          <span className={`block h-full rounded-full ${s.dtm >= s.need ? "bg-green-500" : s.dtm ? "bg-amber-400" : "bg-slate-300"}`} style={{ width: `${pct}%` }} />
                        </span>
                        <span className={`text-xs tabular-nums ${s.dtm >= s.need ? "text-green-700" : "text-amber-700"}`}>
                          {s.dtm} / {s.need}
                          {s.dtm >= s.need ? " ✓" : ""}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{s.topics}</td>
                  <td className={`py-2.5 pr-3 text-right tabular-nums ${s.noTopic ? "text-amber-700" : "text-slate-400"}`}>{s.noTopic}</td>
                  <td className={`py-2.5 text-right tabular-nums ${s.noExplanation ? "text-slate-600" : "text-slate-400"}`}>{s.noExplanation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <BankList rows={rows} labels={subjectLabels} />
      <p className="mt-6 text-sm text-slate-500">
        Yangi savollar testning o‘z sahifasida qo‘shiladi —{" "}
        <Link href="/admin/tests" className="text-blue-700 hover:underline">
          testlar ro‘yxati
        </Link>
        . Ko‘plab yuklashda «Mavzu:» va «Qiyinlik:» qatorlari (Excel’da shu nomli ustunlar) ham o‘qiladi.
      </p>
    </>
  );
}
