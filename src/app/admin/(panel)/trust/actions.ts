"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export async function setTrustRead(id: number, isRead: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from("trust_messages").update({ is_read: isRead }).eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function deleteTrustMessage(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("trust_messages").delete().eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function markAllTrustRead() {
  const { supabase } = await requireAdmin();
  await supabase.from("trust_messages").update({ is_read: true }).eq("is_read", false);
  revalidatePath("/admin", "layout");
}
