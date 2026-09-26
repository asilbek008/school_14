import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { currentSchoolYear } from "@/lib/school";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import GraduateImport from "./GraduateImport";
import { deleteGraduateYear } from "../actions";

export const metadata: Metadata = { title: "Bitiruvchilar ro‘yxati" };

/** Each year's graduate list for the alumni page: loaded from an eMaktab pupil list, one year at a time. */
export default async function GraduatesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("graduates").select("grad_year");
  const years = new Map<number, number>();
  for (const r of data ?? []) years.set(r.grad_year, (years.get(r.grad_year) ?? 0) + 1);
  const current = currentSchoolYear().to;

  return (
    <>
      <AdminHeader title="Bitiruvchilar ro‘yxati (yillar bo‘yicha)" back="/admin/alumni" />
      <div className="mb-6 space-y-2 rounded-xl bg-white p-5 text-sm text-slate-700 shadow-sm">
        <p>
          Saytdagi «Bitiruvchilar» sahifasida har yil tugmasi bosilganda shu ro‘yxat ochiladi. Bitiruv yilini tanlab, eMaktab&apos;dagi
          <b> «Список учеников»</b> faylini yuklang: faylda 11-sinflar bo‘lsa, faqat ular olinadi. Kirill yozuvidagi ismlar lotinga o‘giriladi.
        </p>
        <p>
          Saytda faqat qisqa ism (<b>Aliyev A.</b>), sinf va o‘g‘il/qiz belgisi ko‘rinadi. {current}-yil bitiruvchilari ro‘yxati yuklanmagan
          bo‘lsa, saytda hozirgi 11-sinf o‘quvchilari ko‘rsatiladi.
        </p>
      </div>
      <GraduateImport current={current} />
      <h2 className="mb-3 mt-10 text-lg font-bold">Yuklangan yillar</h2>
      {years.size ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
          {[...years].sort((a, b) => b[0] - a[0]).map(([year, n]) => (
            <li key={year} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>
                <b>{year}-yil</b> <span className="text-slate-500">· {n} ta bitiruvchi</span>
              </span>
              <DeleteButton action={deleteGraduateYear.bind(null, year)} confirmText={`${year}-yil bitiruvchilari ro‘yxati o‘chirilsinmi?`} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">Hali hech bir yil yuklanmagan.</p>
      )}
    </>
  );
}
