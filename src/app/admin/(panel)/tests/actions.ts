"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { isTestSubject } from "@/lib/tests";
import { parseQuestionText, readQuestionFile, type ParsedQuestion } from "@/lib/test-import";

const isStoragePath = (p: string | null | undefined): p is string => !!p && !/^https?:\/\//.test(p);

export async function saveTest(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const title_uz = text(form, "title_uz");
  if (!title_uz) return { error: "O‘zbekcha nom majburiy." };
  const subject = text(form, "subject");
  if (!isTestSubject(subject)) return { error: "Fanni tanlang." };
  const kind = text(form, "kind") === "dtm" ? "dtm" : "mavzu";
  const grade = Number.parseInt(text(form, "grade"), 10);
  const timeLimit = Number.parseInt(text(form, "time_limit"), 10);
  if (text(form, "time_limit") && !(timeLimit >= 1 && timeLimit <= 300)) return { error: "Vaqt 1 dan 300 daqiqagacha bo‘lsin (yoki bo‘sh qoldiring)." };

  const row = {
    title_uz,
    title_ru: optional(form, "title_ru"),
    title_en: optional(form, "title_en"),
    description_uz: optional(form, "description_uz"),
    description_ru: optional(form, "description_ru"),
    description_en: optional(form, "description_en"),
    subject,
    kind,
    grade: grade >= 1 && grade <= 11 ? grade : null,
    time_limit: timeLimit >= 1 && timeLimit <= 300 ? timeLimit : null,
    is_published: form.get("is_published") === "on",
  };
  const { data, error } = id
    ? await supabase.from("tests").update(row).eq("id", id).select("id").single()
    : await supabase.from("tests").insert(row).select("id").single();
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  // A new test goes straight to its page, where the questions are added.
  redirect(id ? "/admin/tests" : `/admin/tests/${data.id}`);
}

export async function deleteTest(id: number) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("test_questions").select("image").eq("test_id", id);
  await supabase.from("tests").delete().eq("id", id);
  const images = (data ?? []).map((q) => q.image).filter(isStoragePath);
  if (images.length) await supabase.storage.from("media").remove(images);
  revalidatePublic();
  redirect("/admin/tests");
}

/** Question fields from the form: the text, options A…F (empty ones dropped), the right one, explanation, picture. */
function questionRow(form: FormData): { row?: Omit<ParsedQuestion, "line"> & { image: string | null }; error?: string } {
  const question = text(form, "question");
  if (!question) return { error: "Savol matnini yozing." };
  const letters = ["A", "B", "C", "D", "E", "F"];
  const filled = letters.map((l) => ({ l, v: text(form, `option_${l}`) })).filter((o) => o.v);
  if (filled.length < 2) return { error: "Kamida 2 ta variant yozing." };
  const correctLetter = text(form, "correct");
  const correct = filled.findIndex((o) => o.l === correctLetter);
  if (correct < 0) return { error: "To‘g‘ri javobni belgilang (to‘ldirilgan variantlardan biri)." };
  return {
    row: {
      question: question.slice(0, 4000),
      options: filled.map((o) => o.v.slice(0, 1000)),
      correct,
      explanation: optional(form, "explanation")?.slice(0, 4000) ?? null,
      image: optional(form, "image"),
    },
  };
}

export async function saveQuestion(testId: number, id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { row, error } = questionRow(form);
  if (!row) return { error };
  if (id) {
    const { data: old } = await supabase.from("test_questions").select("image").eq("id", id).maybeSingle();
    const { error: e } = await supabase.from("test_questions").update(row).eq("id", id).eq("test_id", testId);
    if (e) return { error: `Saqlab bo‘lmadi: ${e.message}` };
    if (isStoragePath(old?.image) && old.image !== row.image) await supabase.storage.from("media").remove([old.image]);
  } else {
    const { data: last } = await supabase.from("test_questions").select("sort_order").eq("test_id", testId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { error: e } = await supabase.from("test_questions").insert({ ...row, test_id: testId, sort_order: (last?.sort_order ?? 0) + 1 });
    if (e) return { error: `Saqlab bo‘lmadi: ${e.message}` };
  }
  revalidatePublic();
  // "Save and add another" keeps the admin on the new-question form.
  redirect(form.get("next") === "new" ? `/admin/tests/${testId}/questions/new?saved=1` : `/admin/tests/${testId}#questions`);
}

export async function deleteQuestion(testId: number, id: number) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("test_questions").select("image").eq("id", id).maybeSingle();
  await supabase.from("test_questions").delete().eq("id", id).eq("test_id", testId);
  if (isStoragePath(data?.image)) await supabase.storage.from("media").remove([data.image]);
  revalidatePublic();
  redirect(`/admin/tests/${testId}#questions`);
}

export type ImportResult = { error?: string; errors?: string[]; added?: number; removed?: number };

/** Adds the questions from pasted text or an .xlsx file; with "replace", the old ones are removed first. Any error → nothing saved. */
export async function importQuestions(testId: number, form: FormData): Promise<ImportResult> {
  const { supabase } = await requireAdmin();
  const file = form.get("file");
  const parsed =
    file instanceof File && file.size
      ? file.size > 5 * 1024 * 1024
        ? { questions: [], errors: ["Fayl 5 MB dan katta."] }
        : await readQuestionFile(file)
      : parseQuestionText(String(form.get("text") ?? "").slice(0, 500_000));
  if (parsed.errors.length) return { errors: parsed.errors };
  if (!parsed.questions.length) return { error: "Savol topilmadi." };
  if (parsed.questions.length > 1000) return { error: "Bir martada 1000 tadan ko‘p savol yuklab bo‘lmaydi." };

  let removed = 0;
  let start = 0;
  if (form.get("replace") === "on") {
    const { data: old } = await supabase.from("test_questions").select("id, image").eq("test_id", testId);
    const { error } = await supabase.from("test_questions").delete().eq("test_id", testId);
    if (error) return { error: `Eski savollarni o‘chirib bo‘lmadi: ${error.message}` };
    removed = old?.length ?? 0;
    const images = (old ?? []).map((q) => q.image).filter(isStoragePath);
    if (images.length) await supabase.storage.from("media").remove(images);
  } else {
    const { data: last } = await supabase.from("test_questions").select("sort_order").eq("test_id", testId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
    start = last?.sort_order ?? 0;
  }
  const rows = parsed.questions.map((q, i) => ({
    test_id: testId,
    question: q.question,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
    sort_order: start + i + 1,
  }));
  const { error } = await supabase.from("test_questions").insert(rows);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  return { added: rows.length, removed };
}
