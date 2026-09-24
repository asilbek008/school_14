"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { youtubeId } from "@/lib/media";

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
  const { data: photo } = await supabase.from("gallery_photos").select("path").eq("id", photoId).eq("album_id", albumId).maybeSingle();
  if (!photo) return;
  await supabase.from("gallery_photos").delete().eq("id", photoId);
  await supabase.from("gallery_albums").update({ cover_photo: null }).eq("id", albumId).eq("cover_photo", photo.path);
  await supabase.storage.from("media").remove([photo.path]);
  revalidatePublic();
  revalidatePath(adminPath(albumId));
}

/** Saves the order the admin dragged the photos into (the site shows them in this order). */
export async function reorderPhotos(albumId: number, ids: number[]) {
  const { supabase } = await requireAdmin();
  const clean = ids.filter((id) => Number.isSafeInteger(id) && id > 0);
  await Promise.all(
    clean.map((id, i) => supabase.from("gallery_photos").update({ sort_order: i + 1 }).eq("id", id).eq("album_id", albumId)),
  );
  // Only the public site: the admin page already shows the new order.
  revalidatePublic();
}

async function nextVideoOrder(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], albumId: number) {
  const { data: last } = await supabase
    .from("gallery_videos")
    .select("sort_order")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (last?.sort_order ?? 0) + 1;
}

/** Registers video files the browser uploaded into media/gallery/<id>/. */
export async function addVideos(albumId: number, paths: string[]) {
  const { supabase } = await requireAdmin();
  const clean = paths.filter((p) => p.startsWith(`gallery/${albumId}/`));
  if (!clean.length) return;
  const start = await nextVideoOrder(supabase, albumId);
  await supabase.from("gallery_videos").insert(clean.map((path, i) => ({ album_id: albumId, kind: "video", path, sort_order: start + i })));
  revalidatePublic();
  revalidatePath(adminPath(albumId));
}

export async function addYoutube(albumId: number, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = youtubeId(text(form, "url"));
  if (!id) return { error: "Bu YouTube havolasi emas. Masalan: https://youtu.be/… yoki https://www.youtube.com/watch?v=…" };
  const { error } = await supabase
    .from("gallery_videos")
    .insert({ album_id: albumId, kind: "youtube", path: id, sort_order: await nextVideoOrder(supabase, albumId) });
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  revalidatePath(adminPath(albumId));
  return { ok: true };
}

export async function deleteVideo(albumId: number, videoId: number) {
  const { supabase } = await requireAdmin();
  const { data: video } = await supabase.from("gallery_videos").select("path, kind").eq("id", videoId).eq("album_id", albumId).maybeSingle();
  if (!video) return;
  await supabase.from("gallery_videos").delete().eq("id", videoId);
  if (video.kind !== "youtube") await supabase.storage.from("media").remove([video.path]);
  revalidatePublic();
  revalidatePath(adminPath(albumId));
}

export async function deleteAlbum(albumId: number) {
  const { supabase } = await requireAdmin();
  const [{ data: photos }, { data: videos }] = await Promise.all([
    supabase.from("gallery_photos").select("path").eq("album_id", albumId),
    supabase.from("gallery_videos").select("path, kind").eq("album_id", albumId),
  ]);
  await supabase.from("gallery_albums").delete().eq("id", albumId); // photo and video rows cascade
  const files = [...(photos ?? []).map((p) => p.path), ...(videos ?? []).filter((v) => v.kind !== "youtube").map((v) => v.path)];
  if (files.length) await supabase.storage.from("media").remove(files);
  revalidatePublic();
  redirect("/admin/gallery");
}
