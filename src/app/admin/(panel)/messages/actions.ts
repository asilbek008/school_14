"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export async function setMessageRead(id: number, isRead: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from("contact_messages").update({ is_read: isRead }).eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function deleteMessage(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("contact_messages").delete().eq("id", id);
  revalidatePath("/admin", "layout");
}
