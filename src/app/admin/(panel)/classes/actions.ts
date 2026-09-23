"use server";

import { redirect } from "next/navigation";
import { requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { LESSONS_PER_SHIFT } from "@/lib/bells";
import { WEEKDAYS } from "@/lib/timetable";

function readGrade(form: FormData) {
  const grade = Number.parseInt(text(form, "grade"), 10);
  return grade >= 1 && grade <= 11 ? grade : null;
}

const homeroom = (form: FormData) => Number.parseInt(text(form, "homeroom_teacher_id"), 10) || null;

/** New classes: several letters at once ("A, B, D" → 5-A, 5-B, 5-D). Editing: exactly one letter. */
export async function saveClass(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const grade = readGrade(form);
  if (!grade) return { error: "Sinfni (1–11) tanlang." };
  const letters = [...new Set(text(form, "letter").toUpperCase().split(/[\s,;]+/).filter(Boolean))];
  if (!letters.length) return { error: "Sinf harfini yozing (masalan, A)." };
  if (id && letters.length > 1) return { error: "Tahrirlashda faqat bitta harf yozing." };
  if (letters.some((l) => l.length > 8)) return { error: "Harf juda uzun (8 belgigacha)." };

  const base = {
    grade,
    homeroom_teacher_id: homeroom(form),
    is_published: form.get("is_published") === "on",
  };

  if (id) {
    const { error } = await supabase.from("school_classes").update({ ...base, letter: letters[0] }).eq("id", id);
    if (error) return { error: error.code === "23505" ? `${grade}-${letters[0]} sinfi allaqachon bor.` : `Saqlab bo‘lmadi: ${error.message}` };
    revalidatePublic();
    redirect(`/admin/classes/${id}`);
  }

  // One homeroom teacher can't lead several new classes at once; keep it for a single class only.
  const rows = letters.map((letter) => ({ ...base, letter, homeroom_teacher_id: letters.length === 1 ? base.homeroom_teacher_id : null }));
  const { data, error } = await supabase.from("school_classes").insert(rows).select("id");
  if (error) return { error: error.code === "23505" ? "Bu sinflardan biri allaqachon bor." : `Saqlab bo‘lmadi: ${error.message}` };

  revalidatePublic();
  // A single new class goes straight to its timetable; several go back to the list.
  redirect(data.length === 1 ? `/admin/classes/${data[0].id}` : "/admin/classes");
}

export async function deleteClass(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("school_classes").delete().eq("id", id);
  revalidatePublic();
  redirect("/admin/classes");
}

/** Saves the whole weekly grid: filled cells are upserted, cleared cells are deleted. */
export async function saveTimetable(classId: number, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const rows = [];
  for (const weekday of WEEKDAYS) {
    for (let period = 1; period <= LESSONS_PER_SHIFT; period++) {
      const subject_id = Number.parseInt(text(form, `l-${weekday}-${period}`), 10);
      if (subject_id) rows.push({ class_id: classId, weekday, period, subject_id });
    }
  }

  let kept: number[] = [];
  if (rows.length) {
    const { data, error } = await supabase
      .from("lessons")
      .upsert(rows, { onConflict: "class_id,weekday,period" })
      .select("id");
    if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
    kept = data.map((r) => r.id);
  }

  let cleanup = supabase.from("lessons").delete().eq("class_id", classId);
  if (kept.length) cleanup = cleanup.not("id", "in", `(${kept.join(",")})`);
  const { error } = await cleanup;
  if (error) return { error: `Bo‘sh kataklarni tozalab bo‘lmadi: ${error.message}` };

  revalidatePublic();
  redirect(`/admin/classes/${classId}?saved=1`);
}
