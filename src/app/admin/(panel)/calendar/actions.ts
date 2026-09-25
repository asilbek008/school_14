"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

const kinds = ["chorak", "tatil", "imtihon", "boshqa"];
const isDay = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function savePeriod(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const title_uz = text(form, "title_uz");
  if (!title_uz) return { error: "O‘zbekcha nom majburiy." };
  const kind = text(form, "kind");
  if (!kinds.includes(kind)) return { error: "Turini tanlang." };
  const starts_on = text(form, "starts_on");
  const ends_on = text(form, "ends_on") || starts_on;
  if (!isDay(starts_on) || !isDay(ends_on)) return { error: "Boshlanish sanasini kiriting." };
  if (ends_on < starts_on) return { error: "Tugash sanasi boshlanishidan oldin bo‘lmasin." };

  const row = {
    kind,
    title_uz,
    title_ru: optional(form, "title_ru"),
    title_en: optional(form, "title_en"),
    note_uz: optional(form, "note_uz"),
    note_ru: optional(form, "note_ru"),
    note_en: optional(form, "note_en"),
    starts_on,
    ends_on,
    is_published: form.get("is_published") === "on",
  };

  const { error } = id ? await supabase.from("calendar_periods").update(row).eq("id", id) : await supabase.from("calendar_periods").insert(row);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  redirect("/admin/calendar");
}

export async function deletePeriod(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("calendar_periods").delete().eq("id", id);
  revalidatePublic();
  redirect("/admin/calendar");
}
