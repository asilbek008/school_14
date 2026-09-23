import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import ClassForm from "../ClassForm";

export const metadata: Metadata = { title: "Sinf qo‘shish" };

export default async function NewClassPage() {
  const { supabase } = await requireAdmin();
  const { data: staff } = await supabase.from("staff").select("id, full_name").order("full_name");
  return (
    <>
      <AdminHeader title="Sinf qo‘shish" back="/admin/classes" />
      <ClassForm staff={staff ?? []} />
    </>
  );
}
