import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import ClubForm from "../ClubForm";

export const metadata: Metadata = { title: "To‘garak qo‘shish" };

export default async function NewClubPage() {
  const { supabase } = await requireAdmin();
  const { data: staff } = await supabase.from("staff").select("id, full_name, position_uz").order("full_name");
  return (
    <>
      <AdminHeader title="To‘garak qo‘shish" back="/admin/clubs" />
      <ClubForm staff={staff ?? []} />
    </>
  );
}
