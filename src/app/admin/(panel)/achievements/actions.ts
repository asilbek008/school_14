"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, schoolYear, text, type FormState } from "@/lib/admin";
import { achievementFields, achievementLevels } from "@/lib/categories";

export async function saveAchievement(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const title_uz = text(form, "title_uz");
  if (!title_uz) return { error: "O‘zbekcha nom majburiy." };
  const field = text(form, "field");
  const level = text(form, "level");
  if (!(achievementFields as readonly string[]).includes(field) || !(achievementLevels as readonly string[]).includes(level)) {
    return { error: "Turi va bosqichini tanlang." };
  }
  const achieved_on = text(form, "achieved_on");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(achieved_on)) return { error: "Sanani kiriting." };
  const place = Number.parseInt(text(form, "place"), 10);
  const names = optional(form, "names");
  const names_consent = form.get("names_consent") === "on";
  // Owner's rule: a pupil's name goes on the site only with the parents' consent.
  if (names && !names_consent) return { error: "O‘quvchi ismini yozish uchun ota-ona roziligini belgilang (yoki ismni o‘chiring)." };
  const teacherId = Number.parseInt(text(form, "teacher_id"), 10);

  const row = {
    title_uz,
    title_ru: optional(form, "title_ru"),
    title_en: optional(form, "title_en"),
    field,
    level,
    place: place >= 1 && place <= 3 ? place : null,
    result_uz: optional(form, "result_uz"),
    result_ru: optional(form, "result_ru"),
    result_en: optional(form, "result_en"),
    winner: optional(form, "winner"),
    names,
    names_consent: !!names && names_consent,
    teacher_id: teacherId > 0 ? teacherId : null,
    achieved_on,
    school_year: schoolYear(form),
    photo: optional(form, "photo"),
    is_published: form.get("is_published") === "on",
  };

  const { error } = id ? await supabase.from("achievements").update(row).eq("id", id) : await supabase.from("achievements").insert(row);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  redirect("/admin/achievements");
}

export async function deleteAchievement(id: number) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("achievements").select("photo").eq("id", id).maybeSingle();
  await supabase.from("achievements").delete().eq("id", id);
  if (data?.photo && !/^https?:\/\//.test(data.photo)) await supabase.storage.from("media").remove([data.photo]);
  revalidatePublic();
  redirect("/admin/achievements");
}
