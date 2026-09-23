"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, slugify, text, type FormState } from "@/lib/admin";
import { fromTashkentInput } from "@/lib/format";

export async function saveNews(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const title_uz = text(form, "title_uz");
  if (!title_uz) return { error: "O‘zbekcha sarlavha majburiy." };

  const slug = slugify(text(form, "slug") || title_uz) || `yangilik-${Date.now()}`;
  const is_published = form.get("is_published") === "on";
  // Publishing without a date means "now"; the date stays editable for backdating.
  const published_at = fromTashkentInput(text(form, "published_at")) ?? (is_published ? new Date().toISOString() : null);

  const row = {
    slug,
    title_uz,
    title_ru: optional(form, "title_ru"),
    title_en: optional(form, "title_en"),
    body_uz: text(form, "body_uz"),
    body_ru: optional(form, "body_ru"),
    body_en: optional(form, "body_en"),
    cover_image: optional(form, "cover_image"),
    is_published,
    published_at,
  };

  const { error } = id
    ? await supabase.from("news").update(row).eq("id", id)
    : await supabase.from("news").insert(row);
  if (error) {
    if (error.code === "23505") return { error: `“${slug}” manzili band. Boshqa manzil (slug) kiriting.` };
    return { error: `Saqlab bo‘lmadi: ${error.message}` };
  }

  revalidatePublic();
  redirect("/admin/news");
}

export async function deleteNews(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("news").delete().eq("id", id);
  revalidatePublic();
  redirect("/admin/news");
}
