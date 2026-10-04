"use server";

import { redirect } from "next/navigation";
import { videoCategories } from "@/lib/categories";
import { youtubeId } from "@/lib/media";
import { optional, requireAdmin, revalidatePublic, schoolYear, text, type FormState } from "@/lib/admin";

/** A YouTube link, or the bare 11-character id an admin may paste instead. */
const readYoutube = (value: string) => youtubeId(value) ?? (/^[\w-]{11}$/.test(value) ? value : null);

export async function saveVideo(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const title_uz = text(form, "title_uz");
  if (!title_uz) return { error: "O‘zbekcha nom majburiy." };
  const category = text(form, "category");
  if (!(videoCategories as readonly string[]).includes(category)) return { error: "Turkumni tanlang." };

  const kind = text(form, "kind");
  let path: string | null;
  if (kind === "youtube") {
    path = readYoutube(text(form, "youtube"));
    if (!path) return { error: "YouTube havolasi noto‘g‘ri. Masalan: https://youtu.be/xxxxxxxxxxx" };
  } else if (kind === "file") {
    path = optional(form, "path");
    if (!path) return { error: "Video faylni yuklang yoki YouTube havolasini tanlang." };
  } else {
    return { error: "Video turini tanlang." };
  }

  const row = {
    title_uz,
    title_ru: optional(form, "title_ru"),
    title_en: optional(form, "title_en"),
    description_uz: optional(form, "description_uz"),
    description_ru: optional(form, "description_ru"),
    description_en: optional(form, "description_en"),
    category,
    kind,
    path,
    cover: kind === "file" ? optional(form, "cover") : null,
    recorded_on: optional(form, "recorded_on"),
    school_year: schoolYear(form),
    sort_order: Number(text(form, "sort_order")) || 0,
    is_published: form.get("is_published") === "on",
  };

  const { error } = id ? await supabase.from("videos").update(row).eq("id", id) : await supabase.from("videos").insert(row);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  redirect("/admin/videos");
}

export async function deleteVideo(id: number) {
  const { supabase } = await requireAdmin();
  // An uploaded file (and its poster) goes from the bucket too; a YouTube video is not ours to delete.
  const { data: row } = await supabase.from("videos").select("kind, path, cover").eq("id", id).maybeSingle();
  await supabase.from("videos").delete().eq("id", id);
  const files = [row?.kind === "file" ? row.path : null, row?.cover ?? null].filter((p): p is string => !!p);
  if (files.length) await supabase.storage.from("media").remove(files);
  revalidatePublic();
  redirect("/admin/videos");
}
