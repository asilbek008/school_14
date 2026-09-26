"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

export async function saveAlumnus(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const full_name = text(form, "full_name");
  if (full_name.length < 2) return { error: "Ism-familiyani yozing." };
  const graduation_year = Number(text(form, "graduation_year"));
  if (!Number.isInteger(graduation_year) || graduation_year < 1976 || graduation_year > new Date().getFullYear() + 1) {
    return { error: "Bitirgan yilini to‘g‘ri kiriting (1976 dan)." };
  }
  const consent = form.get("consent") === "on";
  const is_published = form.get("is_published") === "on";
  // A graduate is shown only with their own consent (the table refuses it too).
  if (is_published && !consent) return { error: "Saytda ko‘rsatish uchun bitiruvchining roziligini belgilang (yoki «E’lon qilish»ni olib tashlang)." };

  const row = {
    full_name,
    graduation_year,
    class_label: optional(form, "class_label"),
    occupation_uz: optional(form, "occupation_uz"),
    occupation_ru: optional(form, "occupation_ru"),
    occupation_en: optional(form, "occupation_en"),
    story_uz: text(form, "story_uz"),
    story_ru: optional(form, "story_ru"),
    story_en: optional(form, "story_en"),
    photo: optional(form, "photo"),
    consent,
    is_published,
  };
  const { error } = id ? await supabase.from("alumni").update(row).eq("id", id) : await supabase.from("alumni").insert(row);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  redirect("/admin/alumni");
}

export async function deleteAlumnus(id: number) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("alumni").select("photo").eq("id", id).maybeSingle();
  await supabase.from("alumni").delete().eq("id", id);
  if (data?.photo && !/^https?:\/\//.test(data.photo)) await supabase.storage.from("media").remove([data.photo]);
  revalidatePublic();
  redirect("/admin/alumni");
}
