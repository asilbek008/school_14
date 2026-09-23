"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { fromTashkentInput } from "@/lib/format";
import { eventCategories, type EventCategory } from "@/lib/categories";

export async function saveEvent(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const title_uz = text(form, "title_uz");
  const all_day = form.get("all_day") === "on";
  const category = text(form, "category") as EventCategory;
  // All-day events: take only the date and store 00:00–23:59 Tashkent time.
  const date = text(form, "starts_at").slice(0, 10);
  const starts_at = all_day ? fromTashkentInput(date && `${date}T00:00`) : fromTashkentInput(text(form, "starts_at"));
  const ends_at = all_day ? fromTashkentInput(date && `${date}T23:59`) : fromTashkentInput(text(form, "ends_at"));
  if (!title_uz) return { error: "O‘zbekcha nom majburiy." };
  if (!eventCategories.includes(category)) return { error: "Turkumni tanlang." };
  if (!starts_at) return { error: "Sanani kiriting." };
  if (ends_at && ends_at < starts_at) return { error: "Tugash vaqti boshlanishdan oldin bo‘lishi mumkin emas." };

  const row = {
    title_uz,
    title_ru: optional(form, "title_ru"),
    title_en: optional(form, "title_en"),
    description_uz: text(form, "description_uz"),
    description_ru: optional(form, "description_ru"),
    description_en: optional(form, "description_en"),
    location: optional(form, "location"),
    category,
    all_day,
    starts_at,
    ends_at,
    is_published: form.get("is_published") === "on",
  };

  const { error } = id
    ? await supabase.from("events").update(row).eq("id", id)
    : await supabase.from("events").insert(row);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };

  revalidatePublic();
  redirect("/admin/events");
}

export async function deleteEvent(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("events").delete().eq("id", id);
  revalidatePublic();
  redirect("/admin/events");
}
