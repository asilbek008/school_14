"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

export async function saveStaff(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const full_name = text(form, "full_name");
  const position_uz = text(form, "position_uz");
  if (!full_name || !position_uz) return { error: "Ism-familiya va o‘zbekcha lavozim majburiy." };

  const row = {
    full_name,
    position_uz,
    position_ru: optional(form, "position_ru"),
    position_en: optional(form, "position_en"),
    subject_uz: optional(form, "subject_uz"),
    subject_ru: optional(form, "subject_ru"),
    subject_en: optional(form, "subject_en"),
    photo: optional(form, "photo"),
    sort_order: Number.parseInt(text(form, "sort_order"), 10) || 0,
    is_published: form.get("is_published") === "on",
  };

  const { error } = id
    ? await supabase.from("staff").update(row).eq("id", id)
    : await supabase.from("staff").insert(row);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };

  revalidatePublic();
  redirect("/admin/staff");
}

export async function deleteStaff(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("staff").delete().eq("id", id);
  revalidatePublic();
  redirect("/admin/staff");
}
