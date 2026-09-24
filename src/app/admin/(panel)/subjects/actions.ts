"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

export async function saveSubject(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const name_uz = text(form, "name_uz");
  if (!name_uz) return { error: "O‘zbekcha nomi majburiy." };

  const row = {
    name_uz,
    name_ru: optional(form, "name_ru"),
    name_en: optional(form, "name_en"),
  };

  let error;
  if (id) {
    ({ error } = await supabase.from("subjects").update(row).eq("id", id));
  } else {
    // A new subject goes to the end of the list.
    const { data: last } = await supabase.from("subjects").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    ({ error } = await supabase.from("subjects").insert({ ...row, sort_order: (last?.sort_order ?? 0) + 10 }));
  }
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };

  revalidatePublic();
  redirect("/admin/subjects");
}

export async function deleteSubject(id: number) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  // 23503 = foreign key violation: the subject is still used in some timetable.
  if (error) redirect(`/admin/subjects/${id}?error=${error.code === "23503" ? "used" : "failed"}`);
  revalidatePublic();
  redirect("/admin/subjects");
}

/** Saves the order the admin dragged the subjects into (the timetable editor lists them in this order). */
export async function reorderSubjects(ids: number[]) {
  const { supabase } = await requireAdmin();
  const clean = ids.filter((id) => Number.isSafeInteger(id) && id > 0);
  await Promise.all(clean.map((id, i) => supabase.from("subjects").update({ sort_order: (i + 1) * 10 }).eq("id", id)));
  revalidatePublic();
}
