"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

const grade = (form: FormData, name: string) => {
  const n = Number.parseInt(text(form, name), 10);
  return n >= 1 && n <= 11 ? n : null;
};

export async function saveClub(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const name_uz = text(form, "name_uz");
  if (!name_uz) return { error: "O‘zbekcha nom majburiy." };
  const grade_from = grade(form, "grade_from");
  const grade_to = grade(form, "grade_to");
  if (grade_from && grade_to && grade_from > grade_to) return { error: "Sinflar oralig‘i noto‘g‘ri." };

  const row = {
    name_uz,
    name_ru: optional(form, "name_ru"),
    name_en: optional(form, "name_en"),
    description_uz: text(form, "description_uz"),
    description_ru: optional(form, "description_ru"),
    description_en: optional(form, "description_en"),
    schedule_uz: optional(form, "schedule_uz"),
    schedule_ru: optional(form, "schedule_ru"),
    schedule_en: optional(form, "schedule_en"),
    place_uz: optional(form, "place_uz"),
    place_ru: optional(form, "place_ru"),
    place_en: optional(form, "place_en"),
    grade_from,
    grade_to,
    leader: optional(form, "leader"),
    photo: optional(form, "photo"),
    sort_order: Number.parseInt(text(form, "sort_order"), 10) || 0,
    is_published: form.get("is_published") === "on",
  };

  const { error } = id
    ? await supabase.from("clubs").update(row).eq("id", id)
    : await supabase.from("clubs").insert(row);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };

  revalidatePublic();
  redirect("/admin/clubs");
}

export async function deleteClub(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("clubs").delete().eq("id", id);
  revalidatePublic();
  redirect("/admin/clubs");
}
