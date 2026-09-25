import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import AchievementForm from "../AchievementForm";

export const metadata: Metadata = { title: "Yutuq qo‘shish" };

export default async function NewAchievementPage() {
  const { supabase } = await requireAdmin();
  const { data: staff } = await supabase.from("staff").select("id, full_name").order("full_name");
  return (
    <>
      <AdminHeader title="Yutuq qo‘shish" back="/admin/achievements" />
      <AchievementForm staff={staff ?? []} />
    </>
  );
}
