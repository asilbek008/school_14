import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import StaffForm from "../StaffForm";
import { deleteStaff } from "../actions";

export const metadata: Metadata = { title: "Tahrirlash" };

export default async function EditStaffPage({ params }: PageProps<"/admin/staff/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { data: row } = await supabase.from("staff").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={row.full_name} back="/admin/staff" />
      <StaffForm row={row} />
      <div className="mt-4 text-right">
        <DeleteButton action={deleteStaff.bind(null, id)} confirmText="Ro‘yxatdan o‘chirasizmi?" />
      </div>
    </>
  );
}
