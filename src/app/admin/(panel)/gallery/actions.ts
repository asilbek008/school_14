"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

const adminPath = (id: number) => `/admin/gallery/${id}`;

export async function saveAlbum(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const title_uz = text(form, "title_uz");
  if (!title_uz) return { error: "O‘zbekcha nom majburiy." };
  const row = {
    title_uz,
    title_ru: optional(form, "title_ru"),
    title_en: optional(form, "title_en"),
    description_uz: text(form, "description_uz"),
    description_ru: optional(form, "description_ru"),
    description_en: optional(form, "description_en"),
    event_date: optional(form, "event_date"),
    is_published: form.get("is_published") === "on",
  };

  if (id) {
    const { error } = await supabase.from("gallery_albums").update(row).eq("id", id);
    if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
    revalidatePublic();
    redirect("/admin/gallery");
  }
  const { data, error } = await supabase.from("gallery_albums").insert(row).select("id").single();
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  // New album: continue straight to adding photos.
  redirect(adminPath(data.id));
}

/** Called by the photo uploader after files are in storage. */
export async function addPhotos(albumId: number, paths: string[]) {
  const { supabase } = await requireAdmin();
  const clean = paths.filter((p) => p.startsWith(`gallery/${albumId}/`));
  if (!clean.length) return;
  const { data: last } = await supabase
    .from("gallery_photos")
    .select("sort_order")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.sort_order ?? 0) + 1;
  await supabase.from("gallery_photos").insert(clean.map((path, i) => ({ album_id: albumId, path, sort_order: start + i })));
  revalidatePublic();
  revalidatePath(adminPath(albumId));
}

export async function setCover(albumId: number, path: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("gallery_albums").update({ cover_photo: path }).eq("id", albumId);
  revalidatePublic();
  revalidatePath(adminPath(albumId));
}

export async function deletePhoto(albumId: number, photoId: number) {
  const { supabase } = await requireAdmin();
  const { data: photo } = await supabase.from("gallery_photos").select("path").eq("id", photoId).maybeSingle();
  if (!photo) return;
  await supabase.from("gallery_photos").delete().eq("id", photoId);
  await supabase.from("gallery_albums").update({ cover_photo: null }).eq("id", albumId).eq("cover_photo", photo.path);
  await supabase.storage.from("media").remove([photo.path]);
  revalidatePublic();
  revalidatePath(adminPath(albumId));
}

export async function deleteAlbum(albumId: number) {
  const { supabase } = await requireAdmin();
  const { data: photos } = await supabase.from("gallery_photos").select("path").eq("album_id", albumId);
  await supabase.from("gallery_albums").delete().eq("id", albumId); // photos rows cascade
  if (photos?.length) await supabase.storage.from("media").remove(photos.map((p) => p.path));
  revalidatePublic();
  redirect("/admin/gallery");
}
