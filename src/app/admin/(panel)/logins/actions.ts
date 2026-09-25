"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

/** Turns the Telegram notice about sign-ins (and repeated wrong passwords) on or off. */
export async function setLoginNotify(on: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from("telegram_settings").update({ notify_logins: on }).eq("id", 1);
  revalidatePath("/admin/logins");
}
