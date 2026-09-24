"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { normalizeName, readStaffFile, sortOrderFor } from "@/lib/staff-import";

export async function saveStaff(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const full_name = text(form, "full_name");
  const position_uz = text(form, "position_uz");
  if (!full_name || !position_uz) return { error: "Ism-familiya va o‘zbekcha lavozim majburiy." };

  const experience = text(form, "experience_years");
  const experience_years = experience ? Number.parseInt(experience, 10) : null;
  if (experience_years != null && !(experience_years >= 0 && experience_years <= 70)) {
    return { error: "Ish staji 0 dan 70 gacha bo‘lgan son bo‘lishi kerak." };
  }

  const row = {
    full_name,
    short_name: optional(form, "short_name"),
    position_uz,
    position_ru: optional(form, "position_ru"),
    position_en: optional(form, "position_en"),
    subject_uz: optional(form, "subject_uz"),
    subject_ru: optional(form, "subject_ru"),
    subject_en: optional(form, "subject_en"),
    photo: optional(form, "photo"),
    category_uz: optional(form, "category_uz"),
    category_ru: optional(form, "category_ru"),
    category_en: optional(form, "category_en"),
    education_uz: optional(form, "education_uz"),
    education_ru: optional(form, "education_ru"),
    education_en: optional(form, "education_en"),
    experience_years,
    phone: optional(form, "phone"),
    email: optional(form, "email"),
    bio_uz: optional(form, "bio_uz"),
    bio_ru: optional(form, "bio_ru"),
    bio_en: optional(form, "bio_en"),
    sort_order: Number.parseInt(text(form, "sort_order"), 10) || 0,
    is_published: form.get("is_published") === "on",
  };

  const { error } = id
    ? await supabase.from("staff").update(row).eq("id", id)
    : await supabase.from("staff").insert(row);
  if (error?.code === "23505") return { error: "Bu eMaktab nomi boshqa xodimda bor." };
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

export type ImportResult = {
  error?: string;
  /** Rows that must be fixed in the file; nothing is saved while there are any. */
  errors?: string[];
  added?: number;
  updated?: number;
  homerooms?: number;
  warnings?: string[];
};

/**
 * Adds or updates staff from the Excel file. A row matches an existing person by eMaktab name,
 * then by full name; empty cells leave the stored value as is. "Sinf rahbari" sets the classes'
 * homeroom teacher.
 */
export async function importStaff(form: FormData): Promise<ImportResult> {
  const { supabase } = await requireAdmin();

  const file = form.get("file");
  if (!(file instanceof Blob) || !file.size) return { error: "Fayl tanlanmagan." };
  if (file.size > 900_000) return { error: "Fayl juda katta (900 KB gacha bo‘lsin)." };
  const { rows, errors } = await readStaffFile(file);
  if (errors.length) return { errors };
  if (!rows.length) return { error: "Faylda to‘liq ism-familiya yozilgan qator yo‘q." };

  const [{ data: staff, error }, { data: classes, error: classError }] = await Promise.all([
    supabase.from("staff").select("id, full_name, short_name"),
    supabase.from("school_classes").select("id, grade, letter"),
  ]);
  if (error || classError) return { error: `Bazani o‘qib bo‘lmadi: ${(error ?? classError)!.message}` };
  const byShort = new Map<string, number>();
  const byFull = new Map<string, number>();
  for (const person of staff) {
    if (person.short_name) byShort.set(normalizeName(person.short_name), person.id);
    byFull.set(normalizeName(person.full_name), person.id);
  }
  const classIds = new Map(classes.map((c) => [`${c.grade}-${c.letter.toUpperCase()}`, c.id]));

  let added = 0;
  let updated = 0;
  let homerooms = 0;
  const warnings: string[] = [];
  for (const row of rows) {
    const { line, homeroom, ...values } = row;
    const where = `${line}-qator (${row.full_name})`;
    // Only filled cells are written, so a partly filled file never erases data.
    const fields = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== null));
    let id = (row.short_name && byShort.get(normalizeName(row.short_name))) || byFull.get(normalizeName(row.full_name));

    if (id) {
      const { error } = await supabase.from("staff").update(fields).eq("id", id);
      if (error) {
        warnings.push(`${where}: ${error.code === "23505" ? "bu eMaktab nomi boshqa xodimda bor" : error.message}`);
        continue;
      }
      updated++;
    } else {
      if (!row.position_uz) {
        warnings.push(`${where}: lavozimi yozilmagan — qo‘shilmadi`);
        continue;
      }
      const { data, error } = await supabase
        .from("staff")
        .insert({ ...fields, is_published: row.is_published ?? true, sort_order: sortOrderFor(row.position_uz) })
        .select("id")
        .single();
      if (error) {
        warnings.push(`${where}: ${error.code === "23505" ? "bu eMaktab nomi boshqa xodimda bor" : error.message}`);
        continue;
      }
      id = data.id;
      added++;
    }
    if (row.short_name) byShort.set(normalizeName(row.short_name), id!);
    byFull.set(normalizeName(row.full_name), id!);

    for (const label of homeroom) {
      const classId = classIds.get(label);
      if (!classId) {
        warnings.push(`${where}: ${label} sinfi saytda yo‘q — sinf rahbari yozilmadi`);
        continue;
      }
      const { error } = await supabase.from("school_classes").update({ homeroom_teacher_id: id }).eq("id", classId);
      if (error) warnings.push(`${where}: ${label} — ${error.message}`);
      else homerooms++;
    }
  }

  revalidatePublic();
  return { added, updated, homerooms, warnings };
}
