import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import StaffImport from "./StaffImport";

export const metadata: Metadata = { title: "Excel'dan yuklash" };

export default async function ImportStaffPage() {
  const { supabase } = await requireAdmin();
  const { data: staff } = await supabase.from("staff").select("full_name, short_name");
  const existing = {
    full: (staff ?? []).map((s) => s.full_name),
    short: (staff ?? []).flatMap((s) => (s.short_name ? [s.short_name] : [])),
  };

  return (
    <>
      <AdminHeader title="O‘qituvchilarni Excel'dan yuklash" back="/admin/staff" />
      <div className="mb-6 space-y-2 rounded-xl bg-white p-5 text-sm text-slate-700 shadow-sm">
        <p>
          Ustunlar: <b>To‘liq ism-familiya</b> va <b>Lavozimi</b> (majburiy), eMaktab&apos;dagi nomi, Fani, Sinf rahbari (5-A),
          Toifa, Ma&apos;lumoti, Ish staji (yil), Telefon, Email, Qo‘shimcha ma&apos;lumot, Saytda ko‘rsatish (ha/yo‘q).
        </p>
        <p>
          Bor xodim eMaktab nomi yoki to‘liq ismi bo‘yicha topiladi va yangilanadi, qolganlari qo‘shiladi. Ism yozilmagan
          qatorlar o‘tkazib yuboriladi. Telefon va email saytda hammaga ko‘rinadi — faqat xodim roziligi bilan yozing.
        </p>
      </div>
      <StaffImport existing={existing} />
    </>
  );
}
