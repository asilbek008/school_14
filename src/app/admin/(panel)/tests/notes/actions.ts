"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

const back = (subject: string) => `/admin/tests/notes?s=${encodeURIComponent(subject)}`;

/** A topic's short lesson (one per subject + topic; saving again replaces it). */
export async function saveNote(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const subject = text(form, "subject");
  const topic = text(form, "topic");
  const body_uz = text(form, "body_uz");
  if (!subject || !topic) return { error: "Fan va mavzu kerak." };
  if (body_uz.length < 20) return { error: "O‘zbekcha matnni yozing (kamida 20 belgi)." };
  const { error } = await supabase.from("study_notes").upsert(
    {
      subject,
      topic,
      body_uz,
      body_ru: optional(form, "body_ru"),
      body_en: optional(form, "body_en"),
      is_published: form.get("is_published") === "on",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "subject,topic" },
  );
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  redirect(back(subject));
}

export async function deleteNote(subject: string, topic: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("study_notes").delete().eq("subject", subject).eq("topic", topic);
  if (error) throw new Error(error.message);
  revalidatePublic();
  redirect(back(subject));
}
