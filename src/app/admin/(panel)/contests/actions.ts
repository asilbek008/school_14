"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { optional, requireAdmin, revalidatePublic, slugify, text, type FormState } from "@/lib/admin";
import { fromTashkentInput } from "@/lib/format";

/** Saves a contest. A new one gets its slug from the Uzbek title; an existing one keeps the slug it has. */
export async function saveContest(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const title = text(form, "title_uz");
  if (title.length < 3) return { error: "Nomini yozing." };

  const gradeFrom = Number(text(form, "grade_from")) || null;
  const gradeTo = Number(text(form, "grade_to")) || null;
  if (gradeFrom && gradeTo && gradeFrom > gradeTo) return { error: "Sinflar oralig‘i teskari: boshlanishi oxiridan katta." };

  // A date we copied from someone else's page is only as good as the link to it.
  const sourceUrl = optional(form, "source_url");
  const external = form.get("external") === "on";
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) return { error: "Havola https:// bilan boshlanishi kerak." };
  if (external && !sourceUrl) return { error: "Ro‘yxatdan o‘tish tashkilotchi saytida bo‘lsa, rasmiy e’lon havolasi kerak." };

  const row = {
    title_uz: title,
    title_ru: optional(form, "title_ru"),
    title_en: optional(form, "title_en"),
    description_uz: optional(form, "description_uz"),
    description_ru: optional(form, "description_ru"),
    description_en: optional(form, "description_en"),
    field: text(form, "field") || "boshqa",
    level: text(form, "level") || "maktab",
    grade_from: gradeFrom,
    grade_to: gradeTo,
    place: optional(form, "place"),
    starts_at: fromTashkentInput(text(form, "starts_at")),
    registration_until: fromTashkentInput(text(form, "registration_until")),
    contact: optional(form, "contact"),
    organizer: optional(form, "organizer"),
    source_url: sourceUrl,
    external,
    is_published: form.get("is_published") === "on",
    sort_order: Number(text(form, "sort_order")) || 0,
  };

  const { error } = id
    ? await supabase.from("contests").update(row).eq("id", id)
    : await supabase.from("contests").insert({ ...row, slug: slugify(title) || `tanlov-${Date.now()}` });
  if (error) return { error: `Saqlanmadi: ${error.message}` };

  revalidatePublic();
  revalidatePath("/admin/contests");
  redirect("/admin/contests");
}

export async function deleteContest(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("contests").delete().eq("id", id);
  revalidatePublic();
  revalidatePath("/admin/contests");
  redirect("/admin/contests");
}

export type EntryStatus = "new" | "accepted" | "declined";

export async function setEntryStatus(id: number, status: EntryStatus) {
  const { supabase } = await requireAdmin();
  await supabase.from("contest_entries").update({ status }).eq("id", id);
  revalidatePath("/admin/contests", "layout");
}

export async function deleteEntry(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("contest_entries").delete().eq("id", id);
  revalidatePath("/admin/contests", "layout");
}
