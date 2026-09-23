"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

export async function saveSubject(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const name_uz = text(form, "name_uz");
  if (!name_uz) return { error: "O‘zbekcha nomi majburiy." };

  const row = {
    name_uz,
    name_ru: optional(form, "name_ru"),
    name_en: optional(form, "name_en"),
    sort_order: Number.parseInt(text(form, "sort_order"), 10) || 0,
  };

  const { error } = id
    ? await supabase.from("subjects").update(row).eq("id", id)
    : await supabase.from("subjects").insert(row);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };

  revalidatePublic();
  redirect("/admin/subjects");
}

export async function deleteSubject(id: number) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  // 23503 = foreign key violation: the subject is still used in some timetable.
  if (error) redirect(`/admin/subjects/${id}?error=${error.code === "23503" ? "used" : "failed"}`);
  revalidatePublic();
  redirect("/admin/subjects");
}
