"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { fromTashkentInput } from "@/lib/format";

const audiences = ["hamma", "ota-ona", "oquvchi", "oqituvchi"];
const kinds = ["single", "multi", "scale", "text"];

/** One option per line in the form; empty lines are dropped. */
const lines = (form: FormData, name: string): string[] =>
  String(form.get(name) ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12);

export async function saveSurvey(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const title_uz = text(form, "title_uz");
  if (!title_uz) return { error: "O‘zbekcha nom majburiy." };
  const audience = text(form, "audience");
  if (!audiences.includes(audience)) return { error: "Kim uchun ekanini tanlang." };
  const closes = text(form, "closes_at");
  const closes_at = closes ? fromTashkentInput(closes) : null;
  if (closes && !closes_at) return { error: "Yopilish sanasi noto‘g‘ri." };

  const row = {
    title_uz,
    title_ru: optional(form, "title_ru"),
    title_en: optional(form, "title_en"),
    description_uz: optional(form, "description_uz"),
    description_ru: optional(form, "description_ru"),
    description_en: optional(form, "description_en"),
    audience,
    closes_at,
    is_published: form.get("is_published") === "on",
  };

  if (id) {
    const { error } = await supabase.from("surveys").update(row).eq("id", id);
    if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
    revalidatePublic();
    redirect("/admin/surveys");
  }
  const { data, error } = await supabase.from("surveys").insert(row).select("id").single();
  if (error || !data) return { error: `Saqlab bo‘lmadi: ${error?.message}` };
  revalidatePublic();
  // A new survey has no questions yet, so go straight to where they are added.
  redirect(`/admin/surveys/${data.id}`);
}

export async function deleteSurvey(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("surveys").delete().eq("id", id);
  revalidatePublic();
  redirect("/admin/surveys");
}

export async function saveQuestion(surveyId: number, questionId: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const question_uz = text(form, "question_uz");
  if (!question_uz) return { error: "Savol matni majburiy." };
  const kind = text(form, "kind");
  if (!kinds.includes(kind)) return { error: "Savol turini tanlang." };
  const options_uz = lines(form, "options_uz");
  if ((kind === "single" || kind === "multi") && options_uz.length < 2) {
    return { error: "Kamida ikkita variant yozing (har biri alohida qatorda)." };
  }
  const options_ru = lines(form, "options_ru");
  const options_en = lines(form, "options_en");
  if (options_ru.length && options_ru.length !== options_uz.length) return { error: "Ruscha variantlar soni o‘zbekchasi bilan bir xil bo‘lsin." };
  if (options_en.length && options_en.length !== options_uz.length) return { error: "Inglizcha variantlar soni o‘zbekchasi bilan bir xil bo‘lsin." };

  const row = {
    survey_id: surveyId,
    question_uz,
    question_ru: optional(form, "question_ru"),
    question_en: optional(form, "question_en"),
    kind,
    options_uz: kind === "single" || kind === "multi" ? options_uz : [],
    options_ru: kind === "single" || kind === "multi" ? options_ru : [],
    options_en: kind === "single" || kind === "multi" ? options_en : [],
    required: form.get("required") === "on",
    sort_order: Number(text(form, "sort_order")) || 0,
  };

  const { error } = questionId
    ? await supabase.from("survey_questions").update(row).eq("id", questionId)
    : await supabase.from("survey_questions").insert(row);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  redirect(`/admin/surveys/${surveyId}`);
}

export async function deleteQuestion(surveyId: number, questionId: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("survey_questions").delete().eq("id", questionId);
  revalidatePublic();
  redirect(`/admin/surveys/${surveyId}`);
}
