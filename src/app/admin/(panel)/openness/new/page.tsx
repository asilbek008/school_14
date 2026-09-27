import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import OpennessForm from "../OpennessForm";

export const metadata: Metadata = { title: "Ochiqlikka qo‘shish" };

export default async function NewOpennessPage() {
  const { supabase } = await requireAdmin();
  const { data: documents } = await supabase.from("documents").select("id, title_uz").order("title_uz");
  return (
    <>
      <AdminHeader title="Ochiqlikka qo‘shish" back="/admin/openness" />
      <OpennessForm documents={documents ?? []} />
    </>
  );
}
