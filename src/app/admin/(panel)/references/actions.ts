"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export type ReferenceStatus = "new" | "ready" | "given" | "declined";

/**
 * Moves a request along: new → ready (the paper is written) → given (the parent collected it), or declined.
 * `ready_at` is stamped the first time it turns ready, because that date is what the parent sees.
 */
export async function setReferenceStatus(id: number, status: ReferenceStatus) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("reference_requests")
    .update({ status, ...(status === "ready" ? { ready_at: new Date().toISOString() } : {}) })
    .eq("id", id);
  revalidatePath("/admin/references");
}

export async function setReferenceNote(id: number, note: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("reference_requests").update({ admin_note: note.trim().slice(0, 2000) || null }).eq("id", id);
  revalidatePath("/admin/references");
}

export async function deleteReference(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("reference_requests").delete().eq("id", id);
  revalidatePath("/admin/references");
}
