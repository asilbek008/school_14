"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";

/**
 * Saves the model key. The key itself is written straight into the database and never read back into the
 * panel: the page only ever learns whether one is there.
 */
export async function saveAi(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const key = text(form, "api_key").replace(/\s/g, "");
  if (key && !/^sk-[A-Za-z0-9_-]{20,}$/.test(key)) {
    return { error: "Kalit noto‘g‘ri ko‘rinishda. Anthropic konsolidagi to‘liq kalitni nusxalang (sk-… bilan boshlanadi)." };
  }
  const { error } = await supabase.rpc("ai_save", {
    p_key: key || null,
    p_model: text(form, "model") || null,
    p_enabled: form.get("enabled") === "on",
  });
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePath("/admin/ai");
  revalidatePublic();
  return { ok: true };
}

export async function forgetAi() {
  const { supabase } = await requireAdmin();
  await supabase.rpc("ai_forget");
  revalidatePath("/admin/ai");
  revalidatePublic();
}
