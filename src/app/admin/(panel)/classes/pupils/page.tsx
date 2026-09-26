import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import PupilImport from "./PupilImport";

export const metadata: Metadata = { title: "O‘quvchilar ro‘yxati" };

export default async function PupilsPage() {
  const { supabase } = await requireAdmin();
  const [{ count }, { data: classes }] = await Promise.all([
    supabase.from("pupils").select("id", { count: "exact", head: true }),
    supabase.from("school_classes").select("grade, letter"),
  ]);

  return (
    <>
      <AdminHeader title="O‘quvchilar ro‘yxatini yuklash" back="/admin/classes" />
      <div className="mb-6 space-y-2 rounded-xl bg-white p-5 text-sm text-slate-700 shadow-sm">
        <p>
          eMaktab&apos;dan <b>«Список учеников»</b> faylini (.xlsx) yuklang: sinf, F.I.Sh., tug‘ilgan sana, jinsi. Yangi fayl eski
          ro‘yxatni to‘liq almashtiradi, har sinfdagi o‘quvchilar soni ham shundan yoziladi. Maktabdan chiqqanlar olinmaydi.
        </p>
        <p>
          Saytda faqat qisqa ism (<b>Aliyev A.</b>) va o‘g‘il/qiz belgisi ko‘rinadi — to‘liq F.I.Sh. va tug‘ilgan sana faqat shu
          admin panelda. Hozir bazada: <b>{count ?? 0}</b> ta o‘quvchi.
        </p>
      </div>
      <PupilImport classes={(classes ?? []).map((c) => `${c.grade}-${c.letter.toUpperCase()}`)} />
    </>
  );
}
