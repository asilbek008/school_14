"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { documentCategories } from "@/lib/categories";

const isCategory = (value: string) => (documentCategories as readonly string[]).includes(value);

export async function saveDocument(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const title_uz = text(form, "title_uz");
  if (!title_uz) return { error: "O‘zbekcha nom majburiy." };
  const category = text(form, "category");
  if (!isCategory(category)) return { error: "Bo‘limni tanlang." };

  const path = optional(form, "path");
  const url = optional(form, "url");
  // A document is either an uploaded file or a link to one held elsewhere.
  const kind = path ? "file" : "link";
  if (!path && !url) return { error: "Faylni yuklang yoki hujjat havolasini kiriting." };
  if (url && !/^https?:\/\//i.test(url)) return { error: "Havola https:// bilan boshlansin." };

  const size = Number.parseInt(text(form, "file_size"), 10);
  const row = {
    title_uz,
    title_ru: optional(form, "title_ru"),
    title_en: optional(form, "title_en"),
    description_uz: optional(form, "description_uz"),
    description_ru: optional(form, "description_ru"),
    description_en: optional(form, "description_en"),
    category,
    kind,
    path: kind === "file" ? path : null,
    url: kind === "link" ? url : null,
    file_type: kind === "file" ? (path?.split(".").pop()?.toLowerCase() ?? null) : null,
    file_size: kind === "file" && Number.isSafeInteger(size) && size > 0 ? size : null,
    doc_date: optional(form, "doc_date"),
    is_published: form.get("is_published") === "on",
  };

  if (id) {
    // A replaced file leaves the old one behind in Storage; remove it.
    const { data: before } = await supabase.from("documents").select("path").eq("id", id).maybeSingle();
    const { error } = await supabase.from("documents").update(row).eq("id", id);
    if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
    if (before?.path && before.path !== row.path) await supabase.storage.from("media").remove([before.path]);
  } else {
    const { data: last } = await supabase.from("documents").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from("documents").insert({ ...row, sort_order: (last?.sort_order ?? 0) + 10 });
    if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  }
  revalidatePublic();
  redirect("/admin/documents");
}

export async function deleteDocument(id: number) {
  const { supabase } = await requireAdmin();
  const { data: row } = await supabase.from("documents").select("path").eq("id", id).maybeSingle();
  await supabase.from("documents").delete().eq("id", id);
  if (row?.path) await supabase.storage.from("media").remove([row.path]);
  revalidatePublic();
  redirect("/admin/documents");
}

/** Saves the order the admin dragged the documents into. */
export async function reorderDocuments(ids: number[]) {
  const { supabase } = await requireAdmin();
  const clean = ids.filter((id) => Number.isSafeInteger(id) && id > 0);
  await Promise.all(clean.map((id, i) => supabase.from("documents").update({ sort_order: (i + 1) * 10 }).eq("id", id)));
  revalidatePublic();
}
