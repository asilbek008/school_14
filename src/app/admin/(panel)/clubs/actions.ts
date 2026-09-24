"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { youtubeId } from "@/lib/media";

const grade = (form: FormData, name: string) => {
  const n = Number.parseInt(text(form, name), 10);
  return n >= 1 && n <= 11 ? n : null;
};
const time = (form: FormData, name: string) => {
  const v = text(form, name);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null;
};

export async function saveClub(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const name_uz = text(form, "name_uz");
  if (!name_uz) return { error: "O‘zbekcha nom majburiy." };
  const grade_from = grade(form, "grade_from");
  const grade_to = grade(form, "grade_to");
  if (grade_from && grade_to && grade_from > grade_to) return { error: "Sinflar oralig‘i noto‘g‘ri." };
  const start_time = time(form, "start_time");
  const end_time = time(form, "end_time");
  if (end_time && !start_time) return { error: "Tugash vaqtidan oldin boshlanish vaqtini kiriting." };
  if (start_time && end_time && end_time <= start_time) return { error: "Tugash vaqti boshlanishidan keyin bo‘lsin." };
  const days = [...new Set(form.getAll("days").map(Number))].filter((d) => d >= 1 && d <= 6).sort();
  const leaderId = Number.parseInt(text(form, "leader_id"), 10);

  const row = {
    name_uz,
    name_ru: optional(form, "name_ru"),
    name_en: optional(form, "name_en"),
    description_uz: text(form, "description_uz"),
    description_ru: optional(form, "description_ru"),
    description_en: optional(form, "description_en"),
    schedule_uz: optional(form, "schedule_uz"),
    schedule_ru: optional(form, "schedule_ru"),
    schedule_en: optional(form, "schedule_en"),
    place_uz: optional(form, "place_uz"),
    place_ru: optional(form, "place_ru"),
    place_en: optional(form, "place_en"),
    grade_from,
    grade_to,
    days,
    start_time,
    end_time,
    leader_id: leaderId > 0 ? leaderId : null,
    leader: optional(form, "leader"),
    photo: optional(form, "photo"),
    is_published: form.get("is_published") === "on",
  };

  if (id) {
    const { error } = await supabase.from("clubs").update(row).eq("id", id);
    if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
    revalidatePublic();
    redirect("/admin/clubs");
  }

  // A new club goes to the end of the list, then to its page to add photos and videos.
  const { data: last } = await supabase.from("clubs").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data: created, error } = await supabase
    .from("clubs")
    .insert({ ...row, sort_order: (last?.sort_order ?? 0) + 10 })
    .select("id")
    .single();
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  redirect(`/admin/clubs/${created.id}`);
}

export async function deleteClub(id: number) {
  const { supabase } = await requireAdmin();
  const { data: media } = await supabase.from("club_media").select("path, kind").eq("club_id", id);
  await supabase.from("clubs").delete().eq("id", id);
  // The rows go with the club (on delete cascade); the uploaded files are removed here.
  const files = (media ?? []).filter((m) => m.kind !== "youtube").map((m) => m.path);
  if (files.length) await supabase.storage.from("media").remove(files);
  revalidatePublic();
  redirect("/admin/clubs");
}

/** Saves the order the admin dragged the clubs into. */
export async function reorderClubs(ids: number[]) {
  const { supabase } = await requireAdmin();
  const clean = ids.filter((id) => Number.isSafeInteger(id) && id > 0);
  await Promise.all(clean.map((id, i) => supabase.from("clubs").update({ sort_order: (i + 1) * 10 }).eq("id", id)));
  // Only the public site: the admin list already shows the new order (refreshing it would remount the list).
  revalidatePublic();
}

async function nextMediaOrder(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], clubId: number) {
  const { data: last } = await supabase
    .from("club_media")
    .select("sort_order")
    .eq("club_id", clubId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (last?.sort_order ?? 0) + 1;
}

/** Registers photos or video files the browser uploaded into media/clubs/<id>/. */
export async function addClubMedia(clubId: number, kind: "photo" | "video", paths: string[]) {
  const { supabase } = await requireAdmin();
  const clean = paths.filter((p) => p.startsWith(`clubs/${clubId}/`));
  if (!clean.length || (kind !== "photo" && kind !== "video")) return;
  const start = await nextMediaOrder(supabase, clubId);
  await supabase.from("club_media").insert(clean.map((path, i) => ({ club_id: clubId, kind, path, sort_order: start + i })));
  revalidatePublic();
  revalidatePath(`/admin/clubs/${clubId}`);
}

export async function addClubYoutube(clubId: number, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = youtubeId(text(form, "url"));
  if (!id) return { error: "Bu YouTube havolasi emas. Masalan: https://youtu.be/… yoki https://www.youtube.com/watch?v=…" };
  const { error } = await supabase
    .from("club_media")
    .insert({ club_id: clubId, kind: "youtube", path: id, sort_order: await nextMediaOrder(supabase, clubId) });
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  revalidatePath(`/admin/clubs/${clubId}`);
  return { ok: true };
}

export async function deleteClubMedia(clubId: number, mediaId: number) {
  const { supabase } = await requireAdmin();
  const { data: item } = await supabase.from("club_media").select("path, kind").eq("id", mediaId).eq("club_id", clubId).maybeSingle();
  if (!item) return;
  await supabase.from("club_media").delete().eq("id", mediaId);
  if (item.kind !== "youtube") await supabase.storage.from("media").remove([item.path]);
  revalidatePublic();
  revalidatePath(`/admin/clubs/${clubId}`);
}
