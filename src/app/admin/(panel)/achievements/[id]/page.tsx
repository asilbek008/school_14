import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import AchievementForm, { type AchievementRow } from "../AchievementForm";
import { deleteAchievement } from "../actions";

export const metadata: Metadata = { title: "Yutuqni tahrirlash" };

export default async function EditAchievementPage({ params }: PageProps<"/admin/achievements/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: row }, { data: staff }] = await Promise.all([
    supabase.from("achievements").select("*").eq("id", id).maybeSingle(),
    supabase.from("staff").select("id, full_name").order("full_name"),
  ]);
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={row.title_uz} back="/admin/achievements" />
      <AchievementForm row={row as AchievementRow} staff={staff ?? []} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteAchievement.bind(null, id)} confirmText="Bu yutuqni o‘chirasizmi?" />
      </div>
    </>
  );
}
