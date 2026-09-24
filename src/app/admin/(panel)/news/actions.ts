"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, slugify, text, type FormState } from "@/lib/admin";
import { fromTashkentInput } from "@/lib/format";
import { newsCategories, type NewsCategory } from "@/lib/categories";

export async function saveNews(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const title_uz = text(form, "title_uz");
  if (!title_uz) return { error: "O‘zbekcha sarlavha majburiy." };

  const slug = slugify(text(form, "slug") || title_uz) || `yangilik-${Date.now()}`;
  const is_published = form.get("is_published") === "on";
  // Publishing without a date means "now"; the date stays editable for backdating.
  const published_at = fromTashkentInput(text(form, "published_at")) ?? (is_published ? new Date().toISOString() : null);

  const category = text(form, "category") as NewsCategory;
  if (!newsCategories.includes(category)) return { error: "Turkumni tanlang." };

  const row = {
    slug,
    category,
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

  const { data, error } = id
    ? await supabase.from("news").update(row).eq("id", id).select("id").single()
    : await supabase.from("news").insert(row).select("id").single();
  if (error) {
    if (error.code === "23505") return { error: `“${slug}” manzili band. Boshqa manzil (slug) kiriting.` };
    return { error: `Saqlab bo‘lmadi: ${error.message}` };
  }

  revalidatePublic();
  // A new article continues to its edit page, where the photo gallery can be added.
  redirect(id ? "/admin/news" : `/admin/news/${data.id}`);
}

export async function deleteNews(id: number) {
  const { supabase } = await requireAdmin();
  const { data: photos } = await supabase.from("news_photos").select("path").eq("news_id", id);
  await supabase.from("news").delete().eq("id", id); // photo rows cascade
  if (photos?.length) await supabase.storage.from("media").remove(photos.map((p) => p.path));
  revalidatePublic();
  redirect("/admin/news");
}

/** Called by the photo uploader after files are in storage (news/<id>/…). */
export async function addNewsPhotos(newsId: number, paths: string[]) {
  const { supabase } = await requireAdmin();
  const clean = paths.filter((p) => p.startsWith(`news/${newsId}/`));
  if (!clean.length) return;
  const { data: last } = await supabase
    .from("news_photos")
    .select("sort_order")
    .eq("news_id", newsId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.sort_order ?? 0) + 1;
  await supabase.from("news_photos").insert(clean.map((path, i) => ({ news_id: newsId, path, sort_order: start + i })));
  revalidatePublic();
  revalidatePath(`/admin/news/${newsId}`);
}

export async function deleteNewsPhoto(newsId: number, photoId: number) {
  const { supabase } = await requireAdmin();
  const { data: photo } = await supabase.from("news_photos").select("path").eq("id", photoId).eq("news_id", newsId).maybeSingle();
  if (!photo) return;
  await supabase.from("news_photos").delete().eq("id", photoId);
  await supabase.storage.from("media").remove([photo.path]);
  revalidatePublic();
  revalidatePath(`/admin/news/${newsId}`);
}
