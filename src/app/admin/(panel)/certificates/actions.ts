"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

/** Removing the row makes that certificate read as "not found" when someone checks it. */
export async function deleteCertificate(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("certificates").delete().eq("id", id);
  revalidatePath("/admin/certificates");
}
