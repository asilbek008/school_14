"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

const isStoragePath = (p: string | null | undefined): p is string => !!p && !/^https?:\/\//.test(p);

export async function saveBook(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const title_uz = text(form, "title_uz");
  if (!title_uz) return { error: "O‘zbekcha nom majburiy." };
  const path = optional(form, "path");
  const url = optional(form, "url");
  // A book is either an uploaded PDF or a link to one held elsewhere.
  const kind = path ? "file" : "link";
  if (!path && !url) return { error: "PDF faylni yuklang yoki kitob havolasini kiriting." };
  if (!path && url && !/^https?:\/\//i.test(url)) return { error: "Havola https:// bilan boshlansin." };
  const grade = Number.parseInt(text(form, "grade"), 10);
  const subjectId = Number.parseInt(text(form, "subject_id"), 10);
  const language = text(form, "language");
  const size = Number.parseInt(text(form, "file_size"), 10);
  const pages = Number.parseInt(text(form, "pages"), 10);

  const row = {
    title_uz,
    title_ru: optional(form, "title_ru"),
    title_en: optional(form, "title_en"),
    description_uz: optional(form, "description_uz"),
    description_ru: optional(form, "description_ru"),
    description_en: optional(form, "description_en"),
    grade: grade >= 1 && grade <= 11 ? grade : null,
    subject_id: subjectId > 0 ? subjectId : null,
    language: ["uz", "ru", "en"].includes(language) ? language : "uz",
    author: optional(form, "author")?.slice(0, 300) ?? null,
    edition: optional(form, "edition")?.slice(0, 60) ?? null,
    source: optional(form, "source")?.slice(0, 300) ?? null,
    kind,
    path: kind === "file" ? path : null,
    url: kind === "link" ? url : null,
    file_size: kind === "file" && Number.isSafeInteger(size) && size > 0 ? size : null,
    pages: kind === "file" && Number.isSafeInteger(pages) && pages > 0 ? pages : null,
    cover: optional(form, "cover"),
    is_published: form.get("is_published") === "on",
  };

  if (id) {
    // A replaced PDF or cover leaves the old file behind in Storage; remove it.
    const { data: before } = await supabase.from("textbooks").select("path, cover").eq("id", id).maybeSingle();
    const { error } = await supabase.from("textbooks").update(row).eq("id", id);
    if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
    const stale = [before?.path !== row.path && before?.path, before?.cover !== row.cover && before?.cover].filter(isStoragePath);
    if (stale.length) await supabase.storage.from("media").remove(stale);
  } else {
    const { data: last } = await supabase.from("textbooks").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from("textbooks").insert({ ...row, sort_order: (last?.sort_order ?? 0) + 10 });
    if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  }
  revalidatePublic();
  redirect("/admin/library");
}

export async function deleteBook(id: number) {
  const { supabase } = await requireAdmin();
  const { data: row } = await supabase.from("textbooks").select("path, cover").eq("id", id).maybeSingle();
  await supabase.from("textbooks").delete().eq("id", id);
  const files = [row?.path, row?.cover].filter(isStoragePath);
  if (files.length) await supabase.storage.from("media").remove(files);
  revalidatePublic();
  redirect("/admin/library");
}

/** Saves the order the admin dragged one grade's books into. */
export async function reorderBooks(ids: number[]) {
  const { supabase } = await requireAdmin();
  const clean = ids.filter((id) => Number.isSafeInteger(id) && id > 0);
  await Promise.all(clean.map((id, i) => supabase.from("textbooks").update({ sort_order: (i + 1) * 10 }).eq("id", id)));
  revalidatePublic();
}
