import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import CertificateList, { type CertificateItem } from "./CertificateList";

export const metadata: Metadata = { title: "Sertifikatlar" };

/** The certificates pupils chose to register, so a paper with a QR can be confirmed as ours. */
export default async function AdminCertificatesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("certificates")
    .select("id, code, name, test_title, percent, correct, total, issued_on, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const items: CertificateItem[] = (data ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    test: c.test_title,
    percent: c.percent,
    correct: c.correct,
    total: c.total,
    issued: formatDate(c.issued_on, "uz"),
    created: formatDateTime(c.created_at, "uz"),
  }));

  return (
    <>
      <AdminHeader title="Sertifikatlar" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Test sertifikatlari odatda hech qayerda saqlanmaydi — ular brauzerda chiziladi. Bu yerda faqat o‘quvchi «Tekshirish uchun
        ro‘yxatdan o‘tkazish» katagini belgilagan sertifikatlar bor: ularda QR kod bo‘ladi va har kim saytdan haqiqiyligini
        tekshira oladi. Noto‘g‘ri yoki hazil uchun kiritilgan yozuvni o‘chirib tashlashingiz mumkin — shunda uning sertifikati
        «topilmadi» bo‘lib qoladi.
      </p>
      {items.length ? (
        <CertificateList items={items} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali ro‘yxatdan o‘tkazilgan sertifikat yo‘q.</p>
      )}
    </>
  );
}
