"use server";

import { redirect } from "next/navigation";
import { optional, requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

export async function savePage(slug: string, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const title_uz = text(form, "title_uz");
  if (!title_uz) return { error: "O‘zbekcha sarlavha majburiy." };

  const { error } = await supabase
    .from("pages")
    .update({
      title_uz,
      title_ru: optional(form, "title_ru"),
      title_en: optional(form, "title_en"),
      body_uz: text(form, "body_uz"),
      body_ru: optional(form, "body_ru"),
      body_en: optional(form, "body_en"),
    })
    .eq("slug", slug);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };

  revalidatePublic();
  redirect("/admin/pages");
}
