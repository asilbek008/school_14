"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { youtubeId } from "@/lib/media";
import readXlsxFile from "read-excel-file/universal";
import { importStages, parseSchoolRounds, pickLeagueSheet, type LeagueStage } from "@/lib/league";

export async function saveProgram(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const name_uz = text(form, "name_uz");
  if (!name_uz) return { error: "O‘zbekcha nom majburiy." };
  const slug = text(form, "slug").toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Havola nomi faqat lotin harflari, raqamlar va chiziqchadan iborat bo‘lsin (masalan: zakovat)." };
  }
  const keyword = optional(form, "keyword");
  if (keyword && !/^[\p{L}\p{N} ‘’'-]{3,40}$/u.test(keyword)) {
    return { error: "Kalit so‘z 3–40 belgi bo‘lsin: harf, raqam, bo‘sh joy yoki chiziqcha." };
  }

  const row = {
    slug,
    name_uz,
    name_ru: optional(form, "name_ru"),
    name_en: optional(form, "name_en"),
    summary_uz: text(form, "summary_uz"),
    summary_ru: optional(form, "summary_ru"),
    summary_en: optional(form, "summary_en"),
    description_uz: text(form, "description_uz"),
    description_ru: optional(form, "description_ru"),
    description_en: optional(form, "description_en"),
    schedule_uz: optional(form, "schedule_uz"),
    schedule_ru: optional(form, "schedule_ru"),
    schedule_en: optional(form, "schedule_en"),
    place_uz: optional(form, "place_uz"),
    place_ru: optional(form, "place_ru"),
    place_en: optional(form, "place_en"),
    keyword,
    cover: optional(form, "cover"),
    is_published: form.get("is_published") === "on",
  };

  if (id) {
    const { error } = await supabase.from("programs").update(row).eq("id", id);
    if (error?.code === "23505") return { error: "Bu havola nomi band — boshqasini tanlang." };
    if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
    revalidatePublic();
    redirect("/admin/programs");
  }

  // A new program goes to the end of the list, then to its page to add photos and videos.
  const { data: last } = await supabase.from("programs").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data: created, error } = await supabase
    .from("programs")
    .insert({ ...row, sort_order: (last?.sort_order ?? 0) + 10 })
    .select("id")
    .single();
  if (error?.code === "23505") return { error: "Bu havola nomi band — boshqasini tanlang." };
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  redirect(`/admin/programs/${created.id}`);
}

export async function deleteProgram(id: number) {
  const { supabase } = await requireAdmin();
  const { data: media } = await supabase.from("program_media").select("path, kind").eq("program_id", id);
  await supabase.from("programs").delete().eq("id", id); // media rows cascade
  const files = (media ?? []).filter((m) => m.kind !== "youtube").map((m) => m.path);
  if (files.length) await supabase.storage.from("media").remove(files);
  revalidatePublic();
  redirect("/admin/programs");
}

/** Saves the order the admin dragged the programs into. */
export async function reorderPrograms(ids: number[]) {
  const { supabase } = await requireAdmin();
  const clean = ids.filter((id) => Number.isSafeInteger(id) && id > 0);
  await Promise.all(clean.map((id, i) => supabase.from("programs").update({ sort_order: (i + 1) * 10 }).eq("id", id)));
  // Only the public site: the admin list already shows the new order.
  revalidatePublic();
}

async function nextMediaOrder(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], programId: number) {
  const { data: last } = await supabase
    .from("program_media")
    .select("sort_order")
    .eq("program_id", programId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (last?.sort_order ?? 0) + 1;
}

/** Registers photos or video files the browser uploaded into media/programs/<id>/. */
export async function addProgramMedia(programId: number, kind: "photo" | "video", paths: string[]) {
  const { supabase } = await requireAdmin();
  const clean = paths.filter((p) => p.startsWith(`programs/${programId}/`));
  if (!clean.length || (kind !== "photo" && kind !== "video")) return;
  const start = await nextMediaOrder(supabase, programId);
  await supabase.from("program_media").insert(clean.map((path, i) => ({ program_id: programId, kind, path, sort_order: start + i })));
  revalidatePublic();
  revalidatePath(`/admin/programs/${programId}`);
}

export async function addProgramYoutube(programId: number, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = youtubeId(text(form, "url"));
  if (!id) return { error: "Bu YouTube havolasi emas. Masalan: https://youtu.be/… yoki https://www.youtube.com/watch?v=…" };
  const { error } = await supabase
    .from("program_media")
    .insert({ program_id: programId, kind: "youtube", path: id, sort_order: await nextMediaOrder(supabase, programId) });
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePublic();
  revalidatePath(`/admin/programs/${programId}`);
  return { ok: true };
}

/** Saves the photo order (photos and videos share sort_order; only the photos are renumbered). */
export async function reorderProgramPhotos(programId: number, ids: number[]) {
  const { supabase } = await requireAdmin();
  const clean = ids.filter((id) => Number.isSafeInteger(id) && id > 0);
  await Promise.all(
    clean.map((id, i) => supabase.from("program_media").update({ sort_order: i + 1 }).eq("id", id).eq("program_id", programId).eq("kind", "photo")),
  );
  revalidatePublic();
}

export async function deleteProgramMedia(programId: number, mediaId: number) {
  const { supabase } = await requireAdmin();
  const { data: item } = await supabase.from("program_media").select("path, kind").eq("id", mediaId).eq("program_id", programId).maybeSingle();
  if (!item) return;
  await supabase.from("program_media").delete().eq("id", mediaId);
  if (item.kind !== "youtube") await supabase.storage.from("media").remove([item.path]);
  revalidatePublic();
  revalidatePath(`/admin/programs/${programId}`);
}

/** Replaces a stage's league table with the one in the uploaded Excel file (the league's own layout). */
export async function importLeague(programId: number, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const stage = text(form, "stage") as (typeof importStages)[number];
  if (!importStages.includes(stage)) return { error: "Bosqichni tanlang." };
  const file = form.get("file");
  if (!(file instanceof Blob) || !file.size) return { error: "Excel faylni tanlang." };
  if (file.size > 900_000) return { error: "Fayl juda katta (900 KB gacha bo‘lsin)." };

  let sheets;
  try {
    sheets = await readXlsxFile(file);
  } catch {
    return { error: "Faylni o‘qib bo‘lmadi. Uni Excel'da .xlsx formatida saqlang." };
  }
  const { rows, error } = pickLeagueSheet(sheets);
  if (error || !rows.length) return { error: error ?? "Jadvalda jamoa topilmadi." };

  const { error: dbError } = await supabase.from("league_tables").upsert({
    program_id: programId,
    stage,
    title: optional(form, "title"),
    as_of: optional(form, "as_of"),
    rows,
    updated_at: new Date().toISOString(),
  });
  if (dbError) return { error: `Saqlab bo‘lmadi: ${dbError.message}` };
  revalidatePublic();
  redirect(`/admin/programs/${programId}?league=${stage}&teams=${rows.length}#league`);
}

/** The school stage: results of the rounds played at our school, one team per line. */
export async function saveSchoolLeague(programId: number, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { rows, error } = parseSchoolRounds(text(form, "results"));
  if (error) return { error };
  const { error: dbError } = await supabase.from("league_tables").upsert({
    program_id: programId,
    stage: "school",
    title: optional(form, "title"),
    as_of: optional(form, "as_of"),
    rows,
    updated_at: new Date().toISOString(),
  });
  if (dbError) return { error: `Saqlab bo‘lmadi: ${dbError.message}` };
  revalidatePublic();
  redirect(`/admin/programs/${programId}?league=school&teams=${rows.length}#league`);
}

export async function deleteLeague(programId: number, stage: LeagueStage) {
  const { supabase } = await requireAdmin();
  await supabase.from("league_tables").delete().eq("program_id", programId).eq("stage", stage);
  revalidatePublic();
  revalidatePath(`/admin/programs/${programId}`);
}
