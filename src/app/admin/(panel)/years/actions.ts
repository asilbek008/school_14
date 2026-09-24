"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

/** A whole number or null for an empty field; undefined when it is not a valid count. */
function count(form: FormData, name: string): number | null | undefined {
  const v = text(form, name);
  if (!v) return null;
  return /^\d{1,6}$/.test(v) ? Number(v) : undefined;
}

export async function saveYear(start: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const year = start ?? Number(text(form, "start_year"));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return { error: "O‘quv yilini tanlang." };

  const numbers = { students: count(form, "students"), staff: count(form, "staff"), classes: count(form, "classes"), graduates: count(form, "graduates") };
  if (Object.values(numbers).some((n) => n === undefined)) return { error: "Raqamlarni butun son bilan yozing (yoki bo‘sh qoldiring)." };

  const row = {
    ...numbers,
    summary_uz: text(form, "summary_uz"),
    summary_ru: optional(form, "summary_ru"),
    summary_en: optional(form, "summary_en"),
    is_published: form.get("is_published") === "on",
  };
  const { error } = start
    ? await supabase.from("school_years").update(row).eq("start_year", start)
    : await supabase.from("school_years").insert({ start_year: year, ...row });
  if (error) return { error: error.code === "23505" ? "Bu o‘quv yili allaqachon bor." : `Saqlab bo‘lmadi: ${error.message}` };

  revalidatePublic();
  redirect("/admin/years");
}

export async function deleteYear(start: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("school_years").delete().eq("start_year", start);
  revalidatePublic();
  redirect("/admin/years");
}
