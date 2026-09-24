import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import ApplicationList, { type ApplicationItem } from "./ApplicationList";
import type { ApplicationStatus } from "./actions";

export const metadata: Metadata = { title: "Qabul arizalari" };

export default async function AdminApplicationsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("admission_applications")
    .select("id, child_name, child_birth_date, grade, parent_name, phone, address, previous_school, note, admin_note, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const items: ApplicationItem[] = (data ?? []).map((a) => ({
    id: a.id,
    childName: a.child_name,
    birth: formatDate(a.child_birth_date, "uz"),
    grade: a.grade,
    parentName: a.parent_name,
    phone: a.phone,
    address: a.address,
    previousSchool: a.previous_school,
    note: a.note,
    adminNote: a.admin_note,
    status: a.status as ApplicationStatus,
    date: formatDateTime(a.created_at, "uz"),
  }));

  return (
    <>
      <AdminHeader title="Qabul arizalari" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytdagi «Onlayn ariza» formasi orqali kelgan arizalar. Bu bolaning shaxsiy ma’lumoti — saytda ko‘rinmaydi, faqat shu yerda.
        Ota-ona bilan bog‘langandan so‘ng holatni o‘zgartiring.
      </p>
      {items.length ? (
        <ApplicationList items={items} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali ariza kelmagan.</p>
      )}
    </>
  );
}
