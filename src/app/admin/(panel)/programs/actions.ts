"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

export async function saveProgram(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const name_uz = text(form, "name_uz");
  if (!name_uz) return { error: "O‘zbekcha nom majburiy." };
  const slug = text(form, "slug").toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Havola nomi faqat lotin harflari, raqamlar va chiziqchadan iborat bo‘lsin (masalan: zakovat)." };
  }
  const keyword = optional(form, "keyword");
  if (keyword && !/^[\p{L}\p{N} ‘’'-]{3,40}$/u.test(keyword)) {
    return { error: "Kalit so‘z 3–40 belgi bo‘lsin: harf, raqam, bo‘sh joy yoki chiziqcha." };
  }

  const row = {
    slug,
    name_uz,
    name_ru: optional(form, "name_ru"),
    name_en: optional(form, "name_en"),
    summary_uz: text(form, "summary_uz"),
    summary_ru: optional(form, "summary_ru"),
    summary_en: optional(form, "summary_en"),
    description_uz: text(form, "description_uz"),
    description_ru: optional(form, "description_ru"),
    description_en: optional(form, "description_en"),
    schedule_uz: optional(form, "schedule_uz"),
    schedule_ru: optional(form, "schedule_ru"),
    schedule_en: optional(form, "schedule_en"),
    place_uz: optional(form, "place_uz"),
    place_ru: optional(form, "place_ru"),
    place_en: optional(form, "place_en"),
    keyword,
    cover: optional(form, "cover"),
    sort_order: Number.parseInt(text(form, "sort_order"), 10) || 0,
    is_published: form.get("is_published") === "on",
  };

  const { error } = id
    ? await supabase.from("programs").update(row).eq("id", id)
    : await supabase.from("programs").insert(row);
  if (error?.code === "23505") return { error: "Bu havola nomi band — boshqasini tanlang." };
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };

  revalidatePublic();
  redirect("/admin/programs");
}

export async function deleteProgram(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("programs").delete().eq("id", id);
  revalidatePublic();
  redirect("/admin/programs");
}
