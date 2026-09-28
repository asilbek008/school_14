import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import ReferenceList, { type ReferenceItem } from "./ReferenceList";

export const metadata: Metadata = { title: "Ma’lumotnoma buyurtmalari" };

export default async function AdminReferencesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("reference_requests")
    .select("id, code, kind, child_name, grade, parent_name, phone, purpose, note, admin_note, status, created_at, ready_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const items: ReferenceItem[] = (data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    kind: r.kind,
    childName: r.child_name,
    grade: r.grade,
    parentName: r.parent_name,
    phone: r.phone,
    purpose: r.purpose,
    note: r.note,
    adminNote: r.admin_note,
    status: r.status,
    date: formatDateTime(r.created_at, "uz"),
    readyDate: r.ready_at ? formatDateTime(r.ready_at, "uz") : null,
  }));

  return (
    <>
      <AdminHeader title="Ma’lumotnoma buyurtmalari" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytdagi «Ma’lumotnoma buyurtma qilish» formasi orqali kelgan so‘rovlar. Bu bolaning shaxsiy ma’lumoti — saytda ko‘rinmaydi,
        faqat shu yerda. Qog‘ozni tayyorlash uchun{" "}
        <Link href="/admin/docgen" className="font-semibold text-blue-700 hover:underline">
          Hujjat tayyorlash
        </Link>{" "}
        bo‘limidan foydalaning, so‘ng holatni «Tayyor» qiling — ota-ona buni o‘z kodi bilan saytda ko‘radi.
      </p>
      {items.length ? (
        <ReferenceList items={items} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali buyurtma kelmagan.</p>
      )}
    </>
  );
}
