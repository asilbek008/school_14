"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

/** "Hozir zaxira olish": a snapshot now, besides the weekly one. */
export async function takeBackup() {
  const { supabase } = await requireAdmin();
  await supabase.rpc("take_backup_now");
  revalidatePath("/admin/backups");
}
