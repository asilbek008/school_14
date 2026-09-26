"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { graduatingRows, readPupilFile } from "@/lib/pupil-import";

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

export type GraduateImportResult = { error?: string; errors?: string[]; saved?: number };

/**
 * One year's graduates from an eMaktab pupil list: when the file has 11th grades (a whole-school list), only they are
 * taken. The year's old list is replaced; nothing is saved if the file has errors.
 */
export async function importGraduates(form: FormData): Promise<GraduateImportResult> {
  const { supabase } = await requireAdmin();

  const year = Number(text(form, "year"));
  if (!Number.isInteger(year) || year < 1976 || year > new Date().getFullYear() + 1) return { error: "Bitiruv yilini tanlang." };
  const file = form.get("file");
  if (!(file instanceof Blob) || !file.size) return { error: "Fayl tanlanmagan." };
  if (file.size > 900_000) return { error: "Fayl juda katta (900 KB gacha bo‘lsin)." };
  const { rows, errors } = await readPupilFile(file);
  if (errors.length) return { errors };
  const list = graduatingRows(rows);

  const { data: saved, error } = await supabase.rpc("replace_graduates", {
    p_year: year,
    p_rows: list.map((r) => ({ class_label: r.cls, full_name: r.full_name, display_name: r.display_name, gender: r.gender ?? "", birth_date: r.birth_date })),
  });
  // The message only — never the rows (personal data).
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  return { saved: saved ?? list.length };
}

export async function deleteGraduateYear(year: number) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("replace_graduates", { p_year: year, p_rows: [] });
  if (error) throw new Error(error.message);
  revalidatePublic();
  redirect("/admin/alumni/graduates");
}
