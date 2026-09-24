"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export type ApplicationStatus = "new" | "contacted" | "accepted" | "declined";

export async function setApplicationStatus(id: number, status: ApplicationStatus) {
  const { supabase } = await requireAdmin();
  await supabase.from("admission_applications").update({ status }).eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function setApplicationNote(id: number, note: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("admission_applications").update({ admin_note: note.trim().slice(0, 2000) || null }).eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function deleteApplication(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("admission_applications").delete().eq("id", id);
  revalidatePath("/admin", "layout");
}
