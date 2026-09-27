"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

const categories = ["byudjet", "homiylik", "xarid", "hisobot", "boshqa"];

export async function saveOpenness(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const title_uz = text(form, "title_uz");
  if (!title_uz) return { error: "O‘zbekcha nom majburiy." };
  const category = text(form, "category");
  if (!categories.includes(category)) return { error: "Bo‘limni tanlang." };

  const amountText = text(form, "amount").replace(/[\s ']/g, "");
  const amount = amountText ? Number(amountText) : null;
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) return { error: "Summani faqat raqam bilan yozing." };
  const url = optional(form, "url");
  if (url && !/^https?:\/\//.test(url)) return { error: "Havola https:// bilan boshlansin." };
  const documentId = Number(text(form, "document_id")) || null;

  const row = {
    category,
    title_uz,
    title_ru: optional(form, "title_ru"),
    title_en: optional(form, "title_en"),
    note_uz: optional(form, "note_uz"),
    note_ru: optional(form, "note_ru"),
    note_en: optional(form, "note_en"),
    amount,
    period: optional(form, "period"),
    happened_on: optional(form, "happened_on"),
    document_id: documentId,
    url,
    sort_order: Number(text(form, "sort_order")) || 0,
    is_published: form.get("is_published") === "on",
  };

  const { error } = id ? await supabase.from("openness_items").update(row).eq("id", id) : await supabase.from("openness_items").insert(row);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  redirect("/admin/openness");
}

export async function deleteOpenness(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("openness_items").delete().eq("id", id);
  revalidatePublic();
  redirect("/admin/openness");
}
